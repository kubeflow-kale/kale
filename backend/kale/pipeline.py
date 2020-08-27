# Copyright 2020 The Kale Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
import networkx as nx

from typing import Iterable

from kale import Step
from kale.config import NotebookConfig, VolumeConfig
from kale.static_analysis.ast import PipelineParam
from kale.common import graphutils

log = logging.getLogger(__name__)


class Pipeline(nx.DiGraph):
    """A Pipeline that can be converted into a KFP pipeline.

    This class is used to define a pipeline, its steps and all its
    configurations. It extends nx.DiGraph to exploit some graph-related
    algorithms but provides helper functions to work with Step objects
    instead of standard networkx "nodes". This makes it simpler to access
    the steps of the pipeline and their attributes.
    """
    def __init__(self, config: NotebookConfig, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.config = config
        self.pipeline_parameters = dict()
        self._pps_names = None

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

    def show(self):
        """Print the pipeline nodes and dependencies in a table."""
        from tabulate import tabulate
        data = []
        for step in self.steps:
            data.append([step.name, [x for x in self.predecessors(step.name)]])
        log.info("Pipeline layout:")
        log.info("\n" + tabulate(data, headers=["Step", "Depends On"]) + "\n")
