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

import os
import logging

LOG_FMT = "%(asctime)s Kale {} [%(levelname)s] %(message)s"
_loggers = dict()


def _configure_handler(handler, level, formatter):
    handler.setLevel(level)
    handler.setFormatter(formatter)


def get_or_create_logger(module, name=None, level=logging.INFO, fmt=None,
                         file_level=logging.DEBUG, file_fmt=None,
                         log_path=None):
    """Get or create and return module's logger.

    Args:
        module: the module for which we request a logger
        name: the name/title of the logger if default format is used
        level: logging level for StreamHandlers
        fmt: override default format
        file_level: logging level for FileHandlers
        file_fmt: override default file format
        log_path: logfile path (if None, then no FileHandler is created)
    """
    global _loggers
    log = _loggers.get(module)
    if log:
        for h in log.handlers:
            # XXX: StreamHandler is FileHandler's parent class, so the order
            # XXX: should be like this
            if isinstance(h, logging.FileHandler):
                h.setLevel(file_level)
            elif isinstance(h, logging.StreamHandler):
                h.setLevel(level)
        return log

    # Setup logger
    log = logging.getLogger(module)
    # Set propagate to False allowing different logger settings across kale
    # modules without multiple log messages with the same information
    log.propagate = False
    # Set DEBUG level for the root logger and let handlers set their own level
    log.setLevel(logging.DEBUG)

    # Setup handlers
    log_fmt = fmt or LOG_FMT.format(name or "%(module)s:%(lineno)d")
    stream_handler = logging.StreamHandler()
    _configure_handler(stream_handler, level, logging.Formatter(log_fmt,
                                                                "%H:%M:%S"))
    log.addHandler(stream_handler)

    if log_path:
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        file_handler = logging.FileHandler(filename=os.path.abspath(log_path),
                                           mode='a')
        _configure_handler(file_handler, file_level,
                           logging.Formatter(file_fmt or log_fmt,
                                             "%Y-%m-%d %H:%M:%S"))
        log.addHandler(file_handler)

    _loggers[module] = log
    return log
