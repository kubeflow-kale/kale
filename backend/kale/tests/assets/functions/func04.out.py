def test():
    data_dir_block = '''
    import os
    _kale_data_directory = ""
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

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
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, data_loading_block,
              )
    html_artifact = _kale_run_code(blocks)
    with open("/test.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('test')
