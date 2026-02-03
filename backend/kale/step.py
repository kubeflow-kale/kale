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

from typing import Any, Dict, List, Callable, Union, NamedTuple

from kale.marshal import Marshaller
from kale.common import astutils, runutils
from kale.config import Config, Field, validators
log = logging.getLogger(__name__)


class PipelineParam(NamedTuple):
    """A pipeline parameter."""
    param_type: str
    param_value: Any


class Artifact(NamedTuple):
    """A Step artifact."""
    name: str
    type: str
    is_input: bool = False


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
        self.artifacts: List[Artifact] = list()

        self.config = StepConfig(**kwargs)

        # whether the step produces KFP metrics or not
        self.metrics = False
        # the pipeline parameters consumed by the step
        self.parameters: Dict[str, PipelineParam] = dict()
        self._pps_names = None
        # used to keep track of the "free variables" used by the step
        self.fns_free_variables = dict()

    def __call__(self, *args, **kwargs):
        """Handler for when the @step decorated function is called."""
        return execution_handler(self, *args, **kwargs)

    def add_artifact(self, artifact_name, artifact_type, is_input):
        """Helper method to add an artifact to the step.

        Artifact_type will be either 'Dataset', 'Model', 'HTML', 'Metrics',
        'ClassificationMetrics' or 'Artifact'.
        This will simplify tracking what should be an Input[Artifact]
          or Output[Artifact].

        Args:
            artifact_name (str): Name of the artifact.
            artifact_type (str): Type of the artifact.
            is_input (bool): Whether the artifact is an input or output.
        """
        # Check if artifact already exists, update if it's an output
        # TODO: This could be improved to handle more complex cases
        for existing_art in self.artifacts:
            if existing_art.name == artifact_name:
                # If it's an output, ensure its type is set
                if not is_input and existing_art.type is None:
                    existing_art.type = artifact_type
                return

        new_artifact = Artifact(
            name=artifact_name,
            type=artifact_type,
            is_input=is_input
        )
        self.artifacts.append(new_artifact)

    def run(self, pipeline_parameters_values: Dict[str, PipelineParam]):
        """Run the step locally."""
        log.info("%s Running step '%s'... %s", "-" * 10, self.name, "-" * 10)
        # select just the pipeline parameters consumed by this step
        _params = {k: pipeline_parameters_values[k] for k in self.parameters}
        marshaller = Marshaller(func=self.source, ins=self.ins, outs=self.outs,
                                parameters=_params, marshal_dir='.marshal/')
        marshaller()
        log.info("%s Successfully ran step '%s'... %s", "-" * 10, self.name,
                 "-" * 10)
        runutils.link_artifacts({a.name: a.path for a in self.artifacts},
                                link=False)

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

    @property
    def kfp_inputs(self) -> List[Union[PipelineParam, Artifact]]:
        """Get the inputs of the step for KFP.

        This combines PipelineParams and Artifacts marked as inputs.
        Add PipelineParams first (as they're usually positional/keyword args)
        """
        inputs = []

        # Sort them for consistent signature generation
        sorted_param_names = sorted(self.parameters.keys())
        for name in sorted_param_names:
            inputs.append(self.parameters[name])

        # Add Artifacts that are inputs
        for art in sorted(self.artifacts, key=lambda a: a.name):
            if getattr(art, '_is_input', False):  # Check custom input flag
                inputs.append(art)
        return inputs

    @property
    def kfp_outputs(self) -> List[Artifact]:
        """Get Artifacts that are outputs."""
        outputs = []
        for art in sorted(self.artifacts, key=lambda a: a.name):
            if not getattr(art, '_is_input', False):  # Check custom input flag
                outputs.append(art)
        return outputs


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
