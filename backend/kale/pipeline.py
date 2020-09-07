#  Copyright 2020 The Kale Authors
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import os
import logging
import networkx as nx

from typing import Iterable
from kubernetes.config import ConfigException

from kale import Step
from kale.config import Config, Field, validators
from kale.static_analysis.ast import PipelineParam
from kale.common import graphutils, utils, podutils

log = logging.getLogger(__name__)


class VolumeConfig(Config):
    """Used for validating the `volumes` field of NotebookConfig."""
    name = Field(type=str, required=True,
                 validators=[validators.K8sNameValidator])
    mount_point = Field(type=str, required=True)
    snapshot = Field(type=bool, default=False)
    snapshot_name = Field(type=str)
    size = Field(type=int)  # fixme: validation for this field?
    size_type = Field(type=str)  # fixme: validation for this field?
    type = Field(type=str, required=True,
                 validators=[validators.VolumeTypeValidator])
    annotations = Field(type=list, default=list())

    def _postprocess(self):
        # Convert annotations to a {k: v} dictionary
        try:
            # TODO: Make JupyterLab annotate with {k: v} instead of
            #  {'key': k, 'value': v}
            self.annotations = {a['key']: a['value']
                                for a in self.annotations
                                if a['key'] != '' and a['value'] != ''}
        except KeyError as e:
            if str(e) in ["'key'", "'value'"]:
                raise ValueError("Volume spec: volume annotations must be a"
                                 " list of {'key': k, 'value': v} dicts")
            else:
                raise e


class KatibConfig(Config):
    """Used to validate the `katib_metadata` field of NotebookConfig."""
    # fixme: improve validation of single fields
    parameters = Field(type=list, default=[])
    objective = Field(type=dict, default={})
    algorithm = Field(type=dict, default={})
    # fixme: Change these names to be Pythonic (need to change how the
    #  labextension passes them)
    maxTrialCount = Field(type=int, default=12)
    maxFailedTrialCount = Field(type=int, default=3)
    parallelTrialCount = Field(type=int, default=3)


class PipelineConfig(Config):
    """Main config class to validate the pipeline metadata."""
    pipeline_name = Field(type=str, required=True,
                          validators=[validators.PipelineNameValidator])
    experiment_name = Field(type=str, required=True)
    pipeline_description = Field(type=str, default="")
    docker_image = Field(type=str, default="")
    volumes = Field(type=list, items_config=VolumeConfig, default=[])
    katib_run = Field(type=bool, default=False)
    katib_metadata = Field(type=KatibConfig)
    abs_working_dir = Field(type=str, default="")
    marshal_volume = Field(type=bool, default=True)
    marshal_path = Field(type=str, default="/marshal")
    autosnapshot = Field(type=bool, default=True)
    steps_defaults = Field(type=dict, default=dict())
    kfp_host = Field(type=str)

    @property
    def source_path(self):
        """Get the path to the main entry point script."""
        return utils.get_main_source_path()

    def _postprocess(self):
        self._randomize_pipeline_name()
        self._set_docker_image()
        self._sort_volumes()
        self._set_abs_working_dir()
        self._set_marshal_path()

    def _randomize_pipeline_name(self):
        self.pipeline_name = "%s-%s" % (self.pipeline_name,
                                        utils.random_string())

    def _set_docker_image(self):
        if not self.docker_image:
            try:
                # will fail in case in cluster config is not found
                self.docker_image = podutils.get_docker_base_image()
            except ConfigException:
                # no K8s config found; use kfp default image
                self.docker_image = ""

    def _sort_volumes(self):
        # The Jupyter Web App assumes the first volume of the notebook is the
        # working directory, so we make sure to make it appear first in the
        # spec.
        self.volumes = sorted(self.volumes,
                              reverse=True,
                              key=lambda _v: podutils.is_workspace_dir(
                                  _v.mount_point))

    def _set_abs_working_dir(self):
        if not self.abs_working_dir:
            self.abs_working_dir = utils.abs_working_dir(self.source_path)

    def _set_marshal_path(self):
        # Check if the workspace directory is under a mounted volume.
        # If so, marshal data into a folder in that volume,
        # otherwise create a new volume and mount it at /marshal
        wd = os.path.realpath(self.abs_working_dir)
        # get the volumes for which the working directory is a sub-path of
        # the mount point
        vols = list(
            filter(lambda x: wd.startswith(x.mount_point), self.volumes))
        # if we found any, then set marshal directory inside working directory
        if len(vols) > 0:
            basename = os.path.basename(self.source_path)
            marshal_dir = ".{}.kale.marshal.dir".format(basename)
            self.marshal_volume = False
            self.marshal_path = os.path.join(wd, marshal_dir)


