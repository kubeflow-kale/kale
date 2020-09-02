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

import logging

from kale.common import podutils, rokutils
from kale.rpc.errors import (RPCNotFoundError, RPCServiceUnavailableError)
from kale.rpc.log import create_adapter


logger = create_adapter(logging.getLogger(__name__))


def get_task(request, task_id, bucket=rokutils.DEFAULT_BUCKET):
    """Get the Rok task with id=task_id."""
    return rokutils.get_task(task_id, bucket)


def snapshot_notebook(request, bucket=rokutils.DEFAULT_BUCKET, obj=None):
    """Perform a snapshot over the notebook's pod."""
    return rokutils.snapshot_notebook(bucket, obj)


def replace_cloned_volumes(request, bucket, obj, version, volumes):
    """Replace the volumes to be cloned with a Rok snapshot."""
    return rokutils.replace_cloned_volumes(bucket, obj, version, volumes)


def check_rok_availability(request):
    """Check if Rok is available."""
    log = request.log if hasattr(request, "log") else logger
    try:
        rok = rokutils.get_client()
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
        suggestions = rok.version_register_suggest(rokutils.DEFAULT_BUCKET,
                                                   name, "jupyter",
                                                   "params:lab",
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
