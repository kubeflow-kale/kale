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


def test_load_config_no_file(tmpdir):
    """Test that default config is returned when no file exists."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        config = kfp_server_config.load_config()

    # Should return default values
    assert config.host is None
    assert config.cookies is None
    assert config.credentials is None
    assert config.existing_token is None
    assert config.namespace == "kubeflow"
    assert config.ssl_ca_cert is None


def test_load_config_valid(tmpdir):
    """Test that valid config is loaded successfully."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")
    test_config = {
        "host": "http://localhost:8080",
        "cookies": "test_cookie",
        "credentials": "test_creds",
        "existing_token": "test_token",
        "namespace": "custom-namespace",
        "ssl_ca_cert": "/path/to/cert",
    }

    # Write config file
    with open(config_path, "w") as f:
        json.dump(test_config, f)

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        config = kfp_server_config.load_config()

    assert config.host == "http://localhost:8080"
    assert config.cookies == "test_cookie"
    assert config.credentials == "test_creds"
    assert config.existing_token == "test_token"
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
    assert config.cookies is None
    assert config.credentials is None
    assert config.existing_token is None
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
        assert config.cookies is None
        assert config.credentials is None
        assert config.existing_token is None
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
        cookies="test_cookie",
        namespace="custom-namespace",
    )

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_server_config.save_config(test_config)

    with open(config_path) as f:
        saved = json.load(f)

    assert saved["host"] == "http://localhost:8080"
    assert saved["cookies"] == "test_cookie"
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
        "cookies": "test_cookie",
        "credentials": "test_creds",
        "existing_token": "test_token",
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
        assert loaded_config.cookies == original_config["cookies"]
        assert loaded_config.credentials == original_config["credentials"]
        assert loaded_config.existing_token == original_config["existing_token"]
        assert loaded_config.namespace == original_config["namespace"]
        assert loaded_config.ssl_ca_cert == original_config["ssl_ca_cert"]

        # Save again with modified values
        modified_config = {**original_config, "host": "http://new-host:9090"}
        kfp_server_config.save_config(modified_config)

        # Load again and verify changes
        reloaded_config = kfp_server_config.load_config()
        assert reloaded_config.host == "http://new-host:9090"
        assert reloaded_config.cookies == original_config["cookies"]


@mock.patch("kale.common.kfp_client_factory.kfp.Client")
def test_get_kfp_client_with_saved_config(mock_client, tmpdir):
    """Test that _get_kfp_client uses saved configuration."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")
    saved_config = {
        "host": "http://saved-host:8080",
        "cookies": "saved_cookie",
        "namespace": "saved-namespace",
    }

    # Save config
    with open(config_path, "w") as f:
        json.dump(saved_config, f)

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_client_factory.get_kfp_client()

    # Verify kfp.Client was called with saved config
    mock_client.assert_called_once_with(
        host="http://saved-host:8080",
        cookies="saved_cookie",
        credentials=None,
        existing_token=None,
        namespace="saved-namespace",
        ssl_ca_cert=None,
    )


@mock.patch("kale.common.kfp_client_factory.kfp.Client")
def test_get_kfp_client_parameter_override(mock_client, tmpdir):
    """Test that explicit parameters override saved config."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")
    saved_config = {
        "host": "http://saved-host:8080",
        "cookies": "saved_cookie",
        "namespace": "saved-namespace",
    }

    # Save config
    with open(config_path, "w") as f:
        json.dump(saved_config, f)

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        # Call with explicit parameters that should override
        kfp_client_factory.get_kfp_client(
            host="http://override-host:9090",
            namespace="override-namespace",
        )

    # Verify kfp.Client was called with override values
    mock_client.assert_called_once_with(
        host="http://override-host:9090",
        cookies="saved_cookie",  # Not overridden
        credentials=None,
        existing_token=None,
        namespace="override-namespace",
        ssl_ca_cert=None,
    )


@mock.patch("kale.common.kfp_client_factory.kfp.Client")
def test_get_kfp_client_default_behavior(mock_client, tmpdir):
    """Test default behavior when no config and no parameters provided."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")

    # No config file exists
    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_client_factory.get_kfp_client()

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
def test_get_kfp_client_all_parameters(mock_client, tmpdir):
    """Test that all 6 parameters are correctly passed to kfp.Client."""
    config_path = os.path.join(tmpdir, "kfp_server_config.json")

    with mock.patch("kale.config.kfp_server_config.get_config_path", return_value=config_path):
        kfp_client_factory.get_kfp_client(
            host="http://test-host:8080",
            cookies="test_cookies",
            credentials="test_credentials",
            existing_token="test_token",
            namespace="test_namespace",
            ssl_ca_cert="/path/to/cert",
        )

    # Verify all parameters were passed correctly
    mock_client.assert_called_once_with(
        host="http://test-host:8080",
        cookies="test_cookies",
        credentials="test_credentials",
        existing_token="test_token",
        namespace="test_namespace",
        ssl_ca_cert="/path/to/cert",
    )
