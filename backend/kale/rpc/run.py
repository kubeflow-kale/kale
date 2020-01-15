import sys
import logging
import importlib

from kale.rpc import errors, utils


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


def format_success(result):
    return utils.serialize({"code": errors.Code.OK.value,
                            "result": result})


def run(func, kwargs):
    try:
        log.debug("Decoding kwargs of RPC function '%s'", func)
        kwargs = utils.deserialize(kwargs)
    except Exception:
        exc_info = sys.exc_info()
        log.exception("Failed to decode kwargs: %s", kwargs)
        return errors.RPCEncodingError(message=str(exc_info[1])).serialize()
    try:
        log.debug("Importing RPC function '%s'", func)
        func = import_func(func)
    except ImportError as e:
        exc_info = sys.exc_info()
        log.exception("Failed to import RPC function '%s'", func)
        return errors.RPCImportError(message=str(e)).serialize()

    try:
        log.info("Executing RPC function '%s(%s)'", func.__name__,
                 ", ".join("%s=%s" % i for i in kwargs.items()))
        result = func(**kwargs)
        return format_success(result)
    except errors._RPCError as e:
        log.exception("RPC function '%s' raised an RPCError", func.__name__)
        return e.serialize()
    except Exception:
        exc_info = sys.exc_info()
        log.exception("RPC function '%s' raised an unhandled exception",
                      func.__name__)
        return errors.RPCUnhandledError(message=str(exc_info[1])).serialize()
