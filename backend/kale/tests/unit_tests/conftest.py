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

"""This module contains test fixtures that are used throughout the test suite.

To use a fixture, simply add the fixture (function) name as an argument to
the test function and Pytest will take care of resolving it at runtime.
"""

import pytest
import nbformat

from unittest.mock import patch

from kale import NotebookProcessor


@pytest.fixture(scope="module")
def dummy_nb_config():
    """Returns a dummy nb config with all the required fields."""
    return {
        "notebook_path": "/path/to/nb",
        "pipeline_name": "test",
        "experiment_name": "test"
    }


@pytest.fixture(scope="module")
def notebook_processor(dummy_nb_config):
    """Return a notebook processor over a dummy in-memory notebook."""
    with patch.object(NotebookProcessor, '_read_notebook',
                      lambda _: nbformat.v4.new_notebook()):
        return NotebookProcessor("path/to/nb", dummy_nb_config)
