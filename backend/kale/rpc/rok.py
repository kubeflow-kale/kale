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
import copy
import logging

from kale.common import podutils
from kale.rpc.errors import (RPCNotFoundError, RPCServiceUnavailableError)
from kale.rpc.log import create_adapter

DEFAULT_BUCKET = "notebooks"

NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE = """\
This is a snapshot of notebook {} in namespace {}.

This snapshot was created by Kale in order to clone the volumes of the notebook
and use them to spawn a Kubeflow pipeline.\
"""

_client = None
logger = create_adapter(logging.getLogger(__name__))


def _get_client():
    from rok_gw_client.client import RokClient

    global _client

    if _client is None:
        _client = RokClient()

    return _client


def get_task(request, task_id, bucket=DEFAULT_BUCKET):
    """Get the Rok task with id=task_id."""
    rok = _get_client()
    return rok.task_get(bucket, task_id)


def snapshot_notebook(request, bucket=DEFAULT_BUCKET, obj=None):
    """Perform a snapshot over the notebook's pod."""
    rok = _get_client()
    hostname = os.getenv("HOSTNAME")
    namespace = podutils.get_namespace()
    commit_title = "Snapshot of notebook {}".format(hostname)
    commit_message = NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE.format(hostname,
                                                             namespace)
    params = {"namespace": namespace,
              "commit_title": commit_title,
              "commit_message": commit_message}

    obj = obj or podutils.get_pod_name()
    # Create the bucket in case it does not exist
    podutils.create_rok_bucket(bucket, client=rok)
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


def replace_cloned_volumes(request, bucket, obj, version, volumes):
    """Replace the volumes to be cloned with a Rok snapshot."""
    rok = _get_client()
    version_info = rok.version_info(bucket, obj, version)
    members = _get_group_members(version_info)
    _volumes = []
    for volume in volumes:
        if volume['type'] == 'clone':
            volume = _get_cloned_volume(volume, obj, members)
        _volumes.append(volume)

    return _volumes


def check_rok_availability(request):
    """Check if Rok is available."""
    log = request.log if hasattr(request, "log") else logger
    try:
        rok = _get_client()
    except ImportError:
        log.exception("Failed to import RokClient")
        raise RPCNotFoundError(details="Rok Gateway Client module not found",
                               trans_id=request.trans_id)
    except Exception:
        log.exception("Failed to initialize RokClient")
        raise RPCServiceUnavailableError(details=("Failed to initialize"
                                                  " RokClient"),
                                         trans_id=request.trans_id)

    try:
        rok.account_info()
    except Exception:
        log.exception("Failed to retrieve account information")
        raise RPCServiceUnavailableError(details="Failed to access Rok",
                                         trans_id=request.trans_id)

    name = podutils.get_pod_name()
    namespace = podutils.get_namespace()
    try:
        suggestions = rok.version_register_suggest(DEFAULT_BUCKET, name,
                                                   "jupyter", "params:lab",
                                                   {"namespace": namespace},
                                                   ignore_env=True)
    except Exception as e:
        log.exception("Failed to list lab suggestions")
        message = "%s: %s" % (e.__class__.__name__, e)
        raise RPCServiceUnavailableError(message=message,
                                         details=("Rok cannot list notebooks"
                                                  " in this namespace"),
                                         trans_id=request.trans_id)

    if not any(s["value"] == name for s in suggestions):
        log.error("Could not find notebook '%s' in list of suggestions", name)
        raise RPCNotFoundError(details=("Could not find this notebook in"
                                        " notebooks listed by Rok"),
                               trans_id=request.trans_id)
