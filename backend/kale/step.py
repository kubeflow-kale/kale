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

from typing import Any, Dict, List, Set

from kale.config import Config, Field, validators

log = logging.getLogger(__name__)


class StepConfig(Config):
    """Config class used for the Step object."""

    name = Field(type=str, required=True,
                 validators=[validators.StepNameValidator])
    labels = Field(type=dict, default=dict(),
                   validators=[validators.K8sLabelsValidator])
    annotations = Field(type=dict, default=dict(),
                        validators=[validators.K8sAnnotationsValidator])
    limits = Field(type=dict, default=dict(),
                   validators=[validators.K8sLimitsValidator])
    retry_count = Field(type=int, default=0)
    retry_interval = Field(type=str)
    retry_factor = Field(type=int)
    retry_max_interval = Field(type=str)


class Step:
    """Class used to store information about a Step of the pipeline."""

    def __init__(self,
                 name: str,
                 source: List[str],
                 ins: Set[Any] = None,
                 outs: Set[Any] = None,
                 annotations: Dict[str, str] = None,
                 limits: Dict[str, str] = None,
                 labels: Dict[str, str] = None,
                 retry_count: int = None,
                 retry_interval: str = None,
                 retry_factor: int = None,
                 retry_max_interval: str = None):
        self.source = source
        self.ins = ins or set()
        self.outs = outs or set()

        self.config = StepConfig(name=name,
                                 annotations=annotations,
                                 limits=limits,
                                 labels=labels,
                                 retry_count=retry_count,
                                 retry_interval=retry_interval,
                                 retry_factor=retry_factor,
                                 retry_max_interval=retry_max_interval)

        # whether the step produces KFP metrics or not
        self.metrics = False
        # the pipeline parameters consumed by the step
        self.parameters = dict()
        self._pps_names = None
        # used to keep track of the "free variables" used by the step
        self.fns_free_variables = dict()

    @property
    def name(self):
        """Get the name of the step."""
        return self.config.name

    def merge_code(self, source_code: str):
        """Add a new code block to the step.

        Args:
            source_code (str): Python source code to be appended to step
        """
        self.source += [source_code]

    @property
    def pps_names(self):
        """Get the names of the step's parameters sorted."""
        if self._pps_names is None:
            self._pps_names = sorted(self.parameters.keys())
        return self._pps_names

    @property
    def pps_types(self):
        """Get the types of the step's parameters, sorted by name."""
        return [self.parameters[n].param_type for n in self.pps_names]

    @property
    def pps_values(self):
        """Get the values of the step's parameters, sorted by name."""
        return [self.parameters[n].param_value for n in self.pps_names]
