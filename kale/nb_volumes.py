#!/usr/bin/env python3

import os
import sys
import logging
import tabulate
import kubernetes.client as k8s
import kubernetes.config as k8s_config

ROK_CSI_STORAGE_CLASS = "rok"
ROK_CSI_STORAGE_PROVISIONER = "rok.arrikto.com"

POD_NAME = os.getenv("HOSTNAME")
CONTAINER_NAME = os.getenv("NB_PREFIX").split("/")[-1]
NAMESPACE_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"

log = logging.getLogger(__name__)


def get_namespace():
    try:
        with open(NAMESPACE_PATH, "r") as f:
            return f.read()
    except FileNotFoundError:
        return None


def _get_k8s_client():
    try:
        k8s_config.load_incluster_config()
    except k8s_config.ConfigException:
        return None

    api_client = k8s.ApiClient()
    return k8s.CoreV1Api(api_client)


def _get_pod_container(pod, container_name):
    container = list(filter(lambda c: c.name == container_name, pod.spec.containers))
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

    rok_volumes = {}
    for volume in pod.spec.volumes:
        pvc = volume.persistent_volume_claim
        if not pvc:
            continue

        # Ensure the volume is a Rok volume, otherwise we will not be able to
        # snapshot it.
        # FIXME: Should we just ignore these volumes? Ignoring them would
        # result in an incomplete notebook snapshot.
        pvc = client.read_namespaced_persistent_volume_claim(pvc.claim_name,
                                                             namespace)
        if pvc.spec.storage_class_name != ROK_CSI_STORAGE_CLASS:
            msg = ("Found PVC with storage class '%s'. Only storage class '%s'"
                   " is supported."
                   % (pvc.spec.storage_class_name, ROK_CSI_STORAGE_CLASS))
            raise RuntimeError(msg)

        ann = pvc.metadata.annotations
        provisioner = ann.get("volume.beta.kubernetes.io/storage-provisioner", None)
        if provisioner != ROK_CSI_STORAGE_PROVISIONER:
            msg = ("Found PVC storage provisioner '%s'. Only storage"
                   " provisioner '%s' is supported."
                   % (provisioner, ROK_CSI_STORAGE_PROVISIONER))
            raise RuntimeError(msg)

        mount_path = _get_mount_path(container, volume)
        volume_size = pvc.spec.resources.requests["storage"]
        rok_volumes[mount_path] = (volume, volume_size)

    return rok_volumes


def list_volumes():
    namespace = get_namespace()
    if namespace is None:
        log.warning("Could not retrieve the kubernetes namespace")
        return {}

    client = _get_k8s_client()
    if client is None:
        log.warning("Could not initialize the kubernetes client")
        return {}

    return _list_volumes(client, namespace, POD_NAME, CONTAINER_NAME)


def main():
    logging.basicConfig(level=logging.INFO)
    volumes = list_volumes()
    headers = ("Mount Path", "Volume Name", "Volume Size")
    rows = [(path, volume.name, size)
             for path, (volume, size) in volumes.items()]
    print(tabulate.tabulate(rows, headers=headers))


if __name__ == "__main__":
    sys.exit(main())
