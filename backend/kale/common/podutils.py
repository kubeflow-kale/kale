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

"""Suite of random helpers regarding pod manipulation."""

import os
import re
import json
import hashlib
import logging
import tabulate

from kale.common import workflowutils, k8sutils

ROK_CSI_STORAGE_CLASS = "rok"
ROK_CSI_STORAGE_PROVISIONER = "rok.arrikto.com"

NAMESPACE_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"

K8S_SIZE_RE = re.compile(r'^([0-9]+)(E|Ei|P|Pi|T|Ti|G|Gi|M|Mi|K|Ki){0,1}$')
K8S_SIZE_UNITS = {"E": 10 ** 18,
                  "P": 10 ** 15,
                  "T": 10 ** 12,
                  "G": 10 ** 9,
                  "M": 10 ** 6,
                  "K": 10 ** 3,
                  "Ei": 2 ** 60,
                  "Pi": 2 ** 50,
                  "Ti": 2 ** 40,
                  "Gi": 2 ** 30,
                  "Mi": 2 ** 20,
                  "Ki": 2 ** 10}

KFP_RUN_ID_LABEL_KEY = "pipeline/runid"
KFP_COMPONENT_SPEC_ANNOTATION_KEY = "pipelines.kubeflow.org/component_spec"

log = logging.getLogger(__name__)


def parse_k8s_size(size):
    """Parse a string with K8s size and return its integer equivalent."""
    match = K8S_SIZE_RE.match(size)
    if not match:
        raise ValueError("Could not parse Kubernetes size: {}".format(size))

    count, unit = match.groups()
    return int(count) * K8S_SIZE_UNITS[unit]


def get_namespace():
    """Get the current namespace."""
    with open(NAMESPACE_PATH, "r") as f:
        return f.read()


def get_pod_name():
    """Get the current pod name."""
    pod_name = os.getenv("HOSTNAME")
    if pod_name is None:
        raise RuntimeError("Env variable HOSTNAME not found.")
    return pod_name


def get_container_name():
    """Get the current container name.

    When Kale is running inside a pod spawned by Kubeflow's JWA, we can rely
    on the NB_PREFIX env variable. If this is not the case, we need to
    apply some heuristics to try determining the container name.
    """
    log.info("Getting the current container name...")
    nb_prefix = os.getenv("NB_PREFIX")
    if nb_prefix:
        container_name = nb_prefix.split('/')[-1]
        if container_name:
            log.info("Using NB_PREFIX env var '%s'. Container name: '%s'" %
                     (nb_prefix, container_name))
            return container_name
        log.info("Could not parse NB_PREFIX: '%s'. Falling back to using some"
                 " heuristics." % nb_prefix)
    else:
        log.info("Env variable NB_PREFIX not found. Falling back to finding"
                 " the container name with some heuristics.")

    # get the pod object and inspect the containers in the spec
    pod = get_pod(get_pod_name(), get_namespace())
    container_names = [c.name for c in pod.spec.containers]
    if len(container_names) == 1:
        log.info("Found one container in the Pod: '%s'" % container_names[0])
        return container_names[0]
    log.info("Found multiple containers in the Pod: %s" % container_names)

    # fixme: Kubernetes 1.19 should support sidecar containers as first class
    #  citizens. Maybe at that point there will be a simple way to detect
    #  sidecars in the pod spec.

    if "main" in container_names:
        log.info("Choosing 'main'")
        return "main"
    # remove some container names that are supposed to be sidecars
    potentially_sidecar_names = ["proxy", "sidecar", "wait"]
    candidates = [c for c in container_names
                  if all([x not in c for x in potentially_sidecar_names])]
    if len(candidates) > 1:
        raise RuntimeError("Too many container candidates.Cannot infer the"
                           " name of the current container from: %s "
                           % candidates)
    if len(candidates) > 0:
        raise RuntimeError("No container names left. Could not infer the name"
                           " of the running container.")
    log.info("Choosing '%s'" % candidates[0])
    return candidates[0]


def _get_pod_container(pod, container_name):
    container = list(
        filter(lambda c: c.name == container_name, pod.spec.containers))
    assert len(container) <= 1
    if not container:
        raise RuntimeError("Could not find container '%s' in pod '%s'"
                           % (container_name, pod.metadata.name))
    return container[0]


