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

import logging
import kubernetes
import time

from kale.common import podutils, k8sutils

NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE = """\
This is a snapshot of notebook {} in namespace {}.
This snapshot was created by Kale in order to clone the volumes of the notebook
and use them to spawn a Kubeflow pipeline.\
"""

log = logging.getLogger(__name__)


def snapshot_pvc(snapshot_name, pvc_name, image="", path="", **kwargs):
    """Perform a snapshot over a PVC."""
    snapshot_resource = {
        "apiVersion": "snapshot.storage.k8s.io/v1beta1",
        "kind": "VolumeSnapshot",
        "metadata": {
            "name": snapshot_name,
            "annotations": {
                "container_image": image,
                "volume_path": path
            },
            "labels": kwargs
        },
        "spec": {
            "volumeSnapshotClassName": "csi-cephfsplugin-snapclass",
            "source": {"persistentVolumeClaimName": pvc_name}
        }
    }
    co_client = k8sutils.get_co_client()
    namespace = podutils.get_namespace()
    log.info("Taking a snapshot of PVC %s in namespace %s ..."
             % (pvc_name, namespace))
    task_info = co_client.create_namespaced_custom_object(
        group="snapshot.storage.k8s.io",
        version="v1beta1",
        namespace=namespace,
        plural="volumesnapshots",
        body=snapshot_resource)

    return task_info


def snapshot_pod():
    """Take snapshots of the current Pod's PVCs."""
    volumes = [(path, volume.name, size)
               for path, volume, size in podutils.list_volumes()]
    namespace = podutils.get_namespace()
    pod_name = podutils.get_pod_name()
    log.info("Taking a snapshot of pod %s in namespace %s ..."
             % (pod_name, namespace))
    snapshot_names = []
    for i in volumes:
        snapshot_pvc(
            "pod-snapshot-" + i[1],
            i[1],
            pod=pod_name,
            default_container=podutils.get_container_name())
        snapshot_names.append("snapshot." + i[1])
    return snapshot_names


def snapshot_notebook():
    """Take snapshots of the current Notebook's PVCs and store its metadata."""
    volumes = [(path, volume.name, size)
               for path, volume, size in podutils.list_volumes()]
    namespace = podutils.get_namespace()
    pod_name = podutils.get_pod_name()
    log.info("Taking a snapshot of notebook %s in namespace %s ..."
             % (pod_name, namespace))
    snapshot_names = []
    for i in volumes:
        snapshot_pvc(
            "nb-snapshot-" + i[1],
            i[1],
            image=podutils.get_docker_base_image(),
            path=i[0],
            pod=pod_name,
            default_container=podutils.get_container_name(),
            is_workspace_dir=str(podutils.is_workspace_dir(i[0])))
        snapshot_names.append("nb-snapshot-" + i[1])
    return snapshot_names


def check_snapshot_status(snapshot_name):
    """Check if volume snapshot is ready to use."""
    log.info("Checking snapshot with snapshot name: %s", snapshot_name)
    count = 0
    max_count = 60
    task = None
    status = None
    while status is not True and count <= max_count:
        count += 1
        try:
            task = get_pvc_snapshot(snapshot_name=snapshot_name)
            status = task['status']['readyToUse']
            log.info(task)
            log.info(status)
            time.sleep(2)
        except KeyError:
            log.info("Snapshot resource %s does not seem to be ready", snapshot_name)
            time.sleep(2)
    if status is True:
        log.info("Successfully created volume snapshot")
    elif status is False:
        raise log.info("Snapshot not ready (status: %s)" % status)
    else:
        raise log.info("Unknown snapshot task status: %s" % status)
    return task


def get_pvc_snapshot(snapshot_name):
    """Get info about a pvc snapshot."""
    co_client = k8sutils.get_co_client()
    namespace = podutils.get_namespace()

    pvc_snapshot = co_client.get_namespaced_custom_object(
        group="snapshot.storage.k8s.io",
        version="v1beta1",
        namespace=namespace,
        plural="volumesnapshots",
        name=snapshot_name)
    return pvc_snapshot


def list_pvc_snapshots(label_selector=""):
    """List pvc snapshots."""
    co_client = k8sutils.get_co_client()
    namespace = podutils.get_namespace()

    pvc_snapshots = co_client.list_namespaced_custom_object(
        group="snapshot.storage.k8s.io",
        version="v1beta1",
        namespace=namespace,
        plural="volumesnapshots",
        label_selector=label_selector)
    return pvc_snapshots


