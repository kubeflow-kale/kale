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
from kale.pipeline import SecurityContextConfig


def test_comment_magic_commands():
    """Test the magic common properly comments a multiline code block."""
    code = """
%%a magic cell command
some code
%matplotlib inline
%consecutive command
some other code
some other code
%another command
some other code
    """

    target = """
#%%a magic cell command
some code
#%matplotlib inline
#%consecutive command
some other code
some other code
#%another command
some other code
    """
    assert utils.comment_magic_commands(code) == target.strip()


def test_dedent_no_op():
    """Test that text is not dedented when not needed."""
    text = "Line1\n  Line2\n"

    assert text == utils.dedent(text)


def test_dedent():
    """Text that text is properly dedented."""
    text = "  Line1\n    Line2\n"

    target = "Line1\n  Line2\n"

    assert utils.dedent(text) == target


def _clear_env(monkeypatch):
    """Ensure Kale-specific env vars are unset for predictable tests."""
    for key in (
        "KALE_PIP_INDEX_URLS",
        "KALE_DEV_MODE",
        "KALE_DEVPI_SIMPLE_URL",
    ):
        monkeypatch.delenv(key, raising=False)


def test_compute_pip_index_urls_default(monkeypatch):
    """When no env overrides are present, fall back to PyPI only."""
    _clear_env(monkeypatch)

    assert utils.compute_pip_index_urls() == ["https://pypi.org/simple"]


def test_compute_pip_index_urls_dev_mode_default_url(monkeypatch):
    """Dev mode without a custom index uses the default devpi URL + PyPI."""
    _clear_env(monkeypatch)
    monkeypatch.setenv("KALE_DEV_MODE", "true")

    assert utils.compute_pip_index_urls() == [
        "http://127.0.0.1:3141/root/dev/+simple/",
        "https://pypi.org/simple",
    ]


def test_compute_pip_index_urls_dev_mode_custom_url(monkeypatch):
    """Dev mode honors KALE_DEVPI_SIMPLE_URL before appending PyPI."""
    _clear_env(monkeypatch)
    monkeypatch.setenv("KALE_DEV_MODE", "1")
    monkeypatch.setenv("KALE_DEVPI_SIMPLE_URL", "https://devpi.example/simple/")

    assert utils.compute_pip_index_urls() == [
        "https://devpi.example/simple/",
        "https://pypi.org/simple",
    ]


def test_compute_pip_index_urls_override(monkeypatch):
    """Explicit overrides take precedence and keep their order."""
    _clear_env(monkeypatch)
    monkeypatch.setenv(
        "KALE_PIP_INDEX_URLS",
        "https://mirror.one/simple, https://mirror.two/simple",
    )

    assert utils.compute_pip_index_urls() == [
        "https://mirror.one/simple",
        "https://mirror.two/simple",
        "https://pypi.org/simple",
    ]


def test_compute_pip_index_urls_override_beats_dev_mode(monkeypatch):
    """An explicit override should win even when dev mode is enabled."""
    _clear_env(monkeypatch)
    monkeypatch.setenv("KALE_DEV_MODE", "true")
    monkeypatch.setenv(
        "KALE_PIP_INDEX_URLS",
        "https://mirror.only/simple",
    )

    assert utils.compute_pip_index_urls() == [
        "https://mirror.only/simple",
        "https://pypi.org/simple",
    ]


def _clear_security_context_env(monkeypatch):
    """Ensure security context env vars are unset for predictable tests."""
    for key in (
        "KALE_SECURITY_CONTEXT_ENABLED",
        "KALE_SECURITY_CONTEXT_RUN_AS_USER",
        "KALE_SECURITY_CONTEXT_RUN_AS_GROUP",
        "KALE_SECURITY_CONTEXT_RUN_AS_NON_ROOT",
    ):
        monkeypatch.delenv(key, raising=False)


def test_get_security_context_from_env_default(monkeypatch):
    """When no env vars are set, the default values should be used"""
    _clear_security_context_env(monkeypatch)

    default_sc = SecurityContextConfig()
    sc_from_config = utils.get_security_context_from_env()
    assert sc_from_config == default_sc


def test_get_security_context_from_env_enabled_true(monkeypatch):
    """Test parsing of KALE_SECURITY_CONTEXT_ENABLED with various true values."""
    _clear_security_context_env(monkeypatch)

    for val in ("1", "true", "True", "TRUE", "yes", "YES", "on", "ON"):
        monkeypatch.setenv("KALE_SECURITY_CONTEXT_ENABLED", val)
        result = utils.get_security_context_from_env()
        assert result.enabled is True, f"Expected True for '{val}'"


def test_get_security_context_from_env_enabled_false(monkeypatch):
    """Test parsing of KALE_SECURITY_CONTEXT_ENABLED with false values."""
    _clear_security_context_env(monkeypatch)

    for val in ("0", "false", "False", "FALSE", "no", "NO", "off", "OFF", ""):
        monkeypatch.setenv("KALE_SECURITY_CONTEXT_ENABLED", val)
        result = utils.get_security_context_from_env()
        assert result.enabled is False, f"Expected False for '{val}'"


def test_get_security_context_from_env_run_as_user(monkeypatch):
    """Test parsing of KALE_SECURITY_CONTEXT_RUN_AS_USER."""
    _clear_security_context_env(monkeypatch)
    monkeypatch.setenv("KALE_SECURITY_CONTEXT_RUN_AS_USER", "1000")

    result = utils.get_security_context_from_env()
    assert result.run_as_user == 1000


def test_get_security_context_from_env_run_as_group(monkeypatch):
    """Test parsing of KALE_SECURITY_CONTEXT_RUN_AS_GROUP."""
    _clear_security_context_env(monkeypatch)
    monkeypatch.setenv("KALE_SECURITY_CONTEXT_RUN_AS_GROUP", "500")

    result = utils.get_security_context_from_env()
    assert result.run_as_group == 500


def test_get_security_context_from_env_run_as_non_root(monkeypatch):
    """Test parsing of KALE_SECURITY_CONTEXT_RUN_AS_NON_ROOT."""
    _clear_security_context_env(monkeypatch)

    monkeypatch.setenv("KALE_SECURITY_CONTEXT_RUN_AS_NON_ROOT", "true")
    assert utils.get_security_context_from_env().run_as_non_root is True

    monkeypatch.setenv("KALE_SECURITY_CONTEXT_RUN_AS_NON_ROOT", "false")
    assert utils.get_security_context_from_env().run_as_non_root is False


def test_get_security_context_from_env_all_set(monkeypatch):
    """Test that all env vars are parsed correctly when set."""
    _clear_security_context_env(monkeypatch)
    monkeypatch.setenv("KALE_SECURITY_CONTEXT_ENABLED", "false")
    monkeypatch.setenv("KALE_SECURITY_CONTEXT_RUN_AS_USER", "1000")
    monkeypatch.setenv("KALE_SECURITY_CONTEXT_RUN_AS_GROUP", "1000")
    monkeypatch.setenv("KALE_SECURITY_CONTEXT_RUN_AS_NON_ROOT", "false")

    assert utils.get_security_context_from_env() == SecurityContextConfig(
        enabled=False, run_as_user=1000, run_as_group=1000, run_as_non_root=False
    )
