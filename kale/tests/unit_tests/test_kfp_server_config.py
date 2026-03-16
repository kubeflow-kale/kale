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
import tempfile
import unittest
from unittest.mock import patch

from kale.config import kfp_server_config


class TestKFPServerConfig(unittest.TestCase):
    """Test KFP server configuration."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_path = os.path.join(self.temp_dir, "kfp_server_config.json")

    def tearDown(self):
        """Clean up test fixtures."""
        if os.path.exists(self.config_path):
            os.remove(self.config_path)
        os.rmdir(self.temp_dir)

    @patch("kale.config.kfp_server_config.get_config_path")
    def test_default_config(self, mock_get_path):
        """Test default configuration values."""
        mock_get_path.return_value = self.config_path

        config = kfp_server_config.load_config()

        self.assertIsNone(config.host)
        self.assertEqual(config.namespace, "kubeflow")
        self.assertIsNone(config.cookies)
        self.assertIsNone(config.existing_token)

    @patch("kale.config.kfp_server_config.get_config_path")
    def test_save_and_load_config(self, mock_get_path):
        """Test saving and loading configuration."""
        mock_get_path.return_value = self.config_path

        # Create and save config
        config = kfp_server_config.KFPServerConfig(
            host="http://custom-kfp:8888",
            namespace="custom-namespace",
            cookies="session=abc123",
            existing_token="token123",
        )
        kfp_server_config.save_config(config)

        # Load and verify
        loaded_config = kfp_server_config.load_config()
        self.assertEqual(loaded_config.host, "http://custom-kfp:8888")
        self.assertEqual(loaded_config.namespace, "custom-namespace")
        self.assertEqual(loaded_config.cookies, "session=abc123")
        self.assertEqual(loaded_config.existing_token, "token123")

    @patch("kale.config.kfp_server_config.get_config_path")
    def test_save_dict_config(self, mock_get_path):
        """Test saving configuration from dict."""
        mock_get_path.return_value = self.config_path

        config_dict = {
            "host": "http://test-kfp:8888",
            "namespace": "test-ns",
        }
        kfp_server_config.save_config(config_dict)

        # Load and verify
        loaded_config = kfp_server_config.load_config()
        self.assertEqual(loaded_config.host, "http://test-kfp:8888")
        self.assertEqual(loaded_config.namespace, "test-ns")

    @patch("kale.config.kfp_server_config.get_config_path")
    def test_config_to_dict(self, mock_get_path):
        """Test converting config to dictionary."""
        mock_get_path.return_value = self.config_path

        config = kfp_server_config.KFPServerConfig(host="http://test:8888", namespace="test")
        config_dict = config.to_dict()

        self.assertEqual(config_dict["host"], "http://test:8888")
        self.assertEqual(config_dict["namespace"], "test")
        self.assertNotIn("cookies", config_dict)  # None values not included
        self.assertNotIn("existing_token", config_dict)

    @patch("kale.config.kfp_server_config.get_config_path")
    def test_file_permissions(self, mock_get_path):
        """Test that config file has restrictive permissions."""
        mock_get_path.return_value = self.config_path

        config = kfp_server_config.KFPServerConfig(host="http://test:8888")
        kfp_server_config.save_config(config)

        # Check file permissions (should be 600 - owner read/write only)
        file_mode = os.stat(self.config_path).st_mode
        # Mask to get permission bits
        permissions = file_mode & 0o777
        self.assertEqual(permissions, 0o600)

    @patch("kale.config.kfp_server_config.get_config_path")
    def test_load_invalid_json(self, mock_get_path):
        """Test loading config when file contains invalid JSON."""
        mock_get_path.return_value = self.config_path

        # Write invalid JSON
        with open(self.config_path, "w") as f:
            f.write("invalid json{{{")

        # Should return default config without crashing
        config = kfp_server_config.load_config()
        self.assertIsNone(config.host)
        self.assertEqual(config.namespace, "kubeflow")


if __name__ == "__main__":
    unittest.main()
