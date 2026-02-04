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
import marshal as marshal_utils
import sys
from typing import Any, NamedTuple

log = logging.getLogger(__name__)


class PipelineParam(NamedTuple):
    """A pipeline parameter."""

    param_type: str
    param_value: Any


def marshal(
    ins: list,
    outs: list,
    parameters: dict[str, PipelineParam | Any] = None,
    marshal_dir: str = None,
    introspect: bool = False,
):
    """Decorator that ensures proper marshalling happens when the fn is run."""
    _params = {
        k: (v if isinstance(v, PipelineParam) else PipelineParam(type(v), v))
        for k, v in parameters.items()
    }

    def _marshal(func):
        return Marshaller(func, ins, outs, _params, marshal_dir, introspect)

    return _marshal


class Marshaller:
    """Wrap a function to perform marshalling around its execution.

    This class acts as a wrapper around a function that runs in a  pipeline
    step and needs input arguments to be loaded from a marshal directory and
    its outputs saved likewise.


    """

    def __init__(
        self,
        func,
        ins: list,
        outs: list,
        parameters: dict[str, PipelineParam] = None,
        marshal_dir=None,
        introspect=False,
    ):
        self._introspect = introspect
        if introspect:
            self._func = _persistent_locals(func)
        else:
            self._func = func
        self._ins = ins
        self._outs = outs
        self._parameters = parameters or {}

        marshal_utils.set_data_dir(marshal_dir)

    def __call__(self):
        """Run the function by passing loaded vars and saving the results."""
        loads = self._load()
        log.newline(lines=2)
        results = self._func(*loads)
        log.newline(lines=2)
        self._save(results)

    def _load(self):
        loads = []  # load in the same order as in self._ins.
        for var_name in self._ins:
            if var_name not in self._parameters:
                loads.append(marshal_utils.load(var_name))
            else:
                loads.append(self._parameters[var_name].param_value)
        return loads

    def _save(self, values):
        if self._introspect:  # get vars from function locals
            for var_name in self._outs:
                if var_name not in self._func.locals:
                    raise RuntimeError(f"Variable {var_name} not found in function's locals")
                marshal_utils.save(self._func.locals[var_name], var_name)
        else:  # get vars from return value
            if len(self._outs) == 0:
                return
            if isinstance(values, tuple):
                if len(values) != len(self._outs):
                    raise RuntimeError(
                        "There is a mismatch between the tuple"
                        " returned by the functions and its"
                        " expected outs. If the functions is"
                        " returning a tuple, make sure the "
                        " return value it is properly"
                        " unpacked."
                    )
                for name, value in dict(zip(self._outs, values, strict=False)).items():
                    marshal_utils.save(value, name)
            else:  # any other object?
                if len(self._outs) > 1:
                    raise RuntimeError(
                        "The function returned a single object,"
                        " but there are multiple expected outs:"
                        f" {str(self._outs)}"
                    )
                marshal_utils.save(values, self._outs[0])


class _persistent_locals:
    """Function decorator to expose local variables after execution.

    Modify the function such that, at the exit of the function
    (regular exit or exceptions), the local dictionary is copied to a
    read-only function property 'locals'.

    This decorator wraps the function in a callable object, and
    modifies its bytecode by adding an external try...finally
    statement equivalent to the following:

    ```
    def f(self, *args, **kwargs):
        try:
            ... old code ...
        finally:
            self._locals = locals().copy()
            del self._locals['self']
    ```

    Refer to the docstring of instances for help about the wrapped
    function.
    """

    def __init__(self, func):
        self._locals = {}
        self._func = func

    def __call__(self, *args, **kwargs):
        def tracer(frame, event, arg):
            if event == "return":
                self._locals = frame.f_locals.copy()

        # keep old profile
        old_profile = sys.getprofile()
        # tracer is activated on next call, return or exception
        sys.setprofile(tracer)

        try:
            # trace the function call
            res = self._func(*args, **kwargs)
        finally:
            # disable tracer and replace with old one
            sys.setprofile(old_profile)
        return res

    @property
    def locals(self):
        return self._locals
