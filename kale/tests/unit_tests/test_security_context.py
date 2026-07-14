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


from kale.pipeline import PipelineConfig, SecurityContextConfig


class TestSecurityContextConfig:
    """Tests for SecurityContextConfig class."""

    def test_default_values(self):
        """Test that default values are set correctly."""
        config = SecurityContextConfig()

        assert config.enabled is True
        assert config.run_as_user == 65534
        assert config.run_as_group == 0
        assert config.run_as_non_root is True

    def test_custom_values(self):
        """Test that custom values can be set."""
        config = SecurityContextConfig(
            enabled=False,
            run_as_user=1000,
            run_as_group=1000,
            run_as_non_root=False,
        )

        assert config.enabled is False
        assert config.run_as_user == 1000
        assert config.run_as_group == 1000
        assert config.run_as_non_root is False

    def test_partial_values(self):
        """Test that partial values can be set, rest use defaults."""
        config = SecurityContextConfig(
            run_as_user=1000,
        )

        assert config.enabled is True  # default
        assert config.run_as_user == 1000  # custom
        assert config.run_as_group == 0  # default
        assert config.run_as_non_root is True  # default

    def test_to_dict(self):
        """Test that to_dict returns all values."""
        config = SecurityContextConfig()

        result = config.to_dict()

        assert result == {
            "enabled": True,
            "run_as_user": 65534,
            "run_as_group": 0,
            "run_as_non_root": True,
        }

    def test_to_dict_custom_values(self):
        """Test that to_dict returns custom values."""
        config = SecurityContextConfig(
            enabled=False,
            run_as_user=1000,
            run_as_group=500,
            run_as_non_root=False,
        )

        result = config.to_dict()

        assert result == {
            "enabled": False,
            "run_as_user": 1000,
            "run_as_group": 500,
            "run_as_non_root": False,
        }


class TestPipelineConfigSecurityContext:
    """Tests for security_context integration in PipelineConfig."""

    def _clear_env(self, monkeypatch):
        """Clear security context env vars."""
        for key in (
            "KALE_SECURITY_CONTEXT_ENABLED",
            "KALE_SECURITY_CONTEXT_RUN_AS_USER",
            "KALE_SECURITY_CONTEXT_RUN_AS_GROUP",
            "KALE_SECURITY_CONTEXT_RUN_AS_NON_ROOT",
        ):
            monkeypatch.delenv(key, raising=False)

    def test_security_context_default_values(self, monkeypatch):
        """Test that security_context is initialized with defaults when not provided."""
        self._clear_env(monkeypatch)

        # Create a minimal PipelineConfig with required fields
        config = PipelineConfig(
            pipeline_name="test-pipeline",
            experiment_name="test-experiment",
        )

        # After initialization, security_context should be set with defaults
        assert config.security_context is not None
        assert config.security_context.enabled is True
        assert config.security_context.run_as_user == 65534
        assert config.security_context.run_as_group == 0
        assert config.security_context.run_as_non_root is True

    def test_security_context_env_override(self, monkeypatch):
        """Test that env vars override security_context defaults."""
        self._clear_env(monkeypatch)
        monkeypatch.setenv("KALE_SECURITY_CONTEXT_ENABLED", "false")
        monkeypatch.setenv("KALE_SECURITY_CONTEXT_RUN_AS_USER", "1000")

        config = PipelineConfig(
            pipeline_name="test-pipeline",
            experiment_name="test-experiment",
        )

        assert config.security_context.enabled is False
        assert config.security_context.run_as_user == 1000
        # Defaults still apply for unset env vars
        assert config.security_context.run_as_group == 0
        assert config.security_context.run_as_non_root is True

    def test_security_context_from_kwargs(self, monkeypatch):
        """Test that security_context can be provided via kwargs."""
        self._clear_env(monkeypatch)

        config = PipelineConfig(
            pipeline_name="test-pipeline",
            experiment_name="test-experiment",
            security_context={
                "enabled": False,
                "run_as_user": 2000,
                "run_as_group": 2000,
                "run_as_non_root": False,
            },
        )

        # Should preserve the provided security_context
        assert config.security_context.enabled is False
        assert config.security_context.run_as_user == 2000
        assert config.security_context.run_as_group == 2000
        assert config.security_context.run_as_non_root is False

    def test_security_context_in_to_dict(self, monkeypatch):
        """Test that security_context is included in to_dict output."""
        self._clear_env(monkeypatch)

        config = PipelineConfig(
            pipeline_name="test-pipeline",
            experiment_name="test-experiment",
        )

        result = config.to_dict()

        assert "security_context" in result
        assert result["security_context"]["enabled"] is True
        assert result["security_context"]["run_as_user"] == 65534
