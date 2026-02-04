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

from collections.abc import Callable
import logging
import os
import signal

from kale.common import kfputils, utils

log = logging.getLogger(__name__)


def ttl(timeout: int = None):
    """Execute a function with a TTL.

    If the decorated function runs for more that the provided `timeout`
    seconds, the program is killed.

    Expects a positive number or 'None'.
    If timeout is None, it is disabled.
    Raises TypeError or ValueError if timeout is neither None nor a positive
    number.
    """
    if timeout is None:
        # log.warn("Timeout is '%s', therefore it is disabled.", timeout)
        # XXX: passing 0 to setitimer disables it (see setitimer(2))
        timeout = float(0)
    else:
        try:
            timeout = float(timeout)
        except (ValueError, TypeError) as e:
            raise TypeError(f"Timeout needs to be an integer or float: {str(e)}")

        if timeout <= 0:
            raise ValueError(f"Timeout value should be a positive integer. Found value '{timeout}'")

    def _ttl_signal_handler(_signal, _frame):
        log.error(
            "Timeout expired. This step was configured to run with a TTL"
            f" of {timeout} seconds. Stopping execution..."
        )
        utils.graceful_exit(-1)

    def _decorator_ttl(fn: Callable):
        def _ttl():
            log.info(f"Starting timeout. User code TTL set to {timeout} seconds.")
            signal.signal(signal.SIGALRM, _ttl_signal_handler)
            signal.setitimer(signal.ITIMER_REAL, timeout)

            res = fn()

            # reset timer
            signal.setitimer(signal.ITIMER_REAL, 0)
            log.info("User code executed successfully.")
            return res

        return _ttl

    return _decorator_ttl


def link_artifacts(artifacts: dict, link=True):
    """Link a series of artifacts to mlpipeline-ui-metadata.json.

    We use the `link` argument to avoid writing to
    `/tmp/mlpipeline-ui-metadata.json` when executing locally, otherwise
    we would get a permission error.
    """
    if artifacts:
        log.info(
            "Registering step's artifacts: {}".format(", ".join(f"'{name}'" for name in artifacts))
        )
    else:
        log.info("This step has no artifacts")

    for name, path in artifacts.items():
        if not os.path.exists(path):
            raise RuntimeError(f"Filepath '{path}' for artifact '{name}' does not exist.")
        if not os.path.isabs(path):
            raise ValueError(
                f"Path '{path}' for artifact '{name}' is a relative path."
                " Please provide an absolute path."
            )
        if os.path.isdir(path):
            raise RuntimeError(f"Cannot create an artifact from path '{path}': it is a folder.")
        if link:
            # FIXME: Currently this supports just HTML artifacts
            kfputils.update_uimetadata(name)
