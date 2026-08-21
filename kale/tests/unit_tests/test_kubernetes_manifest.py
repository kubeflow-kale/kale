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

"""Tests for compile_pipeline_to_manifests."""

import os

from kfp.compiler import KubernetesManifestOptions
import pytest
import yaml

from kale.common import kfputils

DSL_SOURCE = """
from kfp import dsl


@dsl.component
def say_hello() -> str:
    return "hello"


@dsl.pipeline(name="test-pipeline")
def auto_generated_pipeline():
    say_hello()
"""


@pytest.fixture
def dsl_script(tmp_path):
    """Write a minimal DSL script to a temp dir and return its path."""
    script_dir = tmp_path / "src"
    script_dir.mkdir()
    script_path = script_dir / "weekly-churn.kale.py"
    script_path.write_text(DSL_SOURCE)
    return str(script_path)


def test_default_output_path(dsl_script):
    """Manifest is written next to the DSL source by default."""
    options = KubernetesManifestOptions(pipeline_name="weekly-churn")
    result = kfputils.compile_pipeline_to_manifests(dsl_script, "weekly-churn", options)

    expected = os.path.join(os.path.dirname(dsl_script), "weekly-churn.pipeline.k8s.yaml")
    assert result == expected
    assert os.path.exists(result)


def test_explicit_output_path_overrides_default(dsl_script, tmp_path):
    """An explicit output_path argument takes precedence over the default."""
    options = KubernetesManifestOptions(pipeline_name="weekly-churn")
    custom_path = str(tmp_path / "custom" / "manifest.yaml")

    result = kfputils.compile_pipeline_to_manifests(
        dsl_script, "weekly-churn", options, output_path=custom_path
    )

    assert result == custom_path
    assert os.path.exists(custom_path)


def test_explicit_output_path_creates_missing_parent_dirs(dsl_script, tmp_path):
    """output_path with non-existent nested parent directories is created automatically."""
    options = KubernetesManifestOptions(pipeline_name="weekly-churn")
    nested_path = str(tmp_path / "a" / "b" / "c" / "manifest.yaml")
    assert not os.path.exists(os.path.dirname(nested_path))

    result = kfputils.compile_pipeline_to_manifests(
        dsl_script, "weekly-churn", options, output_path=nested_path
    )

    assert result == nested_path
    assert os.path.exists(nested_path)


def test_manifest_options_are_applied(dsl_script):
    """Namespace, names, and include_pipeline_manifest reach the output manifest."""
    options = KubernetesManifestOptions(
        pipeline_name="weekly-churn",
        pipeline_display_name="Weekly churn training",
        pipeline_version_name="weekly-churn-v1",
        namespace="kubeflow",
        include_pipeline_manifest=True,
    )
    result = kfputils.compile_pipeline_to_manifests(dsl_script, "weekly-churn", options)

    with open(result) as f:
        docs = list(yaml.safe_load_all(f))
    kinds = {d["kind"] for d in docs}
    assert "Pipeline" in kinds
    assert "PipelineVersion" in kinds

    pipeline_doc = next(d for d in docs if d["kind"] == "Pipeline")
    assert pipeline_doc["metadata"]["namespace"] == "kubeflow"
    assert pipeline_doc["spec"]["displayName"] == "Weekly churn training"

    version_doc = next(d for d in docs if d["kind"] == "PipelineVersion")
    assert version_doc["metadata"]["name"] == "weekly-churn-v1"


def test_include_pipeline_manifest_false_omits_pipeline_cr(dsl_script):
    """When include_pipeline_manifest is False, only PipelineVersion is emitted."""
    options = KubernetesManifestOptions(
        pipeline_name="weekly-churn",
        include_pipeline_manifest=False,
    )
    result = kfputils.compile_pipeline_to_manifests(dsl_script, "weekly-churn", options)

    with open(result) as f:
        docs = list(yaml.safe_load_all(f))
    kinds = {d["kind"] for d in docs}
    assert "Pipeline" not in kinds
    assert "PipelineVersion" in kinds


def test_mismatched_pipeline_name_raises(dsl_script):
    """A pipeline_name that disagrees with manifest_options is rejected."""
    options = KubernetesManifestOptions(pipeline_name="from-options")
    with pytest.raises(ValueError, match="does not match"):
        kfputils.compile_pipeline_to_manifests(dsl_script, "from-arg", options)
