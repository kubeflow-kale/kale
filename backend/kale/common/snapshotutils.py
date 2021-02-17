# Copyright 2020 The Kale Authors
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

import logging
import random
import string
import time

from kale.common import podutils, k8sutils

NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE = """\
This is a snapshot of notebook {} in namespace {}.
This snapshot was created by Kale in order to clone the volumes of the notebook
and use them to spawn a Kubeflow pipeline.\
"""

log = logging.getLogger(__name__)


def snapshot_pvc(snapshot_name, pvc_name, labels, annotations):
    """Perform a snapshot over a PVC."""
    if annotations == {}:
        annotations = {"access_mode": get_pvc_access_mode(pvc_name)}
    snapshot_resource = {
        "apiVersion": "snapshot.storage.k8s.io/v1beta1",
        "kind": "VolumeSnapshot",
        "metadata": {
            "name": snapshot_name,
            "annotations": annotations,
            "labels": labels
        },
        "spec": {
            "volumeSnapshotClassName": get_snapshotclass_name(pvc_name),
            "source": {"persistentVolumeClaimName": pvc_name}
        }
    }
    co_client = k8sutils.get_co_client()
    namespace = podutils.get_namespace()
    log.info("Taking a snapshot of PVC %s in namespace %s ...",
             (pvc_name, namespace))
    task_info = co_client.create_namespaced_custom_object(
        group="snapshot.storage.k8s.io",
        version="v1beta1",
        namespace=namespace,
        plural="volumesnapshots",
        body=snapshot_resource)

    return task_info


def get_snapshotclass_name(pvc_name, label_selector=""):
    """Get the Volume Snapshot Class Name for a PVC."""
    client = k8sutils.get_v1_client()
    namespace = podutils.get_namespace()
    pvc = client.read_namespaced_persistent_volume_claim(pvc_name, namespace)
    ann = pvc.metadata.annotations
    provisioner = ann.get("volume.beta.kubernetes.io/storage-provisioner",
                          None)
    snapshotclasses = podutils.get_snapshotclasses(label_selector)
    return [snapclass_name["metadata"]["name"] for snapclass_name in
            snapshotclasses if snapclass_name["driver"] == provisioner][0]


def get_pvc_access_mode(pvc_name):
    """Get the access mode of a PVC."""
    client = k8sutils.get_v1_client()
    namespace = podutils.get_namespace()
    pvc = client.read_namespaced_persistent_volume_claim(pvc_name, namespace)
    return pvc.spec.access_modes[0]


def generate_uuid():
    """Generate a 8 character UUID for snapshot names and versioning."""
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(random.choices(alphabet, k=8))


def snapshot_pod():
    """Take snapshots of the current Pod's PVCs."""
    volumes = [(path, volume.name, size)
               for path, volume, size in podutils.list_volumes()]
    namespace = podutils.get_namespace()
    pod_name = podutils.get_pod_name()
    log.info("Taking a snapshot of pod %s in namespace %s ...",
             (pod_name, namespace))
    version_uuid = generate_uuid()
    snapshot_names = []
    for vol in volumes:
        snapshot_name = "pod-snapshot-" + version_uuid + "-" + vol[1]
        snapshot_pvc(
            snapshot_name=snapshot_name,
            pvc_name=vol[1],
            labels={"container_name": podutils.get_container_name(),
                    "version_uuid": version_uuid, "pod": pod_name},
            annotations={"access_mode": get_pvc_access_mode(vol[1])}
        )
        snapshot_names.append(snapshot_name)
    return snapshot_names


def snapshot_notebook():
    """Take snapshots of the current Notebook's PVCs and store its metadata."""
    volumes = [(path, volume.name, size)
               for path, volume, size in podutils.list_volumes()]
    namespace = podutils.get_namespace()
    pod_name = podutils.get_pod_name()
    resources = get_notebook_resources()
    log.info("Taking a snapshot of notebook %s in namespace %s ...",
             (pod_name, namespace))
    version_uuid = generate_uuid()
    snapshot_names = []
    for vol in volumes:
        annotations = {}
        if resources:
            for key in resources:
                annotations[key] = resources[key]
        annotations["access_mode"] = get_pvc_access_mode(vol[1])
        annotations["container_image"] = podutils.get_docker_base_image()
        annotations["volume_path"] = vol[0]
        snapshot_name = "nb-snapshot-" + version_uuid + "-" + vol[1]
        snapshot_pvc(
            snapshot_name=snapshot_name,
            pvc_name=vol[1],
            annotations=annotations,
            labels={"container_name": podutils.get_container_name(),
                    "version_uuid": version_uuid,
                    "is_workspace_dir": str(podutils.is_workspace_dir(vol[0]))}
        )
        snapshot_names.append(snapshot_name)
    return snapshot_names


def get_notebook_resources():
    """Get the resource limits and requests of the current Notebook."""
    nb_name = podutils.get_container_name()
    namespace = podutils.get_namespace()
    co_client = k8sutils.get_co_client()
    get_resource = co_client.get_namespaced_custom_object(
        name=nb_name,
        group="kubeflow.org",
        version="v1alpha1",
        namespace=namespace,
        plural="notebooks")["spec"]["template"]["spec"]["containers"][0]
    resource_spec = get_resource["resources"]
    resource_conf = {}
    for resource_type in resource_spec.items():
        for key in resource_type[1]:
            resource_conf[resource_type[0] + "_" + key] = resource_type[1][key]
    return resource_conf


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
            log.info("Snapshot resource %s does not seem to be ready",
                     snapshot_name)
            time.sleep(2)
    if status is True:
        log.info("Successfully created volume snapshot")
    elif status is False:
        raise log.info("Snapshot not ready (status: %s)", status)
    else:
        raise log.info("Unknown snapshot task status: %s", status)
    return task
