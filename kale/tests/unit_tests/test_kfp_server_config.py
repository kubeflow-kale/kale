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

import json
import os

from testfixtures import mock

from kale.common import kfp_client_factory
from kale.config import kfp_server_config
from kale.config.kfp_server_config import KFPServerConfig


def test_get_config_path_default():
    """Test that default config path is returned when no env var is set."""
    with mock.patch.dict(os.environ, {}, clear=True):
        path = kfp_server_config.get_config_path()
        assert path.endswith(".config/kale/kfp_server_config.json")
        assert os.path.expanduser("~") in path


def test_get_config_path_env_override():
    """Test that KALE_CONFIG_PATH env var overrides default path."""
    custom_path = "/custom/path/to/config.json"
    with mock.patch.dict(os.environ, {"KALE_CONFIG_PATH": custom_path}):
        path = kfp_server_config.get_config_path()
        assert path == custom_path


def test_load_config_no_file(tmpdir):
    """Test that default config is returned when no file exists."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        config = kfp_server_config.load_config()

    # Should return default values
    assert config.host is None
    assert config.auth_type == "none"
    assert config.auth_params is None
    assert config.namespace == "kubeflow"
    assert config.ssl_ca_cert is None


def test_load_config_valid(tmpdir):
    """Test that valid config is loaded successfully."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")
    test_config = {
        "host": "http://localhost:8080",
        "auth_type": "existing_bearer_token",
        "auth_params": {"token": "test_token"},
        "namespace": "custom-namespace",
        "ssl_ca_cert": "/path/to/cert",
    }

    # Write config file
    with open(config_path, "w") as f:
        json.dump(test_config, f)

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        config = kfp_server_config.load_config()

    assert config.host == "http://localhost:8080"
    assert config.auth_type == "existing_bearer_token"
    assert config.auth_params == {"token": "test_token"}
    assert config.namespace == "custom-namespace"
    assert config.ssl_ca_cert == "/path/to/cert"


def test_load_config_malformed_json(tmpdir):
    """Test that defaults are returned on malformed JSON (with warning logged)."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")

    # Write malformed JSON
    with open(config_path, "w") as f:
        f.write("{invalid json")

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        config = kfp_server_config.load_config()

    # Should return defaults when JSON is malformed
    assert config.host is None
    assert config.auth_type == "none"
    assert config.auth_params is None
    assert config.namespace == "kubeflow"
    assert config.ssl_ca_cert is None


def test_load_config_read_error(tmpdir):
    """Test that defaults are returned on file read error (with warning logged)."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")

    # Create file and make it unreadable
    with open(config_path, "w") as f:
        json.dump({"host": "test"}, f)
    os.chmod(config_path, 0o000)

    try:
        with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
            config = kfp_server_config.load_config()

        # Should return defaults when file cannot be read
        assert config.host is None
        assert config.auth_type == "none"
        assert config.auth_params is None
        assert config.namespace == "kubeflow"
        assert config.ssl_ca_cert is None
    finally:
        # Restore permissions for cleanup
        os.chmod(config_path, 0o600)


def test_save_config_creates_directory(tmpdir):
    """Test that .config/kale directory is created if it doesn't exist."""
    config_path = os.path.join(tmpdir, ".config/kale", "kfp_server_config.json")
    test_config = {"host": "http://localhost:8080"}

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_server_config.save_config(test_config)

    # Directory and file should exist
    assert os.path.exists(os.path.dirname(config_path))
    assert os.path.exists(config_path)


def test_save_config_from_dict(tmpdir):
    """Test that config can be saved from a dictionary."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")
    test_config = {
        "host": "http://localhost:8080",
        "namespace": "custom-namespace",
    }

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_server_config.save_config(test_config)

    with open(config_path) as f:
        saved = json.load(f)

    assert saved["host"] == "http://localhost:8080"
    assert saved["namespace"] == "custom-namespace"


def test_save_config_from_object(tmpdir):
    """Test that config can be saved from KFPServerConfig object."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")
    test_config = KFPServerConfig(
        host="http://localhost:8080",
        auth_type="dex",
        auth_params={"cookies": "test_cookie"},
        namespace="custom-namespace",
    )

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_server_config.save_config(test_config)

    with open(config_path) as f:
        saved = json.load(f)

    assert saved["host"] == "http://localhost:8080"
    assert saved["auth_type"] == "dex"
    assert saved["auth_params"] == {"cookies": "test_cookie"}
    assert saved["namespace"] == "custom-namespace"


def test_save_config_file_permissions(tmpdir):
    """Test that saved config file has correct permissions (0o600)."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")
    test_config = {"host": "http://localhost:8080"}

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_server_config.save_config(test_config)

    file_stat = os.stat(config_path)
    # 0o600 means only owner can read/write
    assert file_stat.st_mode & 0o777 == 0o600


def test_config_persistence(tmpdir):
    """Test that saved config persists across save/load cycles."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")
    original_config = {
        "host": "http://localhost:8080",
        "auth_type": "existing_bearer_token",
        "auth_params": {"token": "test_token"},
        "namespace": "custom-namespace",
        "ssl_ca_cert": "/path/to/cert",
    }

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        # Save config
        kfp_server_config.save_config(original_config)

        # Load config
        loaded_config = kfp_server_config.load_config()

        # Verify all fields match
        assert loaded_config.host == original_config["host"]
        assert loaded_config.auth_type == original_config["auth_type"]
        assert loaded_config.auth_params == original_config["auth_params"]
        assert loaded_config.namespace == original_config["namespace"]
        assert loaded_config.ssl_ca_cert == original_config["ssl_ca_cert"]

        # Save again with modified values
        modified_config = {**original_config, "host": "http://new-host:9090"}
        kfp_server_config.save_config(modified_config)

        # Load again and verify changes
        reloaded_config = kfp_server_config.load_config()
        assert reloaded_config.host == "http://new-host:9090"
        assert reloaded_config.auth_type == original_config["auth_type"]


