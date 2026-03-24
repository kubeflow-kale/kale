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
import logging
import os
from typing import Any

from kale.config.config import Config, Field

log = logging.getLogger(__name__)


class KFPServerConfig(Config):
    """Configuration for KFP server connection."""

    host = Field(type=str, default=None)
    cookies = Field(type=str, default=None)
    credentials = Field(type=str, default=None)
    existing_token = Field(type=str, default=None)
    namespace = Field(type=str, default="kubeflow")
    ssl_ca_cert = Field(type=str, default=None)


def get_config_path() -> str:
    """Get the path to the KFP server configuration file."""
    kale_dir = os.path.join(os.path.expanduser("~"), ".config/kale")
    return os.path.join(kale_dir, "kfp_server_config.json")


def load_config() -> KFPServerConfig:
    """Load KFP server configuration from disk.

    Returns:
        KFPServerConfig instance. If no config file exists, returns default config.
    """
    config_path = get_config_path()
    if not os.path.exists(config_path):
        log.debug("No KFP server config found at %s, using defaults", config_path)
        return KFPServerConfig()

    try:
        with open(config_path) as f:
            config_dict = json.load(f)
        log.info("Loaded KFP server config from %s", config_path)
        return KFPServerConfig(**config_dict)
    except (json.JSONDecodeError, OSError) as e:
        log.warning("Failed to load KFP server config from %s: %s. Using defaults.", config_path, e)
        return KFPServerConfig()


def save_config(config: KFPServerConfig | dict[str, Any]) -> None:
    """Save KFP server configuration to disk.

    Args:
        config: KFPServerConfig instance or dict with config values
    """
    if isinstance(config, dict):
        config = KFPServerConfig(**config)

    config_path = get_config_path()
    kale_dir = os.path.dirname(config_path)

    # Create .config/kale directory if it doesn't exist
    os.makedirs(kale_dir, exist_ok=True)

    config_dict = config.to_dict()
    with open(config_path, "w") as f:
        json.dump(config_dict, f, indent=2)

    # Set restrictive permissions for security (only owner can read/write)
    os.chmod(config_path, 0o600)
    log.info("Saved KFP server config to %s", config_path)
