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

import logging

log = logging.getLogger(__name__)


# NOTE: This is not implemented as a NamedTuple because we plan to extend
#       its functionality with some custom functions.
class Step:
    """Dummy class used to store information about a Step of the pipeline."""
    def __init__(self,
                 name: str,
                 source: list,
                 ins: set = None,
                 outs: set = None,
                 annotations=None,
                 limits=None,
                 labels=None):
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
        # used to keep track of the "free variables" used by the step
        self.fns_free_variables = dict()
