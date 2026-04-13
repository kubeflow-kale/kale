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

from abc import ABC, abstractmethod
import logging
import os
from typing import Any

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
        credentials: Any | None = None,
        cookies: str | None = None,
        existing_token: str | None = None,
    ):
        self.credentials = credentials
        self.cookies = cookies
        self.existing_token = existing_token


class Authenticator(ABC):
    """Base class for KFP authentication strategies."""

    @abstractmethod
    def authenticate(self, config: dict[str, Any] | None = None) -> AuthResult:
        """Create credentials for KFP authentication.

        Args:
            config: Optional configuration dictionary specific to auth type

        Returns:
            AuthResult with resolved credentials
        """
        pass


class K8sServiceAccountTokenAuthenticator(Authenticator):
    """Authenticator for Kubernetes service account token-based authentication.

    Creates a ServiceAccountTokenVolumeCredentials object that reads the
    service account token from a file path (typically mounted by Kubernetes).
    """

    def authenticate(self, config: dict[str, Any] | None = None) -> AuthResult:
        """Create credentials from Kubernetes service account token.

        Args:
            config: Optional dictionary containing:
                - token_path: Path to service account token file.
                  If not provided, uses KF_PIPELINES_SA_TOKEN_PATH env var or standard location.

        Returns:
            AuthResult with ServiceAccountTokenVolumeCredentials

        Raises:
            FileNotFoundError: If token file doesn't exist
            ValueError: If token file is empty
        """
        from kfp.client import KF_PIPELINES_SA_TOKEN_PATH, ServiceAccountTokenVolumeCredentials

        config = config or {}
        token_path = config.get(
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


class ExistingBearerTokenAuthenticator(Authenticator):
    """Authenticator for pre-existing bearer token authentication.

    Resolves token from environment variable or file, never stores it directly in config.
    """

    def authenticate(self, config: dict[str, Any] | None = None) -> AuthResult:
        """Create credentials from an existing bearer token.

        Token is resolved from environment variable or file at runtime.

        Args:
            config: Dictionary containing ONE of:
                - file_path: Path to file containing the token
                - env_var: Name of environment variable containing the token
                If neither provided, checks KF_PIPELINES_TOKEN env var by default

        Returns:
            AuthResult with bearer token

        Raises:
            ValueError: If token cannot be resolved
        """
        config = config or {}

        file_path = config.get("file_path")
        if file_path:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Token file not found at {file_path}")

            with open(file_path) as f:
                token = f.read().strip()
                if not token:
                    raise ValueError(f"Token file at {file_path} is empty")

            log.info("Using bearer token from file %s", file_path)
            return AuthResult(existing_token=token)

        env_var = config.get("env_var", "KF_PIPELINES_TOKEN")
        token = os.getenv(env_var)
        if token:
            log.info("Using bearer token from environment variable %s", env_var)
            return AuthResult(existing_token=token.strip())

        raise ValueError(
            f"Bearer token not found. Set {env_var} environment variable "
            f"or provide file_path in auth_config"
        )


class DexAuthenticator(Authenticator):
    """Authenticator for DEX-based authentication using cookies.

    Resolves cookies from environment variable or file, never stores them directly in config.
    """

    def authenticate(self, config: dict[str, Any] | None = None) -> AuthResult:
        """Create credentials from DEX session cookies.

        Cookies are resolved from environment variable or file at runtime.

        Args:
            config: Dictionary containing ONE of:
                - env_var: Name of environment variable containing the cookies
                - file_path: Path to file containing the cookies
                If neither provided, checks KF_PIPELINES_COOKIES env var by default

        Returns:
            AuthResult with cookies

        Raises:
            ValueError: If cookies cannot be resolved
        """
        config = config or {}

        file_path = config.get("file_path")
        if file_path:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Cookies file not found at {file_path}")

            with open(file_path) as f:
                cookies = f.read().strip()
                if not cookies:
                    raise ValueError(f"Cookies file at {file_path} is empty")

            log.info("Using DEX cookies from file %s", file_path)
            return AuthResult(cookies=cookies)

        env_var = config.get("env_var", "KF_PIPELINES_COOKIES")
        if env_var:
            cookies = os.getenv(env_var)
            if cookies:
                log.info("Using DEX cookies from environment variable %s", env_var)
                return AuthResult(cookies=cookies.strip())

        raise ValueError(
            f"DEX cookies not found. Set {env_var} environment variable "
            f"or provide file_path in auth_config"
        )


class NoAuthAuthenticator(Authenticator):
    """Authenticator for unsecured KFP endpoints (no authentication required)."""

    def authenticate(self, config: dict[str, Any] | None = None) -> AuthResult:
        """Return empty credentials for unsecured endpoints.

        Args:
            config: Ignored

        Returns:
            AuthResult with no credentials set
        """
        log.info("Using no authentication (unsecured endpoint)")
        return AuthResult()


def get_authenticator(auth_type: str) -> Authenticator:
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
