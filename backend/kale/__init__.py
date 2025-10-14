# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

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

__all__ = ["PipelineParam", "Artifact",'NotebookProcessor', 'Step', 'StepConfig', 'Pipeline', 'PipelineConfig', 'VolumeConfig', 'Compiler', 'marshal']
logutils.get_or_create_logger(module=__name__, name="kale")
del logutils
