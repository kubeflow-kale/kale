def test():
    import os
    import shutil
    from kale.utils import pod_utils as _kale_pod_utils
    from kale.marshal import resource_save as _kale_resource_save
    from kale.marshal import resource_load as _kale_resource_load

    _kale_data_directory = ""
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "v1" not in _kale_directory_file_names:
        raise ValueError("v1" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "v1")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("v1", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    v1 = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    # -----------------------DATA LOADING END----------------------------------
