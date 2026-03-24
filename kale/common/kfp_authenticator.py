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

"""KFP authentication module for creating credentials at runtime."""

import logging
import os
from typing import Any

from kfp.client import KF_PIPELINES_SA_TOKEN_PATH, ServiceAccountTokenVolumeCredentials

log = logging.getLogger(__name__)


class AuthResult:
    """Result from authentication containing credentials for kfp.Client.

    This class holds the various authentication artifacts that can be passed
    to kfp.Client(). Only one authentication method should be set at a time.

    Attributes:
        credentials: ServiceAccountTokenVolumeCredentials object for K8s service account auth
        cookies: Cookie string for DEX-based authentication
        existing_token: Bearer token string for token-based authentication
    """

    def __init__(
        self,
        credentials: ServiceAccountTokenVolumeCredentials | None = None,
        cookies: str | None = None,
        existing_token: str | None = None,
    ):
        self.credentials = credentials
        self.cookies = cookies
        self.existing_token = existing_token


class K8sServiceAccountTokenAuthenticator:
    """Authenticator for Kubernetes service account token-based authentication.

    Creates a ServiceAccountTokenVolumeCredentials object that reads the
    service account token from a file path (typically mounted by Kubernetes).
    """

    def authenticate(self, params: dict[str, Any] | None = None) -> AuthResult:
        """Create credentials from Kubernetes service account token.

        Args:
            params: Optional dictionary containing:
                - token_path: Path to service account token file.
                  Defaults to KF_PIPELINES_SA_TOKEN_PATH env var or standard location.

        Returns:
            AuthResult with ServiceAccountTokenVolumeCredentials

        Raises:
            FileNotFoundError: If token file doesn't exist
            ValueError: If token file is empty
        """
        params = params or {}
        token_path = params.get(
            "token_path",
            os.getenv("KF_PIPELINES_SA_TOKEN_PATH", KF_PIPELINES_SA_TOKEN_PATH),
        )

        # Validate token file exists and is non-empty
        if not os.path.exists(token_path):
            raise FileNotFoundError(
                f"Service account token file not found at {token_path}. "
                "Ensure you're running in a Kubernetes pod with a service account token mounted."
            )

        with open(token_path) as f:
            token_content = f.read().strip()
            if not token_content:
                raise ValueError(f"Service account token file at {token_path} is empty")

        log.info("Using Kubernetes service account token from %s", token_path)
        credentials = ServiceAccountTokenVolumeCredentials(path=token_path)
        return AuthResult(credentials=credentials)


class ExistingBearerTokenAuthenticator:
    """Authenticator for pre-existing bearer token authentication."""

    def authenticate(self, params: dict[str, Any] | None = None) -> AuthResult:
        """Create credentials from an existing bearer token.

        Args:
            params: Dictionary containing:
                - token: Bearer token string (required)

        Returns:
            AuthResult with bearer token

        Raises:
            ValueError: If token is missing or empty
        """
        params = params or {}
        token = params.get("token")

        if not token:
            raise ValueError("Bearer token is required but not provided in auth_params['token']")

        log.info("Using existing bearer token for authentication")
        return AuthResult(existing_token=token)


class DexAuthenticator:
    """Authenticator for DEX-based authentication using cookies."""

    def authenticate(self, params: dict[str, Any] | None = None) -> AuthResult:
        """Create credentials from DEX session cookies.

        Args:
            params: Dictionary containing:
                - cookies: Cookie string (required)

        Returns:
            AuthResult with cookies

        Raises:
            ValueError: If cookies are missing or empty
        """
        params = params or {}
        cookies = params.get("cookies")

        if not cookies:
            raise ValueError("Cookies are required but not provided in auth_params['cookies']")

        log.info("Using DEX cookie-based authentication")
        return AuthResult(cookies=cookies)


class NoAuthAuthenticator:
    """Authenticator for unsecured KFP endpoints (no authentication required)."""

    def authenticate(self, params: dict[str, Any] | None = None) -> AuthResult:
        """Return empty credentials for unsecured endpoints.

        Args:
            params: Ignored

        Returns:
            AuthResult with no credentials set
        """
        log.info("Using no authentication (unsecured endpoint)")
        return AuthResult()


def get_authenticator(
    auth_type: str,
) -> (
    K8sServiceAccountTokenAuthenticator
    | ExistingBearerTokenAuthenticator
    | DexAuthenticator
    | NoAuthAuthenticator
):
    """Factory function to get the appropriate authenticator for an auth type.

    Args:
        auth_type: Authentication type. Supported values:
            - "kubernetes_service_account_token": K8s service account token
            - "existing_bearer_token": Pre-existing bearer token
            - "dex": DEX cookie-based authentication
            - "none": No authentication

    Returns:
        Authenticator instance for the specified type.
        Defaults to NoAuthAuthenticator for unknown types.
    """
    authenticators = {
        "kubernetes_service_account_token": K8sServiceAccountTokenAuthenticator(),
        "existing_bearer_token": ExistingBearerTokenAuthenticator(),
        "dex": DexAuthenticator(),
        "none": NoAuthAuthenticator(),
    }

    authenticator = authenticators.get(auth_type)
    if authenticator is None:
        log.warning("Unknown auth_type '%s', defaulting to no authentication", auth_type)
        return NoAuthAuthenticator()

    return authenticator
