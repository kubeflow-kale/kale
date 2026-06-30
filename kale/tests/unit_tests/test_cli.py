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

"""Tests for the --kubernetes-manifest-format CLI mode."""

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

from kale import cli


def _run_cli(argv, manifest_side_effect=None):
    """Run kale.cli.main() with notebook processing/compilation mocked out."""
    mock_pipeline = MagicMock()
    mock_pipeline.config.pipeline_name = "kale-pipeline"
    mock_pipeline.config.kfp_host = None
    mock_pipeline.config.experiment_name = "test-experiment"

    mock_processor = MagicMock()
    mock_processor.run.return_value = mock_pipeline
    mock_processor.get_imports_and_functions.return_value = ""

    with (
        patch.object(sys, "argv", ["kale"] + argv),
        patch("kale.cli.NotebookProcessor", return_value=mock_processor),
        patch("kale.cli.Compiler") as mock_compiler_cls,
        patch("kale.cli.kfputils.compile_pipeline") as mock_compile,
        patch("kale.cli.kfputils.compile_pipeline_to_manifests") as mock_compile_manifests,
        patch("kale.cli.kfputils.upload_pipeline") as mock_upload,
        patch("kale.cli.kfputils.run_pipeline") as mock_run,
    ):
        mock_compiler_cls.return_value.compile.return_value = "/tmp/dsl_script.py"
        mock_compile.return_value = "/tmp/kale-pipeline.pipeline.yaml"
        if manifest_side_effect is not None:
            mock_compile_manifests.side_effect = manifest_side_effect
        else:
            mock_compile_manifests.return_value = "/tmp/kale-pipeline.pipeline.k8s.yaml"
        mock_upload.return_value = ("pipeline-id", "version-id")

        cli.main()

    return {
        "compile_pipeline": mock_compile,
        "compile_pipeline_to_manifests": mock_compile_manifests,
        "upload_pipeline": mock_upload,
        "run_pipeline": mock_run,
    }


def test_manifest_mode_calls_helper_and_skips_upload(capsys):
    """--kubernetes-manifest-format calls the manifest helper, not upload/run."""
    mocks = _run_cli(
        [
            "--nb",
            "notebook.ipynb",
            "--kubernetes-manifest-format",
            "--kubernetes-namespace",
            "kubeflow",
        ]
    )

    mocks["compile_pipeline_to_manifests"].assert_called_once()
    mocks["compile_pipeline"].assert_not_called()
    mocks["upload_pipeline"].assert_not_called()
    mocks["run_pipeline"].assert_not_called()
    assert "manifest_path:" in capsys.readouterr().out


def test_manifest_mode_passes_options_through():
    """CLI flags populate the KubernetesManifestOptions passed to the helper."""
    mocks = _run_cli(
        [
            "--nb",
            "notebook.ipynb",
            "--kubernetes-manifest-format",
            "--kubernetes-namespace",
            "kubeflow",
            "--pipeline-display-name",
            "Weekly churn training",
            "--pipeline-version-name",
            "weekly-churn-v1",
        ]
    )

    args, _ = mocks["compile_pipeline_to_manifests"].call_args
    dsl_script_path, pipeline_name, manifest_options = args
    assert dsl_script_path == "/tmp/dsl_script.py"
    assert pipeline_name == "kale-pipeline"
    assert manifest_options.namespace == "kubeflow"
    assert manifest_options.pipeline_display_name == "Weekly churn training"
    assert manifest_options.pipeline_version_name == "weekly-churn-v1"
    assert manifest_options.include_pipeline_manifest is True


def test_no_include_pipeline_manifest_flag():
    """--no-include-pipeline-manifest flips include_pipeline_manifest to False."""
    mocks = _run_cli(
        ["--nb", "notebook.ipynb", "--kubernetes-manifest-format", "--no-include-pipeline-manifest"]
    )

    _, _, manifest_options = mocks["compile_pipeline_to_manifests"].call_args[0]
    assert manifest_options.include_pipeline_manifest is False


