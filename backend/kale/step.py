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

log = logging.getLogger(__name__)


# NOTE: This is not implemented as a NamedTuple because we plan to extend
#       its functionality with some custom functions.
class Step:
    """Dummy class used to store information about a Step of the pipeline."""

    def __init__(self,
                 name: str,
                 source: List[str],
                 ins: Set[Any] = None,
                 outs: Set[Any] = None,
                 annotations: Dict[str, str] = None,
                 limits: Dict[str, str] = None,
                 labels: Dict[str, str] = None):
        self.name = name
        self.source = source
        self.ins = ins or set()
        self.outs = outs or set()
        self.annotations = annotations
        self.limits = limits
        self.labels = labels
        # whether the step produces KFP metrics or not
        self.metrics = False
        # the pipeline parameters consumed by the step
        self.parameters = dict()
        self._pps_names = None
        # used to keep track of the "free variables" used by the step
        self.fns_free_variables = dict()

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
