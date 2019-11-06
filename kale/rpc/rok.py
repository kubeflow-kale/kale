import os
import copy

from rok_gw_client.client import RokClient

from kale.utils import pod_utils

DEFAULT_BUCKET = "notebooks"

NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE = """\
This is a snapshot of notebook {} in namespace {}.

This snapshot was created by Kale in order to clone the volumes of the notebook
and use them to spawn a Kubeflow pipeline.\
"""


_client = None


def _get_client():
    global _client

    if _client is None:
        _client = RokClient()

    return _client


def get_task(task_id, bucket=DEFAULT_BUCKET):
    rok = _get_client()
    return rok.task_get(bucket, task_id)


def snapshot_notebook(bucket=DEFAULT_BUCKET, obj=None):
    rok = _get_client()
    hostname = os.getenv("HOSTNAME")
    namespace = pod_utils.get_namespace()
    commit_title = f"Snapshot of notebook {hostname}"
    commit_message = NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE.format(hostname,
                                                             namespace)
    params = {"namespace": namespace,
              "commit_title": commit_title,
              "commit_message": commit_message}

    obj = obj or pod_utils.get_pod_name()
    return rok.version_register(bucket, obj, "jupyter", params)


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
    member_name = f"{obj_name}_{volume['name']}"
    for member in members:
        if member['object'] == member_name:
            volume = copy.deepcopy(volume)
            volume['type'] = 'new_pvc'
            volume['annotations'] = [{'key': 'rok/origin',
                                      'value': member['rok_url']}]
            return volume

    msg = f"Volume '{volume['name']}' not found in group '{obj_name}'"
    raise ValueError(msg)


def replace_cloned_volumes(bucket, obj, version, volumes):
    rok = _get_client()
    version_info = rok.version_info(bucket, obj, version)
    members = _get_group_members(version_info)
    _volumes = []
    for volume in volumes:
        if volume['type'] == 'clone':
            volume = _get_cloned_volume(volume, obj, members)
        _volumes.append(volume)

    return _volumes