def test_output_flag_passed_to_helper():
    """--output overrides the default manifest output path."""
    mocks = _run_cli(
        [
            "--nb",
            "notebook.ipynb",
            "--kubernetes-manifest-format",
            "--output",
            "custom/manifest.yaml",
        ]
    )

    _, kwargs = mocks["compile_pipeline_to_manifests"].call_args
    assert kwargs["output_path"] == "custom/manifest.yaml"


def test_output_flag_without_manifest_format_rejected(capsys):
    """--output without --kubernetes-manifest-format is rejected."""
    with (
        patch.object(sys, "argv", ["kale", "--nb", "notebook.ipynb", "--output", "out.yaml"]),
        pytest.raises(SystemExit) as exc_info,
    ):
        cli.main()

    assert exc_info.value.code == 2
    assert "--output is only valid with --kubernetes-manifest-format" in capsys.readouterr().err


def test_stdout_flag_prints_yaml_and_leaves_no_file(capsys):
    """--stdout prints manifest content and cleans up its temp file."""
    written_paths = []

    def fake_compile(dsl_script_path, pipeline_name, manifest_options, output_path=None):
        written_paths.append(output_path)
        with open(output_path, "w") as f:
            f.write("apiVersion: pipelines.kubeflow.org/v2beta1\nkind: Pipeline\n")
        return output_path

    _run_cli(
        ["--nb", "notebook.ipynb", "--kubernetes-manifest-format", "--stdout"],
        manifest_side_effect=fake_compile,
    )

    captured = capsys.readouterr()
    assert captured.out == "apiVersion: pipelines.kubeflow.org/v2beta1\nkind: Pipeline\n"
    assert "manifest_path:" not in captured.out
    assert "dsl_script_path:" not in captured.out
    assert written_paths and not os.path.exists(written_paths[0])


def test_stdout_routes_diagnostics_to_stderr(capsys):
    """In --stdout mode, the dsl_script_path line goes to stderr, not stdout."""
    _run_cli(["--nb", "notebook.ipynb", "--kubernetes-manifest-format", "--stdout"])

    captured = capsys.readouterr()
    assert "dsl_script_path:" in captured.err
    assert "dsl_script_path:" not in captured.out


def test_stdout_without_manifest_format_rejected(capsys):
    """--stdout without --kubernetes-manifest-format is rejected."""
    with (
        patch.object(sys, "argv", ["kale", "--nb", "notebook.ipynb", "--stdout"]),
        pytest.raises(SystemExit) as exc_info,
    ):
        cli.main()

    assert exc_info.value.code == 2
    assert "--stdout is only valid with --kubernetes-manifest-format" in capsys.readouterr().err


def test_stdout_and_output_mutually_exclusive(capsys):
    """--stdout and --output cannot be combined."""
    with (
        patch.object(
            sys,
            "argv",
            [
                "kale",
                "--nb",
                "notebook.ipynb",
                "--kubernetes-manifest-format",
                "--stdout",
                "--output",
                "out.yaml",
            ],
        ),
        pytest.raises(SystemExit) as exc_info,
    ):
        cli.main()

    assert exc_info.value.code == 2
    assert "--stdout cannot be combined with --output" in capsys.readouterr().err


def test_default_mode_unaffected(capsys):
    """Without --kubernetes-manifest-format, behavior is unchanged."""
    mocks = _run_cli(["--nb", "notebook.ipynb"])

    mocks["compile_pipeline"].assert_called_once()
    mocks["compile_pipeline_to_manifests"].assert_not_called()
    mocks["upload_pipeline"].assert_not_called()
    mocks["run_pipeline"].assert_not_called()
    assert "manifest_path:" not in capsys.readouterr().out


@pytest.mark.parametrize("conflicting_flag", ["--upload_pipeline", "--run_pipeline"])
def test_rejects_manifest_format_with_upload_or_run(conflicting_flag, capsys):
    """--kubernetes-manifest-format combined with --upload_pipeline/--run_pipeline exits."""
    with (
        patch.object(
            sys,
            "argv",
            ["kale", "--nb", "notebook.ipynb", "--kubernetes-manifest-format", conflicting_flag],
        ),
        pytest.raises(SystemExit) as exc_info,
    ):
        cli.main()

    assert exc_info.value.code == 2
    assert "cannot be combined" in capsys.readouterr().err
