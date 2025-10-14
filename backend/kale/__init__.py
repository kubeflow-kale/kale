# Copyright 2019-2020 The Kale Authors
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

# --- Detect package version at runtime ---
# Use:
# from kale import __version__ as KALE_VERSION
# use KALE_VERSION wherever a display/log/version check is needed
try:
    from importlib.metadata import version as _pkg_version, PackageNotFoundError
except Exception:  # Py<3.8 fallback if needed
    from importlib_metadata import (  # type: ignore
        version as _pkg_version,
        PackageNotFoundError,
    )

try:
    __version__ = _pkg_version("kubeflow-kale")
except PackageNotFoundError:
    # this might happen when a developer tried to test Kale locally from source
    # without installing it first.
    __version__ = "0+unknown"

# -----------------------------------------

from typing import NamedTuple, Any


class PipelineParam(NamedTuple):
    """A pipeline parameter."""
    param_type: str
    param_value: Any


class Artifact(NamedTuple):
    """A Step artifact."""
    name: str
    type: str
    is_input: bool = False


from .step import Step, StepConfig
from .pipeline import Pipeline, PipelineConfig, VolumeConfig
from .compiler import Compiler
from .processors import NotebookProcessor, NotebookConfig, PythonProcessor
from kale.common import logutils

__all__ = [
    "PipelineParam",
    "Artifact",
    "NotebookProcessor",
    "Step",
    "StepConfig",
    "Pipeline",
    "PipelineConfig",
    "VolumeConfig",
    "Compiler",
    "marshal",
]

logutils.get_or_create_logger(module=__name__, name="kale")
del logutils
