# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import copy
import logging
import networkx as nx

from typing import Iterable, Dict
from kubernetes.config import ConfigException
from kubernetes.client.rest import ApiException

from kale.step import Step, PipelineParam
from kale.config import Config, Field, validators
from kale.common import graphutils, utils, podutils

log = logging.getLogger(__name__)


VOLUME_ACCESS_MODE_MAP = {"rom": ["ReadOnlyMany"], "rwo": ["ReadWriteOnce"],
                          "rwm": ["ReadWriteMany"]}
DEFAULT_VOLUME_ACCESS_MODE = VOLUME_ACCESS_MODE_MAP["rwm"]


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
    storage_class_name = Field(type=str,
                               validators=[validators.K8sNameValidator])
    volume_access_mode = Field(
        type=str, validators=[validators.IsLowerValidator,
                              validators.VolumeAccessModeValidator])

    def _parse_annotations(self):
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

    def _parse_access_mode(self):
        if self.volume_access_mode:
            self.volume_access_mode = (
                VOLUME_ACCESS_MODE_MAP[self.volume_access_mode]
            )

    def _postprocess(self):
        self._parse_annotations()
        self._parse_access_mode()


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
    base_image = Field(type=str, default="")
    volumes = Field(type=list, items_config_type=VolumeConfig, default=[])
    katib_run = Field(type=bool, default=False)
    katib_metadata = Field(type=KatibConfig)
    abs_working_dir = Field(type=str, default="")
    marshal_volume = Field(type=bool, default=True)
    marshal_path = Field(type=str, default="/marshal")
    steps_defaults = Field(type=dict, default=dict())
    kfp_host = Field(type=str)
    storage_class_name = Field(type=str,
                               validators=[validators.K8sNameValidator])
    volume_access_mode = Field(
        type=str, validators=[validators.IsLowerValidator,
                              validators.VolumeAccessModeValidator])
    timeout = Field(type=int, validators=[validators.PositiveIntegerValidator])

    @property
    def source_path(self):
        """Get the path to the main entry point script."""
        return utils.get_main_source_path()

    def _postprocess(self):
        # self._randomize_pipeline_name()
        self._set_base_image()
        self._set_volume_storage_class()
        self._set_volume_access_mode()
        self._sort_volumes()
        self._set_abs_working_dir()
        self._set_marshal_path()

    def _randomize_pipeline_name(self):
        self.pipeline_name = "%s-%s" % (self.pipeline_name,
                                        utils.random_string())

    def _set_base_image(self):
        if not self.base_image:
            try:
                self.base_image = podutils.get_docker_base_image()
            except (ConfigException, RuntimeError, FileNotFoundError,
                    ApiException):
                # * ConfigException: no K8s config found
                # * RuntimeError, FileNotFoundError: this is not running in a
                #   pod
                # * ApiException: K8s call to read pod raised exception;
                # Use kfp default image
                self.base_image = ""

    def _set_volume_storage_class(self):
        if not self.storage_class_name:
            return
        for v in self.volumes:
            if not v.storage_class_name:
                v.storage_class_name = self.storage_class_name

    def _set_volume_access_mode(self):
        if not self.volume_access_mode:
            self.volume_access_mode = DEFAULT_VOLUME_ACCESS_MODE
        else:
            self.volume_access_mode = VOLUME_ACCESS_MODE_MAP[
                self.volume_access_mode]
        for v in self.volumes:
            if not v.volume_access_mode:
                v.volume_access_mode = self.volume_access_mode

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
            filter(lambda x: wd.startswith(x.mount_point), self.volumes)
        )
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
        self.pipeline_parameters: Dict[str, PipelineParam] = dict()
        self.processor = None
        self._pps_names = None

    def run(self):
        """Runs the steps locally in topological sort."""
        for step in self.steps:
            step.run(self.pipeline_parameters)

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
        return {step_name: list(self.predecessors(step_name))
                for step_name in self.steps_names}

    @property
    def pps_names(self):
        """Get the names of the pipeline parameters sorted."""
        if self._pps_names is None:
            self._pps_names = sorted(self.pipeline_parameters.keys())
        return self._pps_names

    @property
    def pps_types(self):
        """Get the types of the pipeline parameters, sorted by name."""
        return [self.pipeline_parameters[n].param_type for n in self.pps_names]

    @property
    def pps_values(self):
        """Get the values of the pipeline parameters, sorted by name."""
        return [self.pipeline_parameters[n].param_value
                for n in self.pps_names]

    def _topological_sort(self) -> Iterable[Step]:
        return self._steps_iterable(nx.topological_sort(self))

    def get_ordered_ancestors(self, step_name: str) -> Iterable[Step]:
        """Return the ancestors of a step in an ordered manner.

        Wrapper of graphutils.get_ordered_ancestors.

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

    def override_pipeline_parameters_from_kwargs(self, **kwargs):
        """Overwrite the current pipeline parameters with provided inputs."""
        _pipeline_parameters = copy.deepcopy(self.pipeline_parameters)
        for k, v in kwargs.items():
            if k not in self.pipeline_parameters:
                raise RuntimeError("Running pipeline '%s' with"
                                   " an input argument that is not in its"
                                   " parameters: %s"
                                   % (self.config.pipeline_name, k))
            # replace default value with the provided one
            _type = _pipeline_parameters[k].param_type
            _pipeline_parameters[k] = PipelineParam(_type, v)
        self.pipeline_parameters = _pipeline_parameters

    def show(self):
        """Print the pipeline nodes and dependencies in a table."""
        from tabulate import tabulate
        data = []
        for step in self.steps:
            data.append([step.name, [x for x in self.predecessors(step.name)]])
        log.info("Pipeline layout:")
        log.info("\n" + tabulate(data, headers=["Step", "Depends On"]) + "\n")
