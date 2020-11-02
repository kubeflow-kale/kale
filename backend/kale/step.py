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

from typing import Any, Dict, List, Callable, Union

from kale import PipelineParam
from kale.common import astutils
from kale.marshal import Marshaller
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
    timeout = Field(type=int, validators=[validators.PositiveIntegerValidator])


class Step:
    """Class used to store information about a Step of the pipeline."""

    def __init__(self,
                 source: Union[List[str], Callable],
                 ins: List[Any] = None,
                 outs: List[Any] = None,
                 **kwargs):
        self.source = source
        self.ins = ins or []
        self.outs = outs or []

        self.config = StepConfig(**kwargs)

        # whether the step produces KFP metrics or not
        self.metrics = False
        # the pipeline parameters consumed by the step
        self.parameters = dict()
        self._pps_names = None
        # used to keep track of the "free variables" used by the step
        self.fns_free_variables = dict()

    def __call__(self, *args, **kwargs):
        """Handler for when the @step decorated function is called."""
        return execution_handler(self, *args, **kwargs)

    def run(self, pipeline_parameters_values: Dict[str, PipelineParam]):
        """Run the step locally."""
        log.info("%s Running step '%s'... %s", "-" * 10, self.name, "-" * 10)
        # select just the pipeline parameters consumed by this step
        _params = {k: pipeline_parameters_values[k] for k in self.parameters}
        marshaller = Marshaller(func=self.source, ins=self.ins, outs=self.outs,
                                parameters=_params, marshal_dir='.marshal/')
        marshaller()
        log.info("%s Successfully run step '%s'... %s", "-" * 10, self.name,
                 "-" * 10)

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

    @property
    def rendered_source(self):
        """Source to be rendered in the template."""
        # FIXME: I don't like this approach. Currently step.source is either
        #  a list of strings (if processed from the notebook) or a callable
        #  object (function) (if processed from the sdk). This means that when
        #  rendering the sdk template, we need to get the function's source.
        #  It would be great to, in some way, unify how we treat the "source"
        #  both for the notebook of the SDK all the way from the step object
        #  to the template.
        return astutils.get_function_source(self.source, strip_signature=False)


def __default_execution_handler(step: Step, *args, **kwargs):
    log.info("No Pipeline registration handler is set.")
    if not callable(step.source):
        raise RuntimeError("Kale is trying to execute a Step that does not"
                           " define a function. Probably this Step was"
                           " created converting a Notebook. Kale does not yet"
                           " support executing Notebooks locally.")
    log.info("Executing plain function: '%s'" % step.source.__name__)
    return step.source(*args, **kwargs)


execution_handler: Callable = __default_execution_handler
