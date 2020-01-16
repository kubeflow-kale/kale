import logging
import os


# FIXME: We could have a chowned folder in /var/log and use it. But this won't
# work for other kale installations. It would require that setting in the
# Dockerfile
KALE_LOG_DIR = os.getenv("HOME", ".")
KALE_LOG_BASENAME = "kale.log"
KALE_LOG_FILE = os.path.join(KALE_LOG_DIR, KALE_LOG_BASENAME)

FMT_PREFIX = "%(asctime)s %(module)s:%(lineno)d [%(levelname)s] "
RPC_FMT_EXTRAS = "[TID=%(trans_id)s] [%(nb_path)s] "


def configure_handler(handler, fmt_extras="", level=logging.INFO):
    handler.setLevel(level)
    handler.setFormatter(logging.Formatter(FMT_PREFIX + fmt_extras))


def create_adapter(logger, trans_id=None, nb_path=None):
    extras = {"trans_id": trans_id or "",
              "nb_path": os.path.realpath(nb_path) if nb_path else ""}
    return logging.LoggerAdapter(logger, extras)


def setup_logging(request):
    # Setup root logger
    root_stream_handler = logging.StreamHandler()
    configure_handler(root_stream_handler, "%(message)s")

    os.makedirs(KALE_LOG_DIR, exist_ok=True)
    root_file_handler = logging.FileHandler(filename=KALE_LOG_FILE, mode='a')
    configure_handler(root_stream_handler, "%(message)s")

    _logger = logging.getLogger("")
    _logger.setLevel(logging.INFO)
    _logger.addHandler(root_file_handler)
    _logger.addHandler(root_stream_handler)

    # Setup kale.rpc logger
    rpc_stream_handler = logging.StreamHandler()
    configure_handler(rpc_stream_handler, RPC_FMT_EXTRAS + "%(message)s")

    os.makedirs(KALE_LOG_DIR, exist_ok=True)
    rpc_file_handler = logging.FileHandler(filename=KALE_LOG_FILE, mode='a')
    configure_handler(rpc_file_handler, RPC_FMT_EXTRAS + "%(message)s",
                      logging.DEBUG)
    _rpc_logger = logging.getLogger("kale.rpc")
    _rpc_logger.propagate = 0
    _rpc_logger.setLevel(logging.DEBUG)
    _rpc_logger.addHandler(rpc_file_handler)
    _rpc_logger.addHandler(rpc_stream_handler)

    # mute other loggers
    logging.getLogger('urllib3.connectionpool').setLevel(logging.CRITICAL)
    logging.getLogger('urllib3').setLevel(logging.INFO)
    logging.getLogger('kubernetes').setLevel(logging.INFO)
