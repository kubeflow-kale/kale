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
