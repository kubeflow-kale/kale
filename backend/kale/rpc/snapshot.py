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

from kale.common import podutils, snapshotutils
from kale.rpc.errors import (RPCServiceUnavailableError)
from kale.rpc.log import create_adapter


logger = create_adapter(logging.getLogger(__name__))


def check_snapshot_availability(request):
    """Check if snapshotclasses are available for notebook."""
    log = request.log if hasattr(request, "log") else logger
    try:
        podutils.check_snapshot_availability()
    except Exception:
        log.exception("No snapshotclass is available for this notebook")
        raise RPCServiceUnavailableError(details=("No snapshotclass"
                                                  " is available for"
                                                  " this notebook"),
                                         trans_id=request.trans_id)


def check_snapshot_status(request, snapshot_name):
    """Check if volume snapshot is ready to use."""
    return snapshotutils.check_snapshot_status(snapshot_name)


def snapshot_notebook(request):
    """Take snapshots of the current Notebook's PVCs and store its metadata."""
    return snapshotutils.snapshot_notebook()


def replace_cloned_volumes(request, volume_mounts):
    """Replace the volumes with the volumes restored from the snapshot."""
    return snapshotutils.replace_cloned_volumes(volume_mounts)