class Pipeline(nx.DiGraph):
    """A Pipeline that can be converted into a KFP pipeline.

    This class is used to define a pipeline, its steps and all its
    configurations. It extends nx.DiGraph to exploit some graph-related
    algorithms but provides helper functions to work with Step objects
    instead of standard networkx "nodes". This makes it simpler to access
    the steps of the pipeline and their attributes.
    """
    def __init__(self, config: PipelineConfig, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.config = config
        self.pipeline_parameters = dict()

    def add_step(self, step: Step):
        """Add a new Step to the pipeline."""
        if not isinstance(step, Step):
            raise RuntimeError("Not of type Step.")
        if step.name in self.steps_names:
            raise RuntimeError("Step with name '%s' already exists"
                               % step.name)
        self.add_node(step.name, step=step)

    def add_dependency(self, parent: Step, child: Step):
        """Link two Steps in the pipeline."""
        self.add_edge(parent.name, child.name)

    def get_step(self, name: str) -> Step:
        """Get the Step with the provided name."""
        return self.nodes()[name]["step"]

    @property
    def steps(self) -> Iterable[Step]:
        """Get the Steps objects sorted topologically."""
        return map(lambda x: self.nodes()[x]["step"], self.steps_names)

    @property
    def steps_names(self):
        """Get all Steps' names, sorted topologically."""
        return [step.name for step in self._topological_sort()]

    @property
    def all_steps_parameters(self):
        """Create a dict with step names and their parameters."""
        return {step: sorted(self.get_step(step).parameters.keys())
                for step in self.steps_names}

    @property
    def pipeline_dependencies_tasks(self):
        """Generate a dictionary of Pipeline dependencies."""
        return {step_name: ["%s_task" % pred
                            for pred in self.predecessors(step_name)]
                for step_name in self.steps_names}

    def set_volume_pipeline_parameters(self):
        """Create pipeline parameters for volumes to be mounted on steps."""
        volume_parameters = dict()
        for v in self.config.volumes:  # type: VolumeConfig
            if v.type == 'pv':
                # FIXME: How should we handle existing PVs?
                continue
            if v.type == 'pvc':
                mount_point = v.mount_point.replace('/', '_').strip('_')
                par_name = "vol_{}".format(mount_point)
                volume_parameters[par_name] = PipelineParam("str", v.name)
            elif v.type == 'new_pvc':
                rok_url = v.annotations.get("rok/origin")
                if rok_url is not None:
                    par_name = "rok_{}_url".format(v.name.replace('-', '_'))
                    volume_parameters[par_name] = PipelineParam("str", rok_url)
            else:
                raise ValueError("Unknown volume type: {}".format(v.type))
        self.pipeline_parameters.update(volume_parameters)

    def merge_code(self, dst: str, source_code: str):
        """Add a new code block to an existing step.

        Args:
            dst (str): Name id of the destination step
            source_code (str): Python source code to be appended to dst step
        """
        step = self.get_step(dst)
        step.source += [source_code]

    def _topological_sort(self) -> Iterable[Step]:
        return self._steps_iterable(nx.topological_sort(self))

    def get_ordered_ancestors(self, step_name: str) -> Iterable[Step]:
        """Wrapper of graphutils.get_ordered_ancestors.

        Returns:
            Iterable[Step]: A Steps iterable.
        """
        return self._steps_iterable(
            graphutils.get_ordered_ancestors(self, step_name))

    def _steps_iterable(self, step_names: Iterable[str]) -> Iterable[Step]:
        for name in step_names:
            yield self.get_step(name)

    def get_leaf_steps(self):
        """Get the list of leaf steps of the pipeline.

        A step is considered a leaf when its in-degree is > 0 and its
        out-degree is 0.

        Returns (list): A list of leaf Steps.
        """
        return [x for x in self.steps if self.out_degree(x.name) == 0]

    def show(self):
        """Print the pipeline nodes and dependencies in a table."""
        from tabulate import tabulate
        data = []
        for step in self.steps:
            data.append([step.name, [x for x in self.predecessors(step.name)]])
        log.info("Pipeline layout:")
        log.info("\n" + tabulate(data, headers=["Step", "Depends On"]) + "\n")
