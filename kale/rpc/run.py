import sys
import json
import base64
import enum
import logging
import importlib

log = logging.getLogger(__name__)


def import_func(import_func_str):
    """Import and return a function from a string."""
    mod_str, _sep, func_str = import_func_str.rpartition('.')
    if mod_str:
        mod_str = "kale.rpc." + mod_str
    else:
        mod_str = "kale.rpc"
    try:
        mod = importlib.import_module(mod_str)
        return getattr(mod, func_str)
    except (ValueError, AttributeError) as e:
        log.exception("Exception while importing function '%s' of module '%s':"
                      " %s", func_str, mod_str, e)
        raise ImportError("Function `%s' of module `%s' cannot be found: %s" %
                          (func_str, mod_str, e))


class Status(enum.Enum):
    STATUS_OK = 0
    STATUS_IMPORT_ERROR = 1
    STATUS_EXECUTION_ERROR = 2
    STATUS_ENCODING_ERROR = 3


def _serialize_result(result):
    return base64.b64encode(json.dumps(result).encode("utf-8")).decode("utf-8")


def format_success(result):
    return _serialize_result({"status": Status.STATUS_OK.value,
                              "result": result})


def format_error(status, exc_info):
    return _serialize_result({"status": status.value,
                              "err_message": str(exc_info[1]),
                              "err_cls": exc_info[0].__name__})


def run(func, kwargs):
    try:
        kwargs = json.loads(base64.b64decode(kwargs).decode("utf-8"))
    except Exception:
        exc_info = sys.exc_info()
        return format_error(Status.STATUS_ENCODING_ERROR, exc_info)
    try:
        func = import_func(func)
    except ImportError:
        exc_info = sys.exc_info()
        return format_error(Status.STATUS_IMPORT_ERROR, exc_info)

    try:
        result = func(**kwargs)
        return format_success(result)
    except Exception:
        exc_info = sys.exc_info()
        return format_error(Status.STATUS_EXECUTION_ERROR, exc_info)
