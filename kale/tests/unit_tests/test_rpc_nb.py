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

import os
from unittest.mock import MagicMock, patch

import nbformat
import pytest

from kale.common import k8sutils
from kale.rpc import nb


@pytest.fixture(scope="module")
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
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m) for (s, m) in cells]
    notebook_path = os.path.join(tmpdir, "test1.ipynb")
    nbformat.write(notebook, notebook_path, nbformat.NO_CONVERT)
    target = [["b", "int", 2], ["c", "str", "test"]]
    assert nb.get_pipeline_parameters(_rpc_request, notebook_path) == target


def test_get_pipeline_parameters_source_with_step(tmpdir, _rpc_request):
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("a=1.0", {"tags": ["pipeline-parameters"]}),
        ("0", {"tags": ["step:test"]}),
        ("b=2", {"tags": ["pipeline-parameters"]}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m) for (s, m) in cells]
    notebook_path = os.path.join(tmpdir, "test2.ipynb")
    nbformat.write(notebook, notebook_path, nbformat.NO_CONVERT)
    target = [["a", "float", 1.0], ["b", "int", 2]]
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
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m) for (s, m) in cells]
    notebook_path = os.path.join(tmpdir, "test3.ipynb")
    nbformat.write(notebook, notebook_path, nbformat.NO_CONVERT)
    target = [["a", "int", 1], ["b", "int", 2], ["c", "int", 3]]
    assert nb.get_pipeline_parameters(_rpc_request, notebook_path) == target


def test_list_pvcs_returns_sorted_names(_rpc_request):
    """list_pvcs returns a sorted list of PVC names from the cluster."""

    def _make_pvc(name):
        pvc = MagicMock()
        pvc.metadata.name = name
        return pvc

    mock_v1 = MagicMock()
    mock_v1.list_namespaced_persistent_volume_claim.return_value = MagicMock(
        items=[_make_pvc("zebra-pvc"), _make_pvc("alpha-pvc"), _make_pvc("beta-pvc")]
    )

    with (
        patch("kale.rpc.nb.podutils.get_namespace", return_value="test-ns"),
        patch("kale.rpc.nb.k8sutils.get_v1_client", return_value=mock_v1),
    ):
        result = nb.list_pvcs(_rpc_request)

    assert result == ["alpha-pvc", "beta-pvc", "zebra-pvc"]
    mock_v1.list_namespaced_persistent_volume_claim.assert_called_once_with("test-ns")


def test_list_pvcs_returns_empty_list_on_namespace_error(_rpc_request):
    """list_pvcs returns [] when the namespace cannot be read (no cluster access)."""
    with patch("kale.rpc.nb.podutils.get_namespace", side_effect=FileNotFoundError("no token")):
        result = nb.list_pvcs(_rpc_request)

    assert result == []


def test_list_pvcs_returns_empty_list_on_k8s_error(_rpc_request):
    """list_pvcs returns [] when the Kubernetes API call fails."""
    mock_v1 = MagicMock()
    mock_v1.list_namespaced_persistent_volume_claim.side_effect = Exception("API error")

    with (
        patch("kale.rpc.nb.podutils.get_namespace", return_value="test-ns"),
        patch("kale.rpc.nb.k8sutils.get_v1_client", return_value=mock_v1),
    ):
        result = nb.list_pvcs(_rpc_request)

    assert result == []


def test_list_pvcs_empty_namespace(_rpc_request):
    """list_pvcs returns an empty list when the namespace has no PVCs."""
    mock_v1 = MagicMock()
    mock_v1.list_namespaced_persistent_volume_claim.return_value = MagicMock(items=[])

    with (
        patch("kale.rpc.nb.podutils.get_namespace", return_value="test-ns"),
        patch("kale.rpc.nb.k8sutils.get_v1_client", return_value=mock_v1),
    ):
        result = nb.list_pvcs(_rpc_request)

    assert result == []


def test_get_pvc_access_modes_returns_modes():
    """get_pvc_access_modes returns the PVC's access modes from the cluster."""
    mock_pvc = MagicMock()
    mock_pvc.spec.access_modes = ["ReadWriteOnce"]
    mock_v1 = MagicMock()
    mock_v1.read_namespaced_persistent_volume_claim.return_value = mock_pvc

    with patch("kale.common.k8sutils.get_v1_client", return_value=mock_v1):
        result = k8sutils.get_pvc_access_modes("raw-data", "test-ns")

    assert result == ["ReadWriteOnce"]
    mock_v1.read_namespaced_persistent_volume_claim.assert_called_once_with("raw-data", "test-ns")


def test_get_pvc_access_modes_returns_empty_list_on_error():
    """get_pvc_access_modes returns [] on any exception (best-effort)."""
    mock_v1 = MagicMock()
    mock_v1.read_namespaced_persistent_volume_claim.side_effect = Exception("forbidden")

    with patch("kale.common.k8sutils.get_v1_client", return_value=mock_v1):
        result = k8sutils.get_pvc_access_modes("raw-data", "test-ns")

    assert result == []


def test_get_pipeline_metrics(tmpdir, _rpc_request):
    """Test that the function gets the correct pipeline metrics source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("0", {}),
        ("0", {"tags": []}),
        ("print(metric_1)", {"tags": ["pipeline-metrics"]}),
        ("print(metric_2)", {}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m) for (s, m) in cells]
    notebook_path = os.path.join(tmpdir, "test1.ipynb")
    nbformat.write(notebook, notebook_path, nbformat.NO_CONVERT)
    target = {"metric-1": "metric_1", "metric-2": "metric_2"}
    assert nb.get_pipeline_metrics(_rpc_request, notebook_path) == target
