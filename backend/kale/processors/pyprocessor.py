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

import ast
import inspect
import logging

from inspect import Parameter
from typing import Callable, Dict

from kale.common import astutils
from kale import step as step_module
from kale.step import Step, PipelineParam
from kale.pipeline import PipelineConfig

from .baseprocessor import BaseProcessor

log = logging.getLogger(__name__)


def _no_op():
    pass


class PythonProcessor(BaseProcessor):
    """Convert annotated Python code to a Pipeline object."""

    id = "py"
    no_op_step = Step(name="no_op", source=_no_op)

    _ALLOWED_ARG_KINDS = (Parameter.POSITIONAL_OR_KEYWORD,)

    def __init__(self,
                 pipeline_function: Callable,
                 config: PipelineConfig = None,
                 **kwargs):
        self.pipeline_fn = pipeline_function
        # self.pipeline.origin = PipelineOrigin.PYTHON

        # Will be populated during processing
        self._steps_input_vars = None
        self._steps_return_vars = None

        super().__init__(config=config, **kwargs)

        fn_source = astutils.get_function_source(self.pipeline_fn)
        self.validate(fn_source)
        self.process(fn_source)

    def validate(self, fn_source: str):
        """Run static analysis over the source of the @pipeline fn."""
        self._validate_function_body(fn_source)
        self._fn_accepts_only_kwargs()
        self._fn_args_ensure_supported_types()
        return self

    def process(self, fn_source: str):
        """Validates and processes the input pipeline function."""
        self._steps_return_vars = astutils.link_fns_to_return_vars(fn_source)
        self._steps_input_vars = astutils.link_fns_to_inputs_vars(fn_source)
        self.pipeline.pipeline_parameters = self._get_fn_kwargs()
        return self

    def to_pipeline(self):
        """Generate the Pipeline object."""
        # Execute the pipeline function to create the steps and build the graph
        __old_execution_handler = step_module.execution_handler
        step_module.execution_handler = self._register_step_handler

        # Now the steps inside the pipeline function will be called one after
        # the other. Each call will create a new Step object that will
        # call the registration handler to bind itself to the Pipeline object.
        self.pipeline_fn()

        step_module.execution_handler = __old_execution_handler

    def _register_step_handler(self, step: Step, *args, **kwargs):
        log.info("Registering Step '%s'" % step.name)

        self.pipeline.add_step(step)

        step.outs = self._steps_return_vars.get(step.source.__name__, [])
        step.ins = self._steps_input_vars.get(step.source.__name__, [])

        _params_names = set(self.pipeline.pipeline_parameters)
        if set(step.outs).intersection(_params_names):
            raise RuntimeError("Some steps' return values are overriding"
                               " pipeline arguments. Make sure that pipeline"
                               " arguments are used uniquely across the"
                               " pipeline.")

        # a step can consume a subset of the pipeline's parameters
        consumed_params = set(step.ins).intersection(_params_names)
        step.parameters = {k: self.pipeline.pipeline_parameters[k]
                           for k in consumed_params}

        self._link_step(step)

        # The step's execution handler will return to the main user's script.
        # Need to return a fixture to fill the return values.
        return (None for _ in step.outs) or None

    def _link_step(self, step: Step):
        ins_left = set(step.ins.copy())
        ins_left.difference_update(set(self.pipeline.pipeline_parameters))
        for anc_step in reversed(list(self.pipeline.steps)):
            if ins_left.intersection(set(anc_step.outs)):
                self.pipeline.add_dependency(anc_step, step)
                ins_left.difference_update(set(anc_step.outs))

    def _validate_function_body(self, fn_source: str):
        tree = ast.parse(fn_source)

        for node in tree.body:
            func_node = None
            if isinstance(node, ast.Assign):
                if not isinstance(node.value, ast.Call):
                    raise RuntimeError(
                        "ast.Assign value is not a ast.Call node")
                func_node = node.value
            if isinstance(node, ast.Expr):
                if not isinstance(node.value, ast.Call):
                    raise RuntimeError("ast.Expr value is not a ast.Call node")
                func_node = node.value
            if isinstance(node, ast.Call):
                func_node = node
            if not func_node:
                raise RuntimeError("Node %s is not valid." % node)

            fn_name = func_node.func.id
            if any([not isinstance(arg, ast.Name) for arg in func_node.args]):
                raise ValueError("Function '%s' is called with some constant"
                                 " arguments" % fn_name)

    def _fn_accepts_only_kwargs(self):
        signature = inspect.signature(self.pipeline_fn)
        for param in signature.parameters.values():
            if param.kind not in self._ALLOWED_ARG_KINDS:
                raise RuntimeError("All pipeline function arguments must be"
                                   " either positional or keyword")
            if param.default == Parameter.empty:
                raise RuntimeError("All pipeline function arguments must have"
                                   " a default value")

    def _fn_args_ensure_supported_types(self):
        signature = inspect.signature(self.pipeline_fn)
        for param in signature.parameters.values():
            # In _fn_accepts_only_kwargs(), we have validated that the
            # parameters are in _ALLOWED_ARG_KINDS and they have defaults
            # FIXME: Ensure we support all the KFP-supported types
            #  https://github.com/kubeflow/pipelines/blob/9af3e79c10b9bb1ac1adc7bf8c1354a16fa7b461/sdk/python/kfp/components/_data_passing.py#L107-L116
            if not isinstance(param.default, (int, float, str, bool)):
                raise RuntimeError("Pipeline parameters must be of primitive"
                                   " types: int, float, str, or bool. Pipeline"
                                   " parameter %s is of type %s"
                                   % (param.name, type(param.default)))

    def _get_fn_kwargs(self) -> Dict[str, PipelineParam]:
        kwargs = dict()
        signature = inspect.signature(self.pipeline_fn)
        for param in signature.parameters.values():
            kwargs[param.name] = PipelineParam(type(param.default).__name__,
                                               param.default)
        return kwargs
