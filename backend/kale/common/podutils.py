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

import os
import re
import json
import hashlib
import logging
import tabulate
import kubernetes.client as k8s
import kubernetes.config as k8s_config

from kale.common.utils import encode_url_component
from kale.common import kfputils

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
    """Get the current container name."""
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
        if pvc.spec.storage_class_name != ROK_CSI_STORAGE_CLASS:
            msg = ("Found PVC with storage class '%s'. Only storage class '%s'"
                   " is supported."
                   % (pvc.spec.storage_class_name, ROK_CSI_STORAGE_CLASS))
            raise RuntimeError(msg)

        ann = pvc.metadata.annotations
        provisioner = ann.get("volume.beta.kubernetes.io/storage-provisioner",
                              None)
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
    """List the currently mounted volumes."""
    client = _get_k8s_v1_client()
    namespace = get_namespace()
    pod_name = get_pod_name()
    container_name = get_container_name()
    return _list_volumes(client, namespace, pod_name, container_name)


def get_docker_base_image():
    """Get the current container's docker image."""
    client = _get_k8s_v1_client()
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


def create_rok_bucket(bucket, client=None):
    """Create a new Rok bucket."""
    log.info("Creating Rok bucket '%s'...", bucket)
    from rok_gw_client.client import RokClient, GatewayClientError
    if client is None:
        client = RokClient()

    # FIXME: Currently the Rok API only supports update-or-create for buckets,
    # so we do a HEAD first to avoid updating an existing bucket. This
    # obviously has a small race, which should be removed by extending the Rok
    # API with an exclusive creation API call.
    try:
        bucket_info = client.bucket_info(bucket)
        log.info("Rok bucket '%s' already exists", bucket)
        return False, bucket_info
    except GatewayClientError as e:
        if e.response.status_code != 404:
            raise

        created, bucket_info = client.bucket_create(bucket)
        log.info("Successfully created Rok bucket '%s'", bucket)
        return created, bucket_info


def snapshot_pipeline_step(pipeline, step, nb_path, before=True):
    """Take a snapshot of a pipeline step with Rok."""
    # Mark the start of the snapshotting procedure
    log.info("%s Starting Rok snapshot procedure... (%s) %s", "-" * 10,
             "before" if before else "after", "-" * 10)
    from rok_gw_client.client import RokClient

    log.info("Retrieving KFP run ID...")
    run_uuid = get_run_uuid()
    log.info("Retrieved KFP run ID: %s", run_uuid)
    bucket = kfputils.get_experiment_from_run_id(run_uuid).name
    obj = "{}-{}".format(pipeline, run_uuid)
    commit_title = "Step: {} ({})".format(step, "start" if before else "end")
    commit_message = "Autosnapshot {} step '{}' of pipeline run '{}'".format(
        "before" if before else "after", step, run_uuid)
    environment = json.dumps({"KALE_PIPELINE_STEP": step,
                              "KALE_NOTEBOOK_PATH": nb_path})
    metadata = json.dumps({"environment": environment, "kfp_runid": run_uuid})
    params = {"pod": get_pod_name(),
              "metadata": metadata,
              "default_container": "main",
              "commit_title": commit_title,
              "commit_message": commit_message}
    rok = RokClient()
    # Create the bucket in case it does not exist
    create_rok_bucket(bucket, client=rok)
    log.info("Registering Rok version for '%s/%s'...", bucket, obj)
    task_info = rok.version_register(bucket, obj, "pod", params, wait=True)
    # FIXME: How do we retrieve the base URL of the ROK UI?
    version = task_info["task"]["result"]["event"]["version"]
    url_path = ("/rok/buckets/%s/files/%s/versions/%s"
                % (encode_url_component(bucket), encode_url_component(obj),
                   encode_url_component(version)))
    log.info("Successfully registered Rok version '%s'", version)

    log.info("Successfully created snapshot for step '%s'", step)
    if before:
        log.info("You can explore the state of the notebook at the beginning"
                 " of this step by spawning a new notebook from the following"
                 " Rok snapshot:")
    log.info("%s", url_path)

    md_source = ("# Rok autosnapshot\n"
                 "Rok has successfully created a snapshot for step `%s`.\n\n"
                 "To **explore the execution state** at the beginning of "
                 "this step follow the instructions below:\n\n"
                 "1\\. View the [snapshot in the Rok UI](%s).\n\n"
                 "2\\. Copy the Rok URL.\n\n"
                 "3\\. Create a new Notebook Server by using this Rok URL to "
                 "autofill the form." % (step, url_path))
    if before:
        metadata = {"outputs": [{"storage": "inline",
                                 "source": md_source,
                                 "type": "markdown"}]}
        with open("/mlpipeline-ui-metadata.json", "w") as f:
            json.dump(metadata, f)
    # Mark the end of the snapshotting procedure
    log.info("%s Successfully ran Rok snapshot procedure (%s) %s", "-" * 10,
             "before" if before else "after", "-" * 10)

    return task_info


def get_workflow_name(pod_name, namespace):
    """Get the workflow name associated to a pod (pipeline step)."""
    v1_client = _get_k8s_v1_client()
    pod = v1_client.read_namespaced_pod(pod_name, namespace)

    # Obtain the workflow name
    labels = pod.metadata.labels
    workflow_name = labels.get("workflows.argoproj.io/workflow", None)
    if workflow_name is None:
        msg = ("Could not retrieve workflow name from pod"
               "{}/{}".format(namespace, pod_name))
        raise RuntimeError(msg)
    return workflow_name


def get_run_uuid():
    """Get the Workflow's UUID form inside a pipeline step."""
    # Retrieve the pod
    pod_name = get_pod_name()
    namespace = get_namespace()
    workflow_name = get_workflow_name(pod_name, namespace)

    # Retrieve the Argo workflow
    api_group = "argoproj.io"
    api_version = "v1alpha1"
    co_name = "workflows"
    co_client = _get_k8s_custom_objects_client()
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
    k8s_client = _get_k8s_v1_client()
    k8s_client.patch_namespaced_pod(name=name, namespace=namespace, body=patch)


def get_pod(name, namespace):
    """Get a pod.

    This function seems redundant but it can save a few repeated lines of code.
    """
    k8s_client = _get_k8s_v1_client()
    return k8s_client.read_namespaced_pod(name, namespace)


def get_workflow(name, namespace):
    """Get a workflow."""
    api_group = "argoproj.io"
    api_version = "v1alpha1"
    co_name = "workflows"
    co_client = _get_k8s_custom_objects_client()
    return co_client.get_namespaced_custom_object(api_group, api_version,
                                                  namespace, co_name, name)


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
