# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

import kubernetes


_k8s_watch = None
_api_client = None
_api_v1_client = None
_k8s_co_client = None


def _load_config():
    try:
        kubernetes.config.load_incluster_config()
    except kubernetes.config.ConfigException:  # Not in a notebook server
        try:
            kubernetes.config.load_kube_config()
        # FIXME: `kubernetes` raises a TypeError when a `config` file is not
        #  found. This is fixed starting from version `11.0.0`, which raises
        #  the correct `ConfigException`. We cannot yet upgrade the package
        #  because `kfserving` relies on `kubernetes==10.0.1`
        except TypeError:
            raise kubernetes.config.ConfigException("Invalid kube-config file."
                                                    " No configuration found.")


def get_v1_client():
    """Get the Kubernetes V1 ApiClient."""
    global _api_client
    global _api_v1_client
    if not _api_client:
        _load_config()
        _api_client = kubernetes.client.ApiClient()
    if not _api_v1_client:
        _api_v1_client = kubernetes.client.CoreV1Api(_api_client)
    return _api_v1_client


def get_co_client():
    """Get the K8s client to interact with the custom objects API."""
    global _k8s_co_client
    if not _k8s_co_client:
        _load_config()
        _k8s_co_client = kubernetes.client.CustomObjectsApi()
    return _k8s_co_client


def annotate_object(group, version, plural, name, namespace, annotations):
    """Annotate a custom Kubernetes object."""
    patch = {"apiVersion": "%s/%s" % (group, version),
             "metadata": {"name": name, "annotations": annotations}}
    k8s_client = get_co_client()
    k8s_client.patch_namespaced_custom_object(group, version, namespace,
                                              plural, name, patch)
