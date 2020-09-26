#  Copyright 2019-2020 The Kale Authors
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#
#  To allow a notebook to create Rook CephFS snapshot a ClusterRole
#  and RoleBinding for the default-editor service account in the 
#  given namespace must be applied. Below are examples for use with the
#  namespace "admin". 
#
#  !!!WARNING!!!
#  Might not be secure, only use for testing
#
#  apiVersion: rbac.authorization.k8s.io/v1
#  kind: ClusterRole
#  metadata:
#    name: snapshot-access
#  rules:
#    - apiGroups: ["snapshot.storage.k8s.io"]
#      resources: ["volumesnapshots"]
#      verbs: ["create", "get", "list", "watch", "patch", "delete"]
#    - apiGroups: ["snapshot.storage.k8s.io"]
#      resources: ["volumesnapshotcontents"]
#      verbs: ["create", "get", "list", "watch", "update", "delete"]
#    - apiGroups: ["snapshot.storage.k8s.io"]
#      resources: ["volumesnapshotclasses"]
#      verbs: ["get", "list", "watch"]
#    - apiGroups: ["snapshot.storage.k8s.io"]
#      resources: ["volumesnapshotcontents/status"]
#      verbs: ["update"]
#    - apiGroups: ["snapshot.storage.k8s.io"]
#      resources: ["volumesnapshots/status"]
#      verbs: ["update"]
#
#  apiVersion: rbac.authorization.k8s.io/v1
#  kind: RoleBinding
#  metadata:
#    name: allow-snapshot-nb-admin
#    namespace: admin
#  subjects:
#  - kind: ServiceAccount
#    name: default-editor
#    namespace: admin
#  roleRef:
#    kind: ClusterRole
#    name: snapshot-access
#    apiGroup: rbac.authorization.k8s.io

import os
import copy
import logging

from kale.common import podutils
from kale.rpc.errors import (RPCNotFoundError, RPCServiceUnavailableError)
from kale.rpc.log import create_adapter


def snapshot_notebook(name, source):
    """Perform a snapshot over the notebook's pod."""
    snapshot_resource = {
    "apiVersion": "snapshot.storage.k8s.io/v1beta1",
    "kind": "VolumeSnapshot",
    "metadata": {"name": name},
    "spec": {
        "volumeSnapshotClassName": "csi-cephfsplugin-snapclass",
        "source": {"persistentVolumeClaimName": source}
        }
    }
    co_client = podutils._get_k8s_custom_objects_client()
    namespace = podutils.get_namespace()
    
    co_client.create_namespaced_custom_object(
    group="snapshot.storage.k8s.io",
    version="v1beta1",
    namespace=namespace,
    plural="volumesnapshots",
    body=snapshot_resource,
    )
    return


def get_notebook_snapshot(name):
    """Get a notebook snapshot."""
    co_client = podutils._get_k8s_custom_objects_client()
    namespace = podutils.get_namespace()
    
    notebook_snapshot = co_client.get_namespaced_custom_object(
    group="snapshot.storage.k8s.io",
    version="v1beta1",
    namespace=namespace,
    plural="volumesnapshots",
    name=name,
    )
    return notebook_snapshot


def delete_notebook_snapshot(name):
    """Delete a notebook snapshot."""
    co_client = podutils._get_k8s_custom_objects_client()
    namespace = podutils.get_namespace()
    
    co_client.delete_namespaced_custom_object(
    group="snapshot.storage.k8s.io",
    version="v1beta1",
    namespace=namespace,
    plural="volumesnapshots",
    name=name,
    )
    return


def pvc_from_snapshot(name, source):
    """Create a PVC from a notebook snapshot."""
    pvc_resource = {
    "apiVersion": "v1",
    "kind": "PersistentVolumeClaim",
    "metadata": {"name": name},
    "spec": {
        "dataSource": {"name": source, "kind": "VolumeSnapshot", "apiGroup": "snapshot.storage.k8s.io"},
        "accessModes": ["ReadWriteMany"],
        "resources": {
        "requests": {"storage": "10Gi"}
            } 
        }
    }
    client = podutils._get_k8s_v1_client()
    namespace = podutils.get_namespace()
    
    client.create_namespaced_persistent_volume_claim(
    namespace=namespace,
    body=pvc_resource,
    )
    return


def delete_pvc(name):
    client = podutils._get_k8s_v1_client()
    namespace = podutils.get_namespace()
    client.delete_namespaced_persistent_volume_claim(
    namespace=namespace,
    name=name,)
    return