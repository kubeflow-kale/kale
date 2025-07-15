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

from typing import List, Sequence


LOG_FMT = "%(asctime)s Kale {} %(levelname)-10s %(message)s"
DATE_FMT = "%Y-%m-%d %H:%M:%S"
BLANK_FMT = logging.Formatter(fmt="")
_loggers = dict()


class CustomLogRecord(logging.LogRecord):
    """Custom log record.

    We use a custom log record in order to create custom and compound log
    elements that can be used by the Formatter just like standard properties.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.origin = f"{self.module}:{self.lineno}"
        # override the default levelname
        self.levelname = f"[{self.levelname}]"


def _suppress_handlers(log: logging.Logger) -> List[List[logging.Formatter]]:
    def _suppress_handlers_for_logger(log: logging.Logger) -> (
            List[logging.Formatter]):
        formatters = []
        for h in log.handlers:
            formatters.append(h.formatter)
            h.setFormatter(BLANK_FMT)
        return formatters

    formatters = [_suppress_handlers_for_logger(log)]
    while log.propagate and log.parent:
        log = log.parent
        formatters.append(_suppress_handlers_for_logger(log))
    return formatters


def _restore_handlers(log: logging.Logger,
                      formatters: Sequence[logging.Formatter]) -> None:
    for i in range(len(formatters)):
        for handler, fmt in zip(log.handlers, formatters[i]):
            handler.setFormatter(fmt)
        log = log.parent


class KaleLogger(logging.Logger):
    """Custom logger.

    We use a custom logger so that we can have custom methods and attributes.
    """
    def newline(self, lines: int = 1):
        """Log an empty line by suppressing logger's formatters.

        NOTE: This function is not thread safe
        """
        # Back up and suppress current formatters
        # XXX: We need to suppress handlers recursively up until we find a
        # logger with `propagate == False` or `parent == None`
        original_formatters = _suppress_handlers(self)
        # Log empty lines
        for _ in range(lines):
            self.info('')
        # Restore original formatters
        _restore_handlers(self, original_formatters)


logging.setLogRecordFactory(CustomLogRecord)
logging.setLoggerClass(KaleLogger)


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

    # Set up logger
    log = logging.getLogger(module)
    # Set propagate to False allowing different logger settings across kale
    # modules without multiple log messages with the same information
    log.propagate = False
    # Set DEBUG level for the root logger and let handlers set their own level
    log.setLevel(logging.DEBUG)

    # Set up handlers
    log_fmt = fmt or LOG_FMT.format("%-20s" % name if name
                                    else "%(origin)-20s")
    stream_handler = logging.StreamHandler()
    _configure_handler(stream_handler, level, logging.Formatter(log_fmt,
                                                                DATE_FMT))
    log.addHandler(stream_handler)

    if log_path:
        # if log_path is just a file name, dirname will be empty
        if os.path.dirname(log_path):
            os.makedirs(os.path.dirname(log_path), exist_ok=True)
        file_handler = logging.FileHandler(filename=os.path.abspath(log_path),
                                           mode='a')
        _configure_handler(file_handler, file_level,
                           logging.Formatter(file_fmt or log_fmt, DATE_FMT))
        log.addHandler(file_handler)

    _loggers[module] = log
    return log
