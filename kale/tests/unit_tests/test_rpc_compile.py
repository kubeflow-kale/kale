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

"""Tests for the compile_notebook / compile_into_native RPC functions."""

from unittest.mock import MagicMock, mock_open, patch

import pytest

from kale.rpc import nb


@pytest.fixture
def _rpc_request():
    return None


def _mock_pipeline():
    pipeline = MagicMock()
    pipeline.config.pipeline_name = "kale-pipeline"
    pipeline.config.to_dict.return_value = {"pipeline_name": "kale-pipeline"}
    return pipeline


def test_compile_notebook_calls_package_compile(_rpc_request):
    """compile_notebook still produces a KFP package, unaffected by the refactor."""
    pipeline = _mock_pipeline()
    mock_processor = MagicMock()
    mock_processor.run.return_value = pipeline
    mock_processor.get_imports_and_functions.return_value = ""

    with (
        patch("kale.rpc.nb.NotebookProcessor", return_value=mock_processor),
        patch("kale.rpc.nb.Compiler") as mock_compiler_cls,
        patch("kale.rpc.nb.kfputils.compile_pipeline") as mock_compile,
        patch("kale.rpc.nb.kfputils.compile_pipeline_to_manifests") as mock_compile_manifests,
        patch("builtins.open", mock_open(read_data="# dsl source")),
    ):
        mock_compiler_cls.return_value.compile.return_value = "/tmp/dsl_script.py"
        mock_compile.return_value = "/tmp/kale-pipeline.pipeline.yaml"

        result = nb.compile_notebook(_rpc_request, "notebook.ipynb")

    mock_compile.assert_called_once_with("/tmp/dsl_script.py", "kale-pipeline")
    mock_compile_manifests.assert_not_called()
    assert result["pipeline_package_path"].endswith("kale-pipeline.pipeline.yaml")
    assert result["script_content"] == "# dsl source"


def test_compile_into_native_calls_manifest_helper(_rpc_request):
    """compile_into_native compiles to manifests instead of a KFP package."""
    pipeline = _mock_pipeline()
    mock_processor = MagicMock()
    mock_processor.run.return_value = pipeline
    mock_processor.get_imports_and_functions.return_value = ""

    with (
        patch("kale.rpc.nb.NotebookProcessor", return_value=mock_processor),
        patch("kale.rpc.nb.Compiler") as mock_compiler_cls,
        patch("kale.rpc.nb.kfputils.compile_pipeline") as mock_compile,
        patch("kale.rpc.nb.kfputils.compile_pipeline_to_manifests") as mock_compile_manifests,
        patch("builtins.open", mock_open(read_data="# dsl source")),
    ):
        mock_compiler_cls.return_value.compile.return_value = "/tmp/dsl_script.py"
        mock_compile_manifests.return_value = "/tmp/kale-pipeline.pipeline.k8s.yaml"

        result = nb.compile_into_native(
            _rpc_request,
            "notebook.ipynb",
            namespace="kubeflow",
            pipeline_display_name="Weekly churn training",
            pipeline_version_name="weekly-churn-v1",
        )

    mock_compile.assert_not_called()
    args, _ = mock_compile_manifests.call_args
    script_path, pipeline_name, manifest_options = args
    assert script_path == "/tmp/dsl_script.py"
    assert pipeline_name == "kale-pipeline"
    assert manifest_options.namespace == "kubeflow"
    assert manifest_options.pipeline_display_name == "Weekly churn training"
    assert manifest_options.pipeline_version_name == "weekly-churn-v1"
    assert manifest_options.include_pipeline_manifest is True

    assert result["manifest_path"].endswith("kale-pipeline.pipeline.k8s.yaml")
    assert result["pipeline_metadata"] == {"pipeline_name": "kale-pipeline"}
    assert result["script_content"] == "# dsl source"


def test_compile_into_native_include_pipeline_manifest_false(_rpc_request):
    """include_pipeline_manifest=False is forwarded to KubernetesManifestOptions."""
    pipeline = _mock_pipeline()
    mock_processor = MagicMock()
    mock_processor.run.return_value = pipeline
    mock_processor.get_imports_and_functions.return_value = ""

    with (
        patch("kale.rpc.nb.NotebookProcessor", return_value=mock_processor),
        patch("kale.rpc.nb.Compiler") as mock_compiler_cls,
        patch("kale.rpc.nb.kfputils.compile_pipeline_to_manifests") as mock_compile_manifests,
        patch("builtins.open", mock_open(read_data="# dsl source")),
    ):
        mock_compiler_cls.return_value.compile.return_value = "/tmp/dsl_script.py"
        mock_compile_manifests.return_value = "/tmp/kale-pipeline.pipeline.k8s.yaml"

        nb.compile_into_native(_rpc_request, "notebook.ipynb", include_pipeline_manifest=False)

    _, _, manifest_options = mock_compile_manifests.call_args[0]
    assert manifest_options.include_pipeline_manifest is False
