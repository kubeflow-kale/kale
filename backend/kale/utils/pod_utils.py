import os
import re
import logging
import tabulate
import kubernetes.client as k8s
import kubernetes.config as k8s_config

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

logger = logging.getLogger("kubeflow-kale")


def parse_k8s_size(size):
    match = K8S_SIZE_RE.match(size)
    if not match:
        raise ValueError("Could not parse Kubernetes size: {}".format(size))

    count, unit = match.groups()
    return int(count) * K8S_SIZE_UNITS[unit]


def get_namespace():
    with open(NAMESPACE_PATH, "r") as f:
        return f.read()


def get_pod_name():
    pod_name = os.getenv("HOSTNAME")
    if pod_name is None:
        raise RuntimeError("Env variable HOSTNAME not found.")
    return pod_name


def get_container_name():
    container_name = os.getenv("NB_PREFIX")
    if container_name is None:
        raise RuntimeError("Env variable NB_PREFIX not found.")
    return container_name.split('/')[-1]


def _get_k8s_v1_client():
    k8s_config.load_incluster_config()
    api_client = k8s.ApiClient()
    return k8s.CoreV1Api(api_client)


def _get_k8s_custom_objects_client():
    k8s_config.load_incluster_config()
    return k8s.CustomObjectsApi()


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
        volume_size = parse_k8s_size(pvc.spec.resources.requests["storage"])
        rok_volumes.append((mount_path, volume, volume_size))

    return rok_volumes


def list_volumes():
    client = _get_k8s_v1_client()
    namespace = get_namespace()
    pod_name = get_pod_name()
    container_name = get_container_name()
    return _list_volumes(client, namespace, pod_name, container_name)


def get_docker_base_image():
    client = _get_k8s_v1_client()
    namespace = get_namespace()
    pod_name = get_pod_name()
    container_name = get_container_name()

    pod = client.read_namespaced_pod(pod_name, namespace)
    container = _get_pod_container(pod, container_name)
    return container.image


def print_volumes():
    headers = ("Mount Path", "Volume Name", "Volume Size")
    rows = [(path, volume.name, size)
            for path, volume, size in list_volumes()]
    print(tabulate.tabulate(rows, headers=headers))


def create_rok_bucket(bucket, client=None):
    from rok_gw_client.client import RokClient, GatewayClientError
    if client is None:
        client = RokClient()

    # FIXME: Currently the Rok API only supports update-or-create for buckets,
    # so we do a HEAD first to avoid updating an existing bucket. This
    # obviously has a small race, which should be removed by extending the Rok
    # API with an exclusive creation API call.
    try:
        return False, client.bucket_info(bucket)
    except GatewayClientError as e:
        if e.response.status_code != 404:
            raise

        logger.info("Creating bucket: %s", bucket)
        return client.bucket_create(bucket)


def snapshot_pipeline_step(pipeline, step, nb_path):
    from rok_gw_client.client import RokClient

    bucket = "pipelines"
    run_uuid = get_run_uuid()
    obj = f"{pipeline}-{run_uuid}"
    commit_title = f"Step: {step}"
    commit_message = f"Step '{step}' of pipeline run '{run_uuid}'"
    params = {"pod": get_pod_name(),
              "default_container": "main",
              "commit_title": commit_title,
              "commit_message": commit_message}
    rok = RokClient()
    # Create the bucket in case it does not exist
    create_rok_bucket(bucket, client=rok)
    print("Creating snapshot for step '%s'" % step)
    task_info = rok.version_register(bucket, obj, "pod", params, wait=True)
    print("Successfully created snapshot for step '%s'" % step)
    print("You can explore the state of the notebook at the beginning"
          " of this step by spawning a new notebook from the following"
          " Rok snapshot:")

    # FIXME: How do we retrieve the base URL of the ROK UI?
    version = task_info["task"]["result"]["event"]["version"]
    print("\n/rok/buckets/%s/files/%s/versions/%s\n" % (bucket, obj, version))


def get_run_uuid():
    # Retrieve the pod
    pod_name = get_pod_name()
    namespace = get_namespace()
    v1_client = _get_k8s_v1_client()
    pod = v1_client.read_namespaced_pod(pod_name, namespace)

    # Obtain the workflow name
    labels = pod.metadata.labels
    workflow_name = labels.get("workflows.argoproj.io/workflow", None)
    if workflow_name is None:
        msg = (f"Could not retrieve workflow name from pod"
               f"{namespace}/{pod_name}")
        raise RuntimeError(msg)

    # Retrieve the Argo workflow
    api_group = "argoproj.io"
    api_version = "v1alpha1"
    co_name = "workflows"
    co_client = _get_k8s_custom_objects_client()
    workflow = co_client.get_namespaced_custom_object(api_group, api_version,
                                                      namespace, co_name,
                                                      workflow_name)

    # FIXME: Currently workflows are not annotated with the Kubeflow pipeline
    # run UUID, so there is no way to retrieve the run UUID from within a pod.
    # For now we return the workflow UUID instead.
    return workflow["metadata"]["uid"]
