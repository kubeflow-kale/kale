# Copyright 2020 The Kale Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import copy
import json
import time
import math
import logging
import kubernetes

from progress.bar import IncrementalBar

from kale.rpc import nb
from kale.common import utils
from kale.common import podutils, kfputils, k8sutils

_client = None

DEFAULT_BUCKET = "notebooks"
SERVING_BUCKET = "serving"

NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE = """\
This is a snapshot of notebook {} in namespace {}.
This snapshot was created by Kale in order to clone the volumes of the notebook
and use them to spawn a Kubeflow pipeline.\
"""

log = logging.getLogger(__name__)


def get_client():
    """Get (init if not exists) the Rok client."""
    from rok_gw_client.client import RokClient

    global _client

    if _client is None:
        _client = RokClient()

    return _client


def snapshot_pvc(pvc_name, bucket=DEFAULT_BUCKET, wait=False,
                 interactive=False):
    """Perform a snapshot over a PVC."""
    rok = get_client()
    namespace = podutils.get_namespace()
    log.info("Taking a snapshot of PVC %s in namespace %s ..."
             % (pvc_name, namespace))
    commit_title = "Snapshot PVC '{}'".format(pvc_name)
    commit_message = "This is a snapshot of PVC '{}' triggered by Kale".format(
        pvc_name)
    params = {"dataset": pvc_name,
              "namespace": namespace,
              "commit_title": commit_title,
              "commit_message": commit_message}

    # Create the bucket in case it does not exist
    create_rok_bucket(bucket)

    task_info = rok.version_register(bucket, pvc_name, "dataset", params,
                                     wait=wait and not interactive)
    if wait:
        if interactive:
            task_id = task_info["task"]["id"]
            return monitor_snapshot_task(task_id, bucket=bucket)
        else:
            log.info("Successfully took Rok snapshot")
    return task_info


def snapshot_pod(bucket=DEFAULT_BUCKET, wait=False, interactive=False):
    """Take a Rok snapshot of the current Pod."""
    rok = get_client()
    pod_name = podutils.get_pod_name()
    namespace = podutils.get_namespace()
    log.info("Taking a snapshot of pod %s in namespace %s ..."
             % (pod_name, namespace))
    commit_title = "Snapshot of pod {}".format(pod_name)
    commit_message = NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE.format(pod_name,
                                                             namespace)
    params = {"pod": pod_name,
              "default_container": podutils.get_container_name(),
              "namespace": namespace,
              "commit_title": commit_title,
              "commit_message": commit_message}

    # Create the bucket in case it does not exist
    create_rok_bucket(bucket)

    task_info = rok.version_register(bucket, pod_name, "pod", params,
                                     wait=wait and not interactive)
    if wait:
        if interactive:
            task_id = task_info["task"]["id"]
            return monitor_snapshot_task(task_id)
        else:
            log.info("Successfully took Rok snapshot")
    return task_info


def snapshot_notebook(bucket=DEFAULT_BUCKET, obj=None):
    """Take a Rok snapshot of the current Notebook."""
    rok = get_client()
    pod_name = podutils.get_pod_name()
    namespace = podutils.get_namespace()
    log.info("Taking a snapshot of notebook %s in namespace %s ..."
             % (pod_name, namespace))
    commit_title = "Snapshot of notebook {}".format(pod_name)
    commit_message = NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE.format(pod_name,
                                                             namespace)
    params = {"namespace": namespace,
              "commit_title": commit_title,
              "commit_message": commit_message}

    obj = obj or pod_name
    # Create the bucket in case it does not exist
    create_rok_bucket(bucket)
    return rok.version_register(bucket, obj, "jupyter", params)


def interactive_snapshot_and_get_volumes(bucket=DEFAULT_BUCKET):
    """Take a Rok snapshot of the Pod with interactive progress."""
    log.info("Taking a snapshot of the Pod's volumes...")
    task = snapshot_pod(bucket=bucket, wait=True, interactive=True)

    return replace_cloned_volumes(
        bucket=task["bucket"],
        obj=task["result"]["event"]["object"],
        version=task["result"]["event"]["version"],
        # fixme: we should not call an rpc here, consider moving `list_volumes`
        #  to a common utils lib.
        volumes=nb.list_volumes(request=None))


