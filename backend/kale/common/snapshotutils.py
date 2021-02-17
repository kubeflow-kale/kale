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