def _get_mount_path(container, volume):
    for volume_mount in container.volume_mounts:
        if volume_mount.name == volume.name:
            return volume_mount.mount_path

    raise RuntimeError("Could not find volume %s in container %s"
                       % (volume.name, container.name))


def _list_volumes(client, namespace, pod_name, container_name):
    pod = client.read_namespaced_pod(pod_name, namespace)
    container = _get_pod_container(pod, container_name)

    rok_volumes = []
    for volume in pod.spec.volumes:
        pvc = volume.persistent_volume_claim
        if not pvc:
            continue

        # Ensure the volume is a Rok volume, otherwise we will not be able to
        # snapshot it.
        # FIXME: Should we just ignore these volumes? Ignoring them would
        #  result in an incomplete notebook snapshot.
        pvc = client.read_namespaced_persistent_volume_claim(pvc.claim_name,
                                                             namespace)
        if (pvc.spec.storage_class_name != ROK_CSI_STORAGE_CLASS
           and pvc.spec.storage_class_name not in
                get_snapshotclass_provisioners_names()):
            msg = ("Found PVC with storage class '%s'. "
                   "Only storage classes able to take snapshots and "
                   "'%s' are supported."
                   % (pvc.spec.storage_class_name,
                      ROK_CSI_STORAGE_CLASS))
            raise RuntimeError(msg)

        ann = pvc.metadata.annotations
        provisioner = ann.get("volume.beta.kubernetes.io/storage-provisioner",
                              None)
        if (provisioner != ROK_CSI_STORAGE_PROVISIONER
           and provisioner not in list_snapshotclass_storage_provisioners()):
            msg = ("Found PVC storage provisioner '%s'. "
                   "Only storage provisioners able to take snapshots and "
                   "'%s' are supported."
                   % (provisioner, ROK_CSI_STORAGE_PROVISIONER))
            raise RuntimeError(msg)

        mount_path = _get_mount_path(container, volume)
        volume_size = parse_k8s_size(pvc.spec.resources.requests["storage"])
        rok_volumes.append((mount_path, volume, volume_size))

    return rok_volumes


def get_volume_containing_path(path):
    """Get the closest volume mount point to the input absolute path.

    Returns a tuple in the following format: (mount_path, volume, size)
    """
    if not os.path.isabs(path):
        raise ValueError("Path '%s' is not an absolute path" % path)
    if not os.path.exists(path):
        raise ValueError("Path '%s' does not exist" % path)

    mounted_vols = list_volumes()
    mount_point = 0
    # get the volumes that contain the input path
    vols = list(filter(lambda x: path.startswith(x[mount_point]),
                       mounted_vols))
    if len(vols) > 0:
        # get vol with longest mount point (i.e. closest to input path)
        return sorted(vols, key=lambda k: len(k[mount_point]), reverse=True)[0]
    else:
        raise RuntimeError("Input path is not under any volume mount point")


def list_volumes():
    """List the currently mounted volumes."""
    client = k8sutils.get_v1_client()
    namespace = get_namespace()
    pod_name = get_pod_name()
    container_name = get_container_name()
    return _list_volumes(client, namespace, pod_name, container_name)


def get_docker_base_image():
    """Get the current container's docker image.

    Raises:
        ConfigException when initializing the client
        FileNotFoundError when attempting to find the namespace
        ApiException when getting the container name or reading the pod
    """
    client = k8sutils.get_v1_client()
    namespace = get_namespace()
    pod_name = get_pod_name()
    container_name = get_container_name()

    pod = client.read_namespaced_pod(pod_name, namespace)
    container = _get_pod_container(pod, container_name)
    return container.image


def print_volumes():
    """Print the current volumes."""
    headers = ("Mount Path", "Volume Name", "Volume Size")
    rows = [(path, volume.name, size)
            for path, volume, size in list_volumes()]
    print(tabulate.tabulate(rows, headers=headers))