def monitor_snapshot_task(task_id, bucket=DEFAULT_BUCKET):
    """Monitor a Rok task and show its progress with a progressbar."""
    log.info("Monitoring Rok snapshot with task id: %s", task_id)
    task = None
    status = None
    with IncrementalBar('Rok Task: ', max=100) as bar:
        while status not in ["success", "error", "canceled"]:
            task = get_task(task_id=task_id, bucket=bucket)
            status = task["status"]
            bar.next(task["progress"] - bar.index)
            time.sleep(2)

    if status == "success":
        log.info("Successfully created Rok snapshot")
    elif status in ["error", "canceled"]:
        raise RuntimeError("Rok task has failed (status: %s)" % status)
    else:
        raise RuntimeError("Unknown Rok task status: %s" % status)
    return task


def get_task(task_id, bucket=DEFAULT_BUCKET):
    """Get a Rok task by id [and bucket]."""
    return get_client().task_get(bucket, task_id)


def replace_cloned_volumes(bucket, obj, version, volumes):
    """Replace the volumes to be cloned with a Rok snapshot."""
    rok = get_client()
    version_info = rok.version_info(bucket, obj, version)
    members = _get_group_members(version_info)
    _volumes = []
    for volume in volumes:
        if volume['type'] == 'clone':
            volume = _get_cloned_volume(volume, obj, members)
        _volumes.append(volume)

    return _volumes


def _get_group_members(info):
    member_cnt = int(info["group_member_count"])
    members = []
    for i in range(member_cnt):
        member_obj = info["group_member_%d_object" % i]
        member_version = info["group_member_%d_version" % i]
        member_url = info["group_member_%d_url" % i]
        members.append({"object": member_obj,
                        "version": member_version,
                        "rok_url": member_url})
    return members


def _get_cloned_volume(volume, obj_name, members):
    member_name = "{}_{}".format(obj_name, volume['name'])
    for member in members:
        if member['object'] == member_name:
            volume = copy.deepcopy(volume)
            volume['type'] = 'new_pvc'
            volume['annotations'] = [{'key': 'rok/origin',
                                      'value': member['rok_url']}]
            return volume

    msg = "Volume '{}' not found in group '{}'".format(volume['name'],
                                                       obj_name)
    raise ValueError(msg)


def hydrate_pvc_from_snapshot(obj, version, new_pvc_name,
                              bucket=DEFAULT_BUCKET):
    """Create a new PVC out of a Rok snapshot."""
    log.info("Creating new PVC '%s' from Rok version %s ..." %
             (new_pvc_name, version))
    rok = get_client()
    version_info = rok.version_info(bucket, obj, version)
    # size of the snapshot
    size = int(version_info['content_length'])
    units = ["", "Ki", "Mi", "Gi"]
    unit = 0
    while size > 1024 and unit < 3:
        size = math.ceil(size / 1024)
        unit += 1
    size_repr = "%s%s" % (size, units[unit])
    rok_url = version_info['rok_url']
    log.info("Using Rok url: %s" % rok_url)

    # todo: kubernetes python client v11 have a
    #  kubernetes.utils.create_from_dict that would make it much more nicer
    #  here. (KFP support kubernetes <= 10)
    pvc = kubernetes.client.V1PersistentVolumeClaim(
        api_version="v1",
        metadata=kubernetes.client.V1ObjectMeta(
            annotations={"rok/origin": rok_url},
            name=new_pvc_name
        ),
        spec=kubernetes.client.V1PersistentVolumeClaimSpec(
            storage_class_name="rok",
            access_modes=["ReadWriteOnce"],
            resources=kubernetes.client.V1ResourceRequirements(
                requests={"storage": size_repr}
            )
        )
    )
    k8s_client = k8sutils.get_v1_client()
    ns = podutils.get_namespace()
    ns_pvc = k8s_client.create_namespaced_persistent_volume_claim(ns, pvc)
    log.info("Successfully submitted PVC.")
    return {"name": ns_pvc.metadata.name}


