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


def test_comment_magic_commands():
    """Test the magic common properly comments a multiline code block."""
    code = '''
%%a magic cell command
some code
%matplotlib inline
%consecutive command
some other code
some other code
%another command
some other code
    '''

    target = '''
#%%a magic cell command
some code
#%matplotlib inline
#%consecutive command
some other code
some other code
#%another command
some other code
    '''
    assert utils.comment_magic_commands(code) == target.strip()


def test_dedent_no_op():
    """Test that text is not dedented when not needed."""
    text = (
        "Line1\n"
        "  Line2\n"
    )

    assert text == utils.dedent(text)


def test_dedent():
    """Text that text is properly dedented."""
    text = (
        "  Line1\n"
        "    Line2\n"
    )

    target = (
        "Line1\n"
        "  Line2\n"
    )

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
    monkeypatch.setenv("KALE_DEVPI_SIMPLE_URL",
                       "https://devpi.example/simple/")

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
