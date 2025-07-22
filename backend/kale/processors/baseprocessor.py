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

import copy
import logging

from abc import ABC, abstractmethod

from kale.common import kfutils
from kale.pipeline import Pipeline, PipelineConfig, Step, PipelineParam, VolumeConfig
from typing import Optional

log = logging.getLogger(__name__)



class BaseProcessor(ABC):
    """Provides basic tools for processors to generate a Pipeline object."""

    id: str
    no_op_step: Step
    config_cls = PipelineConfig

    def __init__(self,
                 config: Optional[PipelineConfig] = None,
                 skip_validation: bool = False,
                 **kwargs):
        self.config = config
        if not config and not skip_validation:
            self.config = self.config_cls(**kwargs)
        self.pipeline = Pipeline(self.config) if self.config else None

    def run(self) -> Pipeline:
        """Process the source into a Pipeline object."""
        self.to_pipeline()
        self._post_pipeline()
        return self.pipeline

    @abstractmethod
    def to_pipeline(self):
        """A processor class is supposed to extend this method."""
        pass

    def _post_pipeline(self):
        # keep reference to original processor, so the pipeline knows
        # what backend generated it.
        if self.pipeline:
            self.pipeline.processor = self
        self._add_final_autosnapshot_step()
        self._configure_poddefaults()
        self._apply_steps_defaults()
        # self._set_volume_pipeline_parameters()

    def _add_final_autosnapshot_step(self):
        if not self.no_op_step:
            raise RuntimeError("Processor class needs to define a no-op step.")
        leaf_steps = self.pipeline.get_leaf_steps()
        if self.config.autosnapshot and len(leaf_steps) > 1:
            _step = copy.deepcopy(self.no_op_step)
            _step.config.name = "final_auto_snapshot"
            self.pipeline.add_step(_step)
            # add a link from all the last steps of the pipeline to
            # the final auto snapshot one.
            for step in leaf_steps:
                self.pipeline.add_edge(step.name, _step.config.name)

    def _configure_poddefaults(self):
        # FIXME: We should reconsider the implementation of
        #  https://github.com/kubeflow-kale/kale/pull/175/files to
        #  avoid using an RPC and always detect PodDefaults here.
        _pod_defaults_labels = dict()
        try:
            _pod_defaults_labels = kfutils.find_poddefault_labels()
        except Exception as e:
            log.warning("Could not retrieve PodDefaults. Reason: %s", e)
        self.pipeline.config.steps_defaults["labels"] = {
            **self.pipeline.config.steps_defaults.get("labels", dict()),
            **_pod_defaults_labels}

    def _apply_steps_defaults(self):
        for step in self.pipeline.steps:
            step.config.update(self.pipeline.config.steps_defaults)

    def _set_volume_pipeline_parameters(self):
        """Create pipeline parameters for volumes to be mounted on steps."""
        volume_parameters = dict()
        for v in self.pipeline.config.volumes:
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
        self.pipeline.pipeline_parameters.update(volume_parameters)
