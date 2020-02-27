import os
import pytest
import nbformat

from kale.rpc import nb


@pytest.fixture(scope='module')
def rpc_request():
    return None


def test_get_pipeline_parameters_simple(tmpdir, rpc_request):
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
    assert nb.get_pipeline_parameters(rpc_request, notebook_path) == target


def test_get_pipeline_parameters_source_with_step(tmpdir, rpc_request):
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
    assert nb.get_pipeline_parameters(rpc_request, notebook_path) == target


def test_get_pipeline_parameters_source_skip(tmpdir, rpc_request):
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
    assert nb.get_pipeline_parameters(rpc_request, notebook_path) == target


def test_get_pipeline_metrics(tmpdir, rpc_request):
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
    assert nb.get_pipeline_metrics(rpc_request, notebook_path) == target
