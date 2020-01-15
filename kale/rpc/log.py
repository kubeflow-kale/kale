import logging
import os


# FIXME: We could have a chowned folder in /var/log and use it. But this won't
# work for other kale installations. It would require that setting in the
# Dockerfile
KALE_LOG_DIR = os.getenv("HOME", ".")
KALE_LOG_BASENAME = "kale.log"
KALE_LOG_FILE = os.path.join(KALE_LOG_DIR, KALE_LOG_BASENAME)


def setup_logging():
    _logger = logging.getLogger("")
    fmt = '%(asctime)s %(module)s:%(lineno)d [%(levelname)s] %(message)s'
    formatter = logging.Formatter(fmt)
    _logger.setLevel(logging.DEBUG)

    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)
    stream_handler.setFormatter(formatter)

    os.makedirs(KALE_LOG_DIR, exist_ok=True)
    filename = KALE_LOG_FILE
    file_handler = logging.FileHandler(filename=filename, mode='a')
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)

    _logger.addHandler(file_handler)
    _logger.addHandler(stream_handler)

    # mute other loggers
    logging.getLogger('urllib3.connectionpool').setLevel(logging.CRITICAL)
    logging.getLogger('urllib3').setLevel(logging.INFO)
    logging.getLogger('kubernetes').setLevel(logging.INFO)
