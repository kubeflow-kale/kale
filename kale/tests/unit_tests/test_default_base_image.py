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

from kale.common import utils
from kale.pipeline import DEFAULT_BASE_IMAGE, PipelineConfig


def _clear_base_image_env(monkeypatch):
    monkeypatch.delenv("KALE_DEFAULT_BASE_IMAGE", raising=False)


def test_get_default_base_image_from_env_unset(monkeypatch):
    _clear_base_image_env(monkeypatch)
    assert utils.get_default_base_image_from_env() is None


def test_get_default_base_image_from_env_set(monkeypatch):
    _clear_base_image_env(monkeypatch)
    monkeypatch.setenv("KALE_DEFAULT_BASE_IMAGE", "  my.registry/image:1.0  ")
    assert utils.get_default_base_image_from_env() == "my.registry/image:1.0"


def test_get_default_base_image_from_env_empty(monkeypatch):
    _clear_base_image_env(monkeypatch)
    monkeypatch.setenv("KALE_DEFAULT_BASE_IMAGE", "   ")
    assert utils.get_default_base_image_from_env() is None


def test_pipeline_config_base_image_from_env(monkeypatch):
    _clear_base_image_env(monkeypatch)
    monkeypatch.setenv("KALE_DEFAULT_BASE_IMAGE", "env-image:latest")

    config = PipelineConfig(
        pipeline_name="test-pipeline",
        experiment_name="test-experiment",
    )

    assert config.base_image == "env-image:latest"


def test_pipeline_config_base_image_hardcoded_fallback(monkeypatch):
    _clear_base_image_env(monkeypatch)

    config = PipelineConfig(
        pipeline_name="test-pipeline",
        experiment_name="test-experiment",
    )

    assert config.base_image == DEFAULT_BASE_IMAGE


def test_pipeline_config_base_image_explicit_override(monkeypatch):
    _clear_base_image_env(monkeypatch)
    monkeypatch.setenv("KALE_DEFAULT_BASE_IMAGE", "env-image:latest")

    config = PipelineConfig(
        pipeline_name="test-pipeline",
        experiment_name="test-experiment",
        base_image="explicit-image:tag",
    )

    assert config.base_image == "explicit-image:tag"
