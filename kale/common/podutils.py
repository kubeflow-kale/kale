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

from functools import cache
import logging
import os
import re

import tabulate

from kale.common import k8sutils

NAMESPACE_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"

K8S_SIZE_RE = re.compile(r"^([0-9]+)(E|Ei|P|Pi|T|Ti|G|Gi|M|Mi|K|Ki){0,1}$")
K8S_SIZE_UNITS = {
    "E": 10**18,
    "P": 10**15,
    "T": 10**12,
    "G": 10**9,
    "M": 10**6,
    "K": 10**3,
    "Ei": 2**60,
    "Pi": 2**50,
    "Ti": 2**40,
    "Gi": 2**30,
    "Mi": 2**20,
    "Ki": 2**10,
    "": 2**0,
}

log = logging.getLogger(__name__)


def parse_k8s_size(size):
    """Parse a string with K8s size and return its integer equivalent."""
    match = K8S_SIZE_RE.match(size)
    if not match:
        raise ValueError(f"Could not parse Kubernetes size: {size}")

    count, unit = match.groups()
    # FIXME: This function returns an integer. In the labextension, when using
    #  the `list_volumes` RPC, `getMountedVolumes` converts this integer back
    #  to a string with units.
    #  Consider returning size and size_type from the beginning.
    return int(count) * K8S_SIZE_UNITS[unit or ""]


def get_namespace():
    """Get the current namespace."""
    with open(NAMESPACE_PATH) as f:
        return f.read()


def get_pod_name():
    """Get the current pod name."""
    pod_name = os.getenv("HOSTNAME")
    if pod_name is None:
        raise RuntimeError("Env variable HOSTNAME not found.")
    return pod_name


@cache
def get_container_name():
    """Get the current container name.

    When Kale is running inside a pod spawned by Kubeflow's JWA, we can rely
    on the NB_PREFIX env variable. If this is not the case, we need to
    apply some heuristics to try determining the container name.
    """
    log.info("Getting the current container name...")
    nb_prefix = os.getenv("NB_PREFIX")
    if nb_prefix:
        container_name = nb_prefix.split("/")[-1]
        if container_name:
            log.info(f"Using NB_PREFIX env var '{nb_prefix}'. Container name: '{container_name}'")
            return container_name
        log.info(
            f"Could not parse NB_PREFIX: '{nb_prefix}'. Falling back to using some heuristics."
        )
    else:
        log.info(
            "Env variable NB_PREFIX not found. Falling back to finding"
            " the container name with some heuristics."
        )

    # get the pod object and inspect the containers in the spec
    pod = get_pod(get_pod_name(), get_namespace())
    container_names = [c.name for c in pod.spec.containers]
    if len(container_names) == 1:
        log.info(f"Found one container in the Pod: '{container_names[0]}'")
        return container_names[0]
    log.info(f"Found multiple containers in the Pod: {container_names}")

    # fixme: Kubernetes 1.19 should support sidecar containers as first class
    #  citizens. Maybe at that point there will be a simple way to detect
    #  sidecars in the pod spec.

    if "main" in container_names:
        log.info("Choosing 'main'")
        return "main"
    # remove some container names that are supposed to be sidecars
    potentially_sidecar_names = ["proxy", "sidecar", "wait"]
    candidates = [c for c in container_names if all(x not in c for x in potentially_sidecar_names)]
    if len(candidates) > 1:
        raise RuntimeError(
            "Too many container candidates.Cannot infer the"
            f" name of the current container from: {candidates} "
        )
    if len(candidates) > 0:
        raise RuntimeError(
            "No container names left. Could not infer the name of the running container."
        )
    log.info(f"Choosing '{candidates[0]}'")
    return candidates[0]


def _get_pod_container(pod, container_name):
    container = list(filter(lambda c: c.name == container_name, pod.spec.containers))
    assert len(container) <= 1
    if not container:
        raise RuntimeError(
            f"Could not find container '{container_name}' in pod '{pod.metadata.name}'"
        )
    return container[0]


def _get_container_image_sha(pod, container_name):
    if not pod.status.container_statuses:
        raise RuntimeError(
            f"Could not retrieve the `container_statuses` field from Pod '{pod.metadata.name}'"
        )
    status = list(filter(lambda s: s.name == container_name, pod.status.container_statuses))[0]
    if not status.image_id:
        raise RuntimeError(
            f"Container status for container '{container_name}' in pod '{pod.metadata.name}' is"
            " not set"
        )
    _prefix = "docker-pullable://"
    if not status.image_id.startswith(_prefix):
        raise RuntimeError(
            f"Could not parse imageID of container '{container_name}' in pod"
            f" '{pod.metadata.name}': '{status.image_id}'"
        )
    return status.image_id[len(_prefix) :]


def _get_mount_path(container, volume):
    for volume_mount in container.volume_mounts:
        if volume_mount.name == volume.name:
            return volume_mount.mount_path

    raise RuntimeError(f"Could not find volume {volume.name} in container {container.name}")


def _list_volumes(client, namespace, pod_name, container_name):
    pod = client.read_namespaced_pod(pod_name, namespace)
    container = _get_pod_container(pod, container_name)

    volumes = []
    for volume in pod.spec.volumes:
        pvc_spec = volume.persistent_volume_claim
        if not pvc_spec:
            continue

        pvc = client.read_namespaced_persistent_volume_claim(pvc_spec.claim_name, namespace)
        mount_path = _get_mount_path(container, volume)
        volume_size = parse_k8s_size(pvc.spec.resources.requests["storage"])
        volumes.append((mount_path, volume, volume_size))

    return volumes


def get_volume_containing_path(path):
    """Get the closest volume mount point to the input absolute path.

    Returns a tuple in the following format: (mount_path, volume, size)
    """
    if not os.path.isabs(path):
        raise ValueError(f"Path '{path}' is not an absolute path")
    if not os.path.exists(path):
        raise ValueError(f"Path '{path}' does not exist")

    mounted_vols = list_volumes()
    mount_point = 0
    # get the volumes that contain the input path
    vols = list(filter(lambda x: path.startswith(x[mount_point]), mounted_vols))
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

    Just reading the Pod spec's container image is not enough to have a
    reproducible reference to the current image, because an image tag can be
    re-assigned to newer builds, in the future (e.g. when using the `latest`
    tag). The only way to have reproducible reference is by using the
    image manifest's `sha`.

    Kubernetes exposes this in the Pod's `status`, under `containerStatuses`
    [1], in the field `imageID`. In the case this field is empty (this could
    happen when the image was built locally), then fallback to reading the
    Pod's container `image` field.

    [1] https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.20/#containerstatus-v1-core  # noqa: 501

    Raises:
        ConfigException when initializing the client
        FileNotFoundError when attempting to find the namespace
        ApiException when getting the container name or reading the pod
    """
    log.info("Getting the base image of container...")
    client = k8sutils.get_v1_client()
    pod = client.read_namespaced_pod(get_pod_name(), get_namespace())
    container_name = get_container_name()

    image = None
    try:
        image = _get_container_image_sha(pod, container_name)
    except RuntimeError as e:
        log.warning("Could not retrieve the container image sha: %s", str(e))
        log.warning(
            "Using its tag instead. The pipeline won't be reproducible"
            " if a new image is pushed with the same tag."
        )
        image = _get_pod_container(pod, container_name).image
    log.info("Retrieved image: %s", image)
    return image


def print_volumes():
    """Print the current volumes."""
    headers = ("Mount Path", "Volume Name", "Volume Size")
    rows = [(path, volume.name, size) for path, volume, size in list_volumes()]
    print(tabulate.tabulate(rows, headers=headers))


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
