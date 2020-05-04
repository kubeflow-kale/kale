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

import logging

_loggers = dict()


def get_or_create_logger(module, name=None, level=logging.INFO):
    """Get or create and return module's logger."""
    global _loggers
    log = _loggers.get(module)
    if log:
        for h in log.handlers:
            h.setLevel(level)
        return log

    # Setup handler
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(level)
    stream_handler.setFormatter(logging.Formatter(
        "%(asctime)s {} [%(levelname)s] %(message)s".format(name
                                                            or "%(module)s"),
        "%H:%M:%S"))

    # Setup logger
    log = logging.getLogger(module)
    # Set propagate to False allowing different logger settings across kale
    # modules without multiple log messages with the same information
    log.propagate = False
    # Set DEBUG level for the root logger and let handlers set their own level
    # XXX: In the future we may add the option for file handlers as well and
    # XXX: get rid of some of the special logic in kale.rpc.log
    log.setLevel(logging.DEBUG)
    log.addHandler(stream_handler)
    _loggers[module] = log
    return log
