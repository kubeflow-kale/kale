# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

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
