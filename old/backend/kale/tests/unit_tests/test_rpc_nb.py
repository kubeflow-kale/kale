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

import os
import pytest
import nbformat

from kale.rpc import nb


@pytest.fixture(scope='module')
def _rpc_request():
    return None


def test_get_pipeline_parameters_simple(tmpdir, _rpc_request):
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("0", {}),
        ("0", {"tags": []}),
        ("b=2", {"tags": ["pipeline-parameters"]}),
        ("c='test'", {}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m)
                      for (s, m) in cells]
    notebook_path = os.path.join(tmpdir, 'test1.ipynb')
    nbformat.write(notebook, notebook_path, nbformat.NO_CONVERT)
    target = [['b', 'int', 2], ['c', 'str', 'test']]
    assert nb.get_pipeline_parameters(_rpc_request, notebook_path) == target


def test_get_pipeline_parameters_source_with_step(tmpdir, _rpc_request):
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("a=1.0", {"tags": ["pipeline-parameters"]}),
        ("0", {"tags": ["step:test"]}),
        ("b=2", {"tags": ["pipeline-parameters"]}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m)
                      for (s, m) in cells]
    notebook_path = os.path.join(tmpdir, 'test2.ipynb')
    nbformat.write(notebook, notebook_path, nbformat.NO_CONVERT)
    target = [['a', 'float', 1.0], ['b', 'int', 2]]
    assert nb.get_pipeline_parameters(_rpc_request, notebook_path) == target


def test_get_pipeline_parameters_source_skip(tmpdir, _rpc_request):
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("a=1", {"tags": ["pipeline-parameters"]}),
        ("0", {"tags": ["skip"]}),
        ("b=2", {"tags": ["pipeline-parameters"]}),
        ("c=3", {"tags": []}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m)
                      for (s, m) in cells]
    notebook_path = os.path.join(tmpdir, 'test3.ipynb')
    nbformat.write(notebook, notebook_path, nbformat.NO_CONVERT)
    target = [['a', 'int', 1], ['b', 'int', 2], ['c', 'int', 3]]
    assert nb.get_pipeline_parameters(_rpc_request, notebook_path) == target


def test_get_pipeline_metrics(tmpdir, _rpc_request):
    """Test that the function gets the correct pipeline metrics source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("0", {}),
        ("0", {"tags": []}),
        ("print(metric_1)", {"tags": ["pipeline-metrics"]}),
        ("print(metric_2)", {}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m)
                      for (s, m) in cells]
    notebook_path = os.path.join(tmpdir, 'test1.ipynb')
    nbformat.write(notebook, notebook_path, nbformat.NO_CONVERT)
    target = {"metric-1": "metric_1", "metric-2": "metric_2"}
    assert nb.get_pipeline_metrics(_rpc_request, notebook_path) == target
