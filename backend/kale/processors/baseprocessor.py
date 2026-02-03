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

import logging

from abc import ABC, abstractmethod

from kale.common import kfutils
from kale.pipeline import Pipeline, PipelineConfig, Step
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
        self._configure_poddefaults()
        self._apply_steps_defaults()

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
