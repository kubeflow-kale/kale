import os
import sys
import logging

from kale.marshal import resource_save
from kale.marshal import resource_load
from kale.common import utils

KALE_DATA_DIRECTORY = ""

KALE_MARSHALLING_ERROR_SUFFIX = """
The error was: %s

Please help us improve Kale by opening a new issue at
https://github.com/kubeflow-kale/kale/issues.
"""

KALE_SAVE_ERROR_MSG = """
During data passing, Kale could not marshal the following object:

  - path: '%s'
  - type: '%s'
""" + KALE_MARSHALLING_ERROR_SUFFIX

KALE_LOAD_ERROR_MSG = """
During data passing, Kale could not load the following file:

  - name: '%s'
""" + KALE_MARSHALLING_ERROR_SUFFIX

KALE_UNKNOWN_MARSHALLING_ERROR = """
During data passing, Kale experienced an error.
""" + KALE_MARSHALLING_ERROR_SUFFIX


# exc_info() -> (type, value, traceback)
EXC_INFO_TRACEBACK = 2


class KaleMarshalException(Exception):
    """Errors that may happen while Kale marshals objects between steps."""
    def __init__(self, original_exc=None, original_traceback=None, msg=None,
                 obj=None, obj_name=None, operation=None):
        if msg is None:
            # Set some default useful error message
            msg = "Kale experienced an error while marshalling %s" % obj
        super(KaleMarshalException, self).__init__(msg)
        self.obj = obj
        self.obj_name = obj_name
        self.operation = operation
        self.original_exc = original_exc
        self.with_traceback(original_traceback)


log = logging.getLogger(__name__)


def set_kale_data_directory(path):
    """Set the Kale data directory path."""
    global KALE_DATA_DIRECTORY
    KALE_DATA_DIRECTORY = path
    # create dir if not exists
    if not os.path.isdir(KALE_DATA_DIRECTORY):
        os.makedirs(KALE_DATA_DIRECTORY, exist_ok=True)


def _save(obj, obj_path):
    #  resource_save will automatically add the correct extension
    try:
        resource_save(obj, obj_path)
    # Most of the pickling errors will raise these Exceptions
    except (TypeError, AttributeError) as e:
        raise KaleMarshalException(
            original_exc=e,
            original_traceback=sys.exc_info()[EXC_INFO_TRACEBACK],
            msg=KALE_SAVE_ERROR_MSG % (obj_path, type(obj), e),
            obj=obj,
            obj_name=os.path.basename(obj_path),
            operation="save")
    except Exception as e:
        raise KaleMarshalException(
            original_exc=e,
            original_traceback=sys.exc_info()[EXC_INFO_TRACEBACK],
            msg=KALE_UNKNOWN_MARSHALLING_ERROR % e,
            obj=obj,
            obj_name=os.path.basename(obj_path),
            operation="save")


def save(obj, obj_name):
    """Serialise (save) an object using Kale's marshalling backends.

    Args:
        obj: The Python object to be saved
        obj_name: The variable name of 'obj'
    """
    try:
        _save(obj, os.path.join(KALE_DATA_DIRECTORY, obj_name))
    except KaleMarshalException as e:
        log.error(e)
        log.debug("Original Traceback", exc_info=e.__traceback__)
        utils.graceful_exit(1)


def _load(file_name):
    try:
        _kale_load_file_name = _get_files(file_name)
        _kale_load_folder_name = _get_folders(file_name)

        if len(_kale_load_file_name) > 1:
            raise ValueError("Found multiple files with name %s: %s"
                             % (file_name, str(_kale_load_file_name)))
        if len(_kale_load_folder_name) > 1:
            raise ValueError("Found multiple folders with name %s: %s"
                             % (file_name, str(_kale_load_folder_name)))

        _names = _kale_load_file_name + _kale_load_folder_name
        if len(_names) == 0:
            _msg = KALE_LOAD_ERROR_MSG % (file_name,
                                          "No file or folder was found with"
                                          " the requested name.")
            raise KaleMarshalException(msg=_msg)
        _kale_load_file_name = _names[0]

        return resource_load(os.path.join(KALE_DATA_DIRECTORY,
                                          _kale_load_file_name))
    except ValueError as e:
        raise KaleMarshalException(
            original_exc=e,
            original_traceback=sys.exc_info()[EXC_INFO_TRACEBACK],
            msg=KALE_LOAD_ERROR_MSG % (file_name, e),
            obj_name=file_name, operation="load")
    except Exception as e:
        raise KaleMarshalException(
            original_exc=e,
            original_traceback=sys.exc_info()[EXC_INFO_TRACEBACK],
            msg=KALE_UNKNOWN_MARSHALLING_ERROR % e,
            obj_name=file_name, operation="load")


def _get_files(file_name):
    files = [f for f in os.listdir(KALE_DATA_DIRECTORY)
             if (os.path.isfile(os.path.join(KALE_DATA_DIRECTORY, f))
             and os.path.splitext(f)[0] == file_name)]
    return files


def _get_folders(folder_name):
    folders = [f for f in os.listdir(KALE_DATA_DIRECTORY)
               if (os.path.isdir(os.path.join(KALE_DATA_DIRECTORY, f))
               and os.path.splitext(f)[0] == folder_name)]
    return folders


def load(file_name):
    """Load a file using Kale's marshalling backends.

    Args:
        file_name: The name of the serialized object to be loaded

    Returns: loaded object
    """
    try:
        return _load(file_name)
    except KaleMarshalException as e:
        log.error(e)
        log.debug("Original Traceback", exc_info=e.__traceback__)
        utils.graceful_exit(1)
