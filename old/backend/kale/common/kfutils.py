# Copyright 2020 The Kale Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging

from typing import Dict, List
from kubernetes.client.models import V1Pod

from kale.common import podutils, k8sutils

log = logging.getLogger(__name__)


def list_poddefaults(namespace: str = None):
    """List PodDefaults in requested namespace.

    If namespace is not provided, list PodDefaults in pod's namespace.
    """
    if not namespace:
        try:
            namespace = podutils.get_namespace()
        except Exception:
            raise ValueError("'namespace' cannot be empty when not inside a"
                             " pod")
    api_group = "kubeflow.org"
    api_version = "v1alpha1"
    co_name = "poddefaults"
    co_client = k8sutils.get_co_client()
    return co_client.list_namespaced_custom_object(api_group, api_version,
                                                   namespace, co_name)["items"]


def find_applied_poddefaults(pod: V1Pod, poddefaults: List[Dict]):
    """Find out which PodDefaults from the list are applied to a pod."""
    applied_poddefaults = list()
    for pd in poddefaults:
        labels_required = pd["spec"]["selector"].get("matchLabels", {})
        for k, v in labels_required.items():
            if pod.metadata.labels.get(k) == v:
                applied_poddefaults.append(pd)
    return applied_poddefaults


def get_poddefault_labels(poddefaults: List[Dict]):
    """Get all labels a pod requires to get a list of PodDefaults applied."""
    labels = dict()
    for pd in poddefaults:
        for k, v in pd["spec"]["selector"].get("matchLabels", {}).items():
            if k in labels and labels[k] != v:
                raise ValueError("Conflicting label: %s. Found 2 PodDefaults"
                                 " using the same label but different values:"
                                 " %s, %s" % (k, labels[k], v))
            labels[k] = v
    return labels


def find_poddefault_labels():
    """Find server's labels that correspond to PodDefaults applied."""
    log.info("Retrieving PodDefaults applied to server...")
    applied_poddefaults = find_applied_poddefaults(
        podutils.get_pod(podutils.get_pod_name(),
                         podutils.get_namespace()),
        list_poddefaults())
    pd_names = [pd["metadata"]["name"] for pd in applied_poddefaults]
    log.info("Retrieved applied PodDefaults: %s", pd_names)

    labels = get_poddefault_labels(applied_poddefaults)
    log.info("PodDefault labels applied on server: %s",
             ", ".join(["%s: %s" % (k, v) for k, v in labels.items()]))
    return labels