def hydrate_pvc_from_snapshot(new_pvc_name, source_snapshot_name):
    """Create a new PVC out of a volume snapshot."""
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
            annotations={"snapshot_origin": content_name},
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
    k8s_client = k8sutils.get_v1_client()
    ns = podutils.get_namespace()
    status = check_snapshot_status(source_snapshot_name)['status']['readyToUse']
    if status is True:
        ns_pvc = k8s_client.create_namespaced_persistent_volume_claim(ns, pvc)
    elif status is False:
        raise RuntimeError("Snapshot not ready (status: %s)" % status)
    else:
        raise RuntimeError("Unknown Rok task status: %s" % status)
    return {"name": ns_pvc.metadata.name}


def get_nb_name_from_snapshot(snapshot_name):
    """Get the name of the notebook that the snapshot was taken from."""
    snapshot = get_pvc_snapshot(snapshot_name=snapshot_name)
    orig_notebook = snapshot["metadata"]["labels"]["default_container"]
    return orig_notebook


def get_nb_image_from_snapshot(snapshot_name):
    """Get the image of the notebook that the snapshot was taken from."""
    snapshot = get_pvc_snapshot(snapshot_name=snapshot_name)
    image = snapshot["metadata"]["annotations"]["container_image"]
    return image


def get_nb_pvcs_from_snapshot(snapshot_name):
    """Get all the PVCs that were mounted to the NB when the snapshot was taken.

    Returns JSON list.
    """
    selector = "default_container=" + get_nb_name_from_snapshot(snapshot_name)
    all_volumes = list_pvc_snapshots(label_selector=selector)["items"]
    volumes = []
    for i in all_volumes:
        snapshot_name = i["metadata"]["name"]
        source_pvc_name = i["spec"]["source"]["persistentVolumeClaimName"]
        path = i["metadata"]["annotations"]["volume_path"]
        row = {
            "mountPath": path,
            "snapshot_name": snapshot_name,
            "source_pvc": source_pvc_name}
        volumes.append(row)
    return volumes


def restore_pvcs_from_snapshot(snapshot_name):
    """Restore the NB PVCs from their snapshots."""
    source_snapshots = get_nb_pvcs_from_snapshot(snapshot_name)
    replaced_volume_mounts = []
    for i in source_snapshots:
        new_pvc_name = "restored-" + i["source_pvc"]
        pvc_name = hydrate_pvc_from_snapshot(new_pvc_name, i["snapshot_name"])
        path = i["mountPath"]
        row = {"mountPath": path, "name": pvc_name["name"]}
        replaced_volume_mounts.append(row)
    return replaced_volume_mounts


def replace_cloned_volumes(volume_mounts):
    """Replace the volumes with the volumes restored from the snapshot."""
    replaced_volumes = []
    for i in volume_mounts:
        name = i["name"]
        row = {"name": name, "persistentVolumeClaim": {"claimName": name}}
        replaced_volumes.append(row)
    return replaced_volumes


def restore_notebook(snapshot_name):
    """Restore a notebook from a PVC snapshot."""
    name = "restored-" + get_nb_name_from_snapshot(snapshot_name)
    namespace = podutils.get_namespace()
    image = get_nb_image_from_snapshot(snapshot_name)
    volume_mounts = restore_pvcs_from_snapshot(snapshot_name)
    volumes = replace_cloned_volumes(volume_mounts)
    notebook_resource = {
        "apiVersion": "kubeflow.org/v1alpha1",
        "kind": "Notebook",
        "metadata": {
            "labels": {
                "app": name
            },
            "name": name,
            "namespace": namespace},
        "spec": {
            "template": {
                "spec": {
                    "containers": [
                        {
                            "env": [],
                            "image": image,
                            "name": name,
                            "resources": {
                                "requests": {
                                    "cpu": "0.5",
                                    "memory": "1.0Gi"}},
                                "volumeMounts": volume_mounts}],
                            "serviceAccountName": "default-editor",
                            "ttlSecondsAfterFinished": 300,
                            "volumes": volumes}}}}
    co_client = k8sutils.get_co_client()
    log.info("Restoring notebook %s from PVC snapshot %s in namespace %s ..."
             % (name, snapshot_name, namespace))
    task_info = co_client.create_namespaced_custom_object(
        group="kubeflow.org",
        version="v1alpha1",
        namespace=namespace,
        plural="notebooks",
        body=notebook_resource)

    return task_info


def delete_pvc(pvc_name):
    """Delete a pvc."""
    client = k8sutils.get_v1_client()
    namespace = podutils.get_namespace()
    client.delete_namespaced_persistent_volume_claim(
        namespace=namespace,
        name=pvc_name)
    return


def delete_pvc_snapshot(snapshot_name):
    """Delete a pvc snapshot."""
    co_client = podutils._get_k8s_custom_objects_client()
    namespace = podutils.get_namespace()

    co_client.delete_namespaced_custom_object(
        group="snapshot.storage.k8s.io",
        version="v1beta1",
        namespace=namespace,
        plural="volumesnapshots",
        name=snapshot_name)
    return
