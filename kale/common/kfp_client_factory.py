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

"""Factory for creating KFP client instances with configuration support."""

from typing import TYPE_CHECKING

import kfp

from kale.config import kfp_server_config

if TYPE_CHECKING:
    from kfp import Client


def get_kfp_client(
    host: str | None = None,
    cookies: str | None = None,
    credentials: str | None = None,
    existing_token: str | None = None,
    namespace: str | None = None,
    ssl_ca_cert: str | None = None,
) -> "Client":
    """Create a KFP client with configuration.

    Loads saved configuration from ~/.kale/kfp_server_config.json and allows
    parameter overrides. Explicit parameters override saved config if they are provided.

    Args:
        host: KFP API server host
        cookies: Authentication cookies
        credentials: Service account credentials
        existing_token: Bearer token for authentication
        namespace: Kubernetes namespace
        ssl_ca_cert: Path to CA certificate file

    Returns:
        kfp.Client instance configured with provided parameters or saved config
    """
    # Load saved configuration
    config = kfp_server_config.load_config()

    # Use parameter if provided, otherwise fall back to config
    if host is None:
        host = config.host
    if cookies is None:
        cookies = config.cookies
    if credentials is None:
        credentials = config.credentials
    if existing_token is None:
        existing_token = config.existing_token
    if namespace is None:
        namespace = config.namespace or "kubeflow"
    if ssl_ca_cert is None:
        ssl_ca_cert = config.ssl_ca_cert

    return kfp.Client(
        host=host,
        cookies=cookies,
        credentials=credentials,
        existing_token=existing_token,
        namespace=namespace,
        ssl_ca_cert=ssl_ca_cert,
    )
