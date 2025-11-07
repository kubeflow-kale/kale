# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

import logging
import os

from kale.common import logutils

# FIXME: We could have a chowned folder in /var/log and use it. But this won't
# work for other kale installations. It would require that setting in the
# Dockerfile
KALE_LOG_DIR = os.getenv("HOME", ".")
KALE_LOG_BASENAME = "kale.log"
KALE_LOG_FILE = os.path.join(KALE_LOG_DIR, KALE_LOG_BASENAME)

FMT_PREFIX = "%(asctime)s %(module)s:%(lineno)d [%(levelname)s] "
RPC_FMT_EXTRAS = "[TID=%(trans_id)s] [%(nb_path)s] "


def create_adapter(logger, trans_id=None, nb_path=None):
    """Create log Adapter."""
    extras = {"trans_id": trans_id or "",
              "nb_path": os.path.realpath(nb_path) if nb_path else ""}
    return logging.LoggerAdapter(logger, extras)


def setup_logging(request):
    """Configure logging."""
    # Set up root logger
    fmt = FMT_PREFIX + "%(message)s"
    _root_log = logutils.get_or_create_logger("", fmt=fmt,
                                              file_level=logging.INFO,
                                              log_path=KALE_LOG_FILE)
    _root_log.setLevel(logging.INFO)

    # Set up kale.rpc logger
    fmt = FMT_PREFIX + RPC_FMT_EXTRAS + "%(message)s"
    logutils.get_or_create_logger("kale.rpc", fmt=fmt, log_path=KALE_LOG_FILE)

    # mute other loggers
    logging.getLogger('urllib3.connectionpool').setLevel(logging.CRITICAL)
    logging.getLogger('urllib3').setLevel(logging.INFO)
    logging.getLogger('kubernetes').setLevel(logging.INFO)
