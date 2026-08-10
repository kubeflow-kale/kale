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

"""Suite of random helpers regarding pod manipulation."""

import os

from kale.common import k8sutils

NAMESPACE_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"


def get_namespace():
    """Get the current namespace.

    Resolution order:
    1. In-cluster service-account file (running inside a pod).
    2. ``KALE_NAMESPACE`` environment variable (local dev / CI).
    """
    try:
        with open(NAMESPACE_PATH) as f:
            return f.read()
    except OSError:
        pass

    # Intended for local development / testing only (e.g. `make jupyter`
    # outside a pod).  Set to the namespace whose PVCs you want to browse
    # in the Volumes panel, e.g. ``kubeflow-user-example-com``.
    env_ns = os.getenv("KALE_NAMESPACE")
    if env_ns:
        return env_ns

    raise RuntimeError(
        "Cannot determine namespace: not running inside a pod and "
        "KALE_NAMESPACE environment variable is not set."
    )


def get_pod_name():
    """Get the current pod name.

    Resolution order:
    1. ``HOSTNAME`` environment variable (set automatically inside a pod).
    2. ``KALE_POD_NAME`` environment variable (local dev / testing only —
       set to the notebook pod whose volumes you want to browse, e.g.
       ``testingg-0``).
    """
    # KALE_POD_NAME is intended for local development / testing only (e.g.
    # ``make jupyter`` outside a pod).  Set to the notebook pod whose mounted
    # volumes you want to browse in the "Select from notebook" dialog, e.g.
    # ``testingg-0``.
    pod_name = os.getenv("KALE_POD_NAME") or os.getenv("HOSTNAME")
    if not pod_name:
        raise RuntimeError(
            "Cannot determine pod name: HOSTNAME is not set and "
            "KALE_POD_NAME environment variable is not set."
        )
    return pod_name


def is_workspace_dir(directory):
    """Check dir path is the container's home folder."""
    return directory == os.getenv("HOME")


def get_pod(name, namespace):
    """Get a pod.

    This function seems redundant but it can save a few repeated lines of code.
    """
    k8s_client = k8sutils.get_v1_client()
    return k8s_client.read_namespaced_pod(name, namespace)