def get_run_uuid():
    """Get the Workflow's UUID form inside a pipeline step."""
    # Retrieve the pod
    pod_name = get_pod_name()
    namespace = get_namespace()
    workflow_name = workflowutils.get_workflow_name(pod_name, namespace)

    # Retrieve the Argo workflow
    api_group = "argoproj.io"
    api_version = "v1alpha1"
    co_name = "workflows"
    co_client = k8sutils.get_co_client()
    workflow = co_client.get_namespaced_custom_object(api_group, api_version,
                                                      namespace, co_name,
                                                      workflow_name)
    run_uuid = workflow["metadata"].get("labels", {}).get(KFP_RUN_ID_LABEL_KEY,
                                                          None)

    # KFP api-server adds run UUID as label to workflows for KFP>=0.1.26.
    # Return run UUID if available. Else return workflow UUID to maintain
    # backwards compatibility.
    return run_uuid or workflow["metadata"]["uid"]


def is_workspace_dir(directory):
    """Check dir path is the container's home folder."""
    return directory == os.getenv("HOME")


def patch_pod(name, namespace, patch):
    """Patch a pod."""
    k8s_client = k8sutils.get_v1_client()
    k8s_client.patch_namespaced_pod(name=name, namespace=namespace, body=patch)


def get_pod(name, namespace):
    """Get a pod.

    This function seems redundant but it can save a few repeated lines of code.
    """
    k8s_client = k8sutils.get_v1_client()
    return k8s_client.read_namespaced_pod(name, namespace)


def compute_component_id(pod):
    """Compute unique component ID.

    Kale steps are KFP SDK Components. This is the way MetadataWriter generates
    unique names for such components.
    """
    log.info("Computing component ID for pod %s/%s...", pod.metadata.namespace,
             pod.metadata.name)
    component_spec_text = pod.metadata.annotations.get(
        KFP_COMPONENT_SPEC_ANNOTATION_KEY)
    if not component_spec_text:
        raise ValueError("KFP component spec annotation not found in pod")
    component_spec = json.loads(component_spec_text)
    component_spec_digest = hashlib.sha256(
        component_spec_text.encode()).hexdigest()
    component_name = component_spec.get("name")
    component_id = component_name + "@sha256=" + component_spec_digest
    log.info("Computed component ID: %s", component_id)
    return component_id


def get_snapshotclasses(label_selector=""):
    """List snapshotclasses."""
    co_client = k8sutils.get_co_client()

    snapshotclasses = co_client.list_cluster_custom_object(
        group="snapshot.storage.k8s.io",
        version="v1beta1",
        plural="volumesnapshotclasses",
        label_selector=label_selector)
    return snapshotclasses


def list_snapshotclass_storage_provisioners(label_selector=""):
    """List the storage provisioners of the snapshotclasses."""
    snapshotclasses = get_snapshotclasses(label_selector)["items"]
    return [snap_prov["dirver"] for snap_prov in snapshotclasses]


def check_snapshot_availability():
    """Check if snapshotclasses are available for notebook."""
    client = k8sutils.get_v1_client()
    namespace = get_namespace()
    pod_name = get_pod_name()
    pod = client.read_namespaced_pod(pod_name, namespace)
    snapshotclass_provisioners = list_snapshotclass_storage_provisioners()

    for volume in pod.spec.volumes:
        pvc = volume.persistent_volume_claim
        if not pvc:
            continue
        pvc_name = client.read_namespaced_persistent_volume_claim(
            pvc.claim_name, namespace)

        ann = pvc_name.metadata.annotations
        provisioner = ann.get("volume.beta.kubernetes.io/storage-provisioner")
        if provisioner not in snapshotclass_provisioners:
            msg = ("Found PVC storage provisioner '%s'. "
                   "Only storage provisioners able to take snapshots "
                   "are supported."
                   % (provisioner))
            raise RuntimeError(msg)


def get_snapshotclass_provisioners_names():
    """Get the names of snapshotclass storage provisioners."""
    client = k8sutils.get_storage_client()
    classes = client.list_storage_class().items
    snapshotclass_provisioners = list_snapshotclass_storage_provisioners()
    return [stor_class.metadata.name for stor_class in classes
            if stor_class.provisioner in snapshotclass_provisioners]