def create_rok_bucket(bucket):
    """Create a new Rok bucket."""
    log.info("Creating Rok bucket '%s'...", bucket)
    from rok_gw_client.client import GatewayClientError
    rok = get_client()

    # FIXME: Currently the Rok API only supports update-or-create for buckets,
    # so we do a HEAD first to avoid updating an existing bucket. This
    # obviously has a small race, which should be removed by extending the Rok
    # API with an exclusive creation API call.
    try:
        bucket_info = rok.bucket_info(bucket)
        log.info("Rok bucket '%s' already exists", bucket)
        return False, bucket_info
    except GatewayClientError as e:
        if e.response.status_code != 404:
            raise

        created, bucket_info = rok.bucket_create(bucket)
        log.info("Successfully created Rok bucket '%s'", bucket)
        return created, bucket_info


def snapshot_pipeline_step(pipeline, step, nb_path, before=True):
    """Take a snapshot of a pipeline step with Rok."""
    # Mark the start of the snapshotting procedure
    log.info("%s Starting Rok snapshot procedure... (%s) %s", "-" * 10,
             "before" if before else "after", "-" * 10)

    log.info("Retrieving KFP run ID...")
    run_uuid = podutils.get_run_uuid()
    log.info("Retrieved KFP run ID: %s", run_uuid)
    bucket = kfputils.get_experiment_from_run_id(run_uuid).name
    obj = "{}-{}".format(pipeline, run_uuid)
    commit_title = "Step: {} ({})".format(step, "start" if before else "end")
    commit_message = "Autosnapshot {} step '{}' of pipeline run '{}'".format(
        "before" if before else "after", step, run_uuid)
    environment = json.dumps({"KALE_PIPELINE_STEP": step,
                              "KALE_NOTEBOOK_PATH": nb_path,
                              "KALE_SNAPSHOT_FINAL": not before})
    metadata = json.dumps({
        "environment": environment,
        "kfp_runid": kfputils.format_kfp_run_id_uri(run_uuid),
        "state": "initial" if before else "final"})
    params = {"pod": podutils.get_pod_name(),
              "metadata": metadata,
              "default_container": "main",
              "commit_title": commit_title,
              "commit_message": commit_message}
    rok = get_client()
    # Create the bucket in case it does not exist
    create_rok_bucket(bucket)
    log.info("Registering Rok version for '%s/%s'...", bucket, obj)
    task_info = rok.version_register(bucket, obj, "pod", params, wait=True)
    # FIXME: How do we retrieve the base URL of the ROK UI?
    version = task_info["task"]["result"]["event"]["version"]
    url_path = ("/rok/buckets/%s/files/%s/versions/%s?ns=%s"
                % (utils.encode_url_component(bucket),
                   utils.encode_url_component(obj),
                   utils.encode_url_component(version),
                   utils.encode_url_component(podutils.get_namespace())))
    log.info("Successfully registered Rok version '%s'", version)

    log.info("Successfully created snapshot for step '%s'", step)
    if before:
        log.info("You can explore the state of the notebook at the beginning"
                 " of this step by spawning a new notebook from the following"
                 " Rok snapshot:")
    log.info("%s", url_path)

    reproduce_steps = ("To **explore the execution state** at the **%s** of"
                       " this step follow the instructions below:\n\n"
                       "1\\. View the [snapshot in the Rok UI](%s).\n\n"
                       "2\\. Copy the Rok URL.\n\n"
                       "3\\. Create a new Notebook Server by using this Rok"
                       " URL to autofill the form.")

    if before:
        md_source = (("# Rok autosnapshot\n"
                      "Rok has successfully created a snapshot for step `%s`."
                      "\n\n" + reproduce_steps)
                     % (step, "beginning", url_path))
    else:
        md_source = (("# Rok final autosnapshot\n"
                      "Rok has successfully created a snapshot **after** the"
                      " execution of step `%s`.\n\n" + reproduce_steps)
                     % (step, "end", url_path))

    try:
        metadataui = kfputils.get_current_uimetadata(default_if_not_exist=True)
    except json.JSONDecodeError:
        log.error("This step will not create a Rok markdown artifact.")
    else:
        metadataui["outputs"].append({"storage": "inline",
                                      "source": md_source,
                                      "type": "markdown"})
        with open(kfputils.KFP_UI_METADATA_FILE_PATH, "w") as f:
            json.dump(metadataui, f)
    # Mark the end of the snapshotting procedure
    log.info("%s Successfully ran Rok snapshot procedure (%s) %s", "-" * 10,
             "before" if before else "after", "-" * 10)

    return task_info