@mock.patch("kale.common.kfp_client_factory.kfp.Client")
@mock.patch("kale.common.kfp_authenticator.get_authenticator")
def test_get_kfp_client_with_saved_config(mock_get_auth, mock_client, tmpdir):
    """Test that get_kfp_client uses saved configuration."""
    from kale.common.kfp_authenticator import AuthResult

    config_path = os.path.join(tmpdir, "kfp_server_config.json")
    saved_config = {
        "host": "http://saved-host:8080",
        "auth_type": "dex",
        "auth_params": {"cookies": "saved_cookie"},
        "namespace": "saved-namespace",
    }

    # Save config
    with open(config_path, "w") as f:
        json.dump(saved_config, f)

    # Mock authenticator to return cookies
    mock_authenticator = mock.Mock()
    mock_authenticator.authenticate.return_value = AuthResult(cookies="saved_cookie")
    mock_get_auth.return_value = mock_authenticator

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_client_factory.get_kfp_client()

    # Verify authenticator was called with correct params
    mock_get_auth.assert_called_once_with("dex")
    mock_authenticator.authenticate.assert_called_once_with({"cookies": "saved_cookie"})

    # Verify kfp.Client was called with auth result
    mock_client.assert_called_once_with(
        host="http://saved-host:8080",
        cookies="saved_cookie",
        credentials=None,
        existing_token=None,
        namespace="saved-namespace",
        ssl_ca_cert=None,
    )


@mock.patch("kale.common.kfp_client_factory.kfp.Client")
@mock.patch("kale.common.kfp_authenticator.get_authenticator")
def test_get_kfp_client_parameter_override(mock_get_auth, mock_client, tmpdir):
    """Test that explicit parameters override saved config."""
    from kale.common.kfp_authenticator import AuthResult

    config_path = os.path.join(tmpdir, "kfp_server_config.json")
    saved_config = {
        "host": "http://saved-host:8080",
        "auth_type": "dex",
        "auth_params": {"cookies": "saved_cookie"},
        "namespace": "saved-namespace",
    }

    # Save config
    with open(config_path, "w") as f:
        json.dump(saved_config, f)

    # Mock authenticator for override auth
    mock_authenticator = mock.Mock()
    mock_authenticator.authenticate.return_value = AuthResult(existing_token="override_token")
    mock_get_auth.return_value = mock_authenticator

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        # Call with explicit parameters that should override
        kfp_client_factory.get_kfp_client(
            host="http://override-host:9090",
            auth_type="existing_bearer_token",
            auth_params={"token": "override_token"},
            namespace="override-namespace",
        )

    # Verify authenticator was called with override params
    mock_get_auth.assert_called_once_with("existing_bearer_token")
    mock_authenticator.authenticate.assert_called_once_with({"token": "override_token"})

    # Verify kfp.Client was called with override values
    mock_client.assert_called_once_with(
        host="http://override-host:9090",
        cookies=None,
        credentials=None,
        existing_token="override_token",
        namespace="override-namespace",
        ssl_ca_cert=None,
    )


@mock.patch("kale.common.kfp_client_factory.kfp.Client")
@mock.patch("kale.common.kfp_authenticator.get_authenticator")
def test_get_kfp_client_default_behavior(mock_get_auth, mock_client, tmpdir):
    """Test default behavior when no config and no parameters provided."""
    from kale.common.kfp_authenticator import AuthResult

    config_path = os.path.join(tmpdir, "kfp_server_config.json")

    # Mock authenticator for "none" auth type
    mock_authenticator = mock.Mock()
    mock_authenticator.authenticate.return_value = AuthResult()
    mock_get_auth.return_value = mock_authenticator

    # No config file exists
    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_client_factory.get_kfp_client()

    # Verify authenticator was called with "none" (default)
    mock_get_auth.assert_called_once_with("none")

    # Verify kfp.Client was called with defaults (None for host allows in-cluster discovery)
    mock_client.assert_called_once_with(
        host=None,
        cookies=None,
        credentials=None,
        existing_token=None,
        namespace="kubeflow",
        ssl_ca_cert=None,
    )


@mock.patch("kale.common.kfp_client_factory.kfp.Client")
@mock.patch("kale.common.kfp_authenticator.get_authenticator")
def test_get_kfp_client_all_parameters(mock_get_auth, mock_client, tmpdir):
    """Test that all parameters are correctly passed to kfp.Client."""
    from kale.common.kfp_authenticator import AuthResult

    config_path = os.path.join(tmpdir, "kfp_server_config.json")

    # Mock authenticator
    mock_authenticator = mock.Mock()
    mock_authenticator.authenticate.return_value = AuthResult(existing_token="test_token")
    mock_get_auth.return_value = mock_authenticator

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_client_factory.get_kfp_client(
            host="http://test-host:8080",
            auth_type="existing_bearer_token",
            auth_params={"token": "test_token"},
            namespace="test_namespace",
            ssl_ca_cert="/path/to/cert",
        )

    # Verify authenticator was used
    mock_get_auth.assert_called_once_with("existing_bearer_token")
    mock_authenticator.authenticate.assert_called_once_with({"token": "test_token"})

    # Verify all parameters were passed correctly
    mock_client.assert_called_once_with(
        host="http://test-host:8080",
        cookies=None,
        credentials=None,
        existing_token="test_token",
        namespace="test_namespace",
        ssl_ca_cert="/path/to/cert",
    )
