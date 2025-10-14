# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

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
