import os

from kale.marshal import resource_save
from kale.marshal import resource_load

KALE_DATA_DIRECTORY = ""
KALE_DIRECTORY_FILE_NAMES = []


def set_kale_data_directory(path):
    """Set the Kale data directory path."""
    global KALE_DATA_DIRECTORY
    KALE_DATA_DIRECTORY = path
    # create dir if not exists
    if not os.path.isdir(KALE_DATA_DIRECTORY):
        os.makedirs(KALE_DATA_DIRECTORY, exist_ok=True)


def set_kale_directory_file_names():
    """Set the list of filenames present in the Kale data directory path."""
    global KALE_DIRECTORY_FILE_NAMES
    KALE_DIRECTORY_FILE_NAMES = [
        os.path.splitext(f)[0]
        for f in os.listdir(KALE_DATA_DIRECTORY)
        if os.path.isfile(os.path.join(KALE_DATA_DIRECTORY, f))
    ]


def save(obj, obj_name):
    """Serialise (save) an object using Kale's marshalling backends.

    Args:
        obj: The Python object to be saved
        obj_name: The variable name of 'obj'
    """
    #  resource_save will automatically add the correct extension
    resource_save(
        obj,
        os.path.join(KALE_DATA_DIRECTORY, obj_name))


def load(var_name):
    """Load an object using Kale's marshalling backends.

    Args:
        var_name: The name of the object to be loaded

    Returns: loaded object
    """
    # First check that the variable exists in the path
    if var_name not in KALE_DIRECTORY_FILE_NAMES:
        raise ValueError("Failed to load variable %s" % var_name)

    # Load variable
    _kale_load_file_name = [
        f
        for f in os.listdir(KALE_DATA_DIRECTORY)
        if (os.path.isfile(os.path.join(KALE_DATA_DIRECTORY, f)) and
            os.path.splitext(f)[0] == var_name)
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % (var_name, str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    return resource_load(os.path.join(KALE_DATA_DIRECTORY,
                                      _kale_load_file_name))
