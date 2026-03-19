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

from kale.common import k8sutils

NAMESPACE_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"

log = logging.getLogger(__name__)


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


def is_workspace_dir(directory):
    """Check dir path is the container's home folder."""
    return directory == os.getenv("HOME")


def get_pod(name, namespace):
    """Get a pod.

    This function seems redundant but it can save a few repeated lines of code.
    """
    k8s_client = k8sutils.get_v1_client()
    return k8s_client.read_namespaced_pod(name, namespace)
