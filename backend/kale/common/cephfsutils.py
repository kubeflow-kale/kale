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
import json
import time
import math
import logging
import kubernetes

from kale.common import podutils
from kale.rpc.errors import (RPCNotFoundError, RPCServiceUnavailableError)
from kale.rpc.log import create_adapter

NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE = """\
This is a snapshot of notebook {} in namespace {}.
This snapshot was created by Kale in order to clone the volumes of the notebook
and use them to spawn a Kubeflow pipeline.\
"""

log = logging.getLogger(__name__)


def snapshot_pvc(snapshot_name, pvc_name):
    """Perform a snapshot over a PVC."""
    snapshot_resource = {
    "apiVersion": "snapshot.storage.k8s.io/v1beta1",
    "kind": "VolumeSnapshot",
    "metadata": {"name": snapshot_name},
    "spec": {
        "volumeSnapshotClassName": "csi-cephfsplugin-snapclass",
        "source": {"persistentVolumeClaimName": pvc_name}
        }
    }
    co_client = podutils._get_k8s_custom_objects_client()
    namespace = podutils.get_namespace()
    log.info("Taking a snapshot of PVC %s in namespace %s ..."
             % (pvc_name, namespace))
    task_info = co_client.create_namespaced_custom_object(
    group="snapshot.storage.k8s.io",
    version="v1beta1",
    namespace=namespace,
    plural="volumesnapshots",
    body=snapshot_resource,
    )

    return task_info


def check_snapshot_status(snapshot_name):
    """Check if volume snapshot is ready to use."""
    log.info("Checking snapshot with snapshot name: %s", snapshot_name)
    task = None
    status = None
    task = get_pvc_snapshot(snapshot_name=snapshot_name)
    status = task['status']['readyToUse']

    if status == True:
        log.info("Successfully created volume snapshot")
    elif status == False:
        raise RuntimeError("Snapshot not ready (status: %s)" % status)
    else:
        raise RuntimeError("Unknown snapshot task status: %s" % status)
    return status


def get_pvc_snapshot(snapshot_name):
    """Get info about a pvc snapshot."""
    co_client = podutils._get_k8s_custom_objects_client()
    namespace = podutils.get_namespace()
    
    pvc_snapshot = co_client.get_namespaced_custom_object(
    group="snapshot.storage.k8s.io",
    version="v1beta1",
    namespace=namespace,
    plural="volumesnapshots",
    name=snapshot_name,
    )
    return pvc_snapshot


def hydrate_pvc_from_snapshot(new_pvc_name, source_snapshot_name):
    """Create a new PVC out of a Rok snapshot."""
    log.info("Creating new PVC '%s' from snapshot %s ..." %
             (new_pvc_name, source_snapshot_name))
    snapshot_info = get_pvc_snapshot(source_snapshot_name)
    size_repr = snapshot_info['status']['restoreSize']
    content_name = snapshot_info['status']['boundVolumeSnapshotContentName']
    log.info("Using snapshot with content: %s" % content_name)

    # todo: kubernetes python client v11 have a
    #  kubernetes.utils.create_from_dict that would make it much more nicer
    #  here. (KFP support kubernetes <= 10)
    pvc = kubernetes.client.V1PersistentVolumeClaim(
        api_version="v1",
        kind="PersistentVolumeClaim",
        metadata=kubernetes.client.V1ObjectMeta(
            name=new_pvc_name
        ),
        spec=kubernetes.client.V1PersistentVolumeClaimSpec(
            data_source=kubernetes.client.V1TypedLocalObjectReference(
                api_group="snapshot.storage.k8s.io",
                kind="VolumeSnapshot",
                name=source_snapshot_name
            ),
            access_modes=["ReadWriteMany"],
            resources=kubernetes.client.V1ResourceRequirements(
                requests={"storage": size_repr}
            )
        )
    )
    k8s_client = podutils._get_k8s_v1_client()
    ns = podutils.get_namespace()
    status = check_snapshot_status(source_snapshot_name)
    if status == True:
        ns_pvc = k8s_client.create_namespaced_persistent_volume_claim(ns, pvc)
    elif status == False:
        raise RuntimeError("Snapshot not ready (status: %s)" % status)
    else:
        raise RuntimeError("Unknown Rok task status: %s" % status)
    return {"name": ns_pvc.metadata.name}


def delete_pvc(name):
    client = podutils._get_k8s_v1_client()
    namespace = podutils.get_namespace()
    client.delete_namespaced_persistent_volume_claim(
    namespace=namespace,
    name=name,)
    return


def delete_pvc_snapshot(name):
    """Delete a pvc snapshot."""
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