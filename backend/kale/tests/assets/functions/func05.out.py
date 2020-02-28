def test():
    data_dir_block = '''
    import os
    _kale_data_directory = ""
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    block1 = '''
    v1 = "Hello"
    '''

    block2 = '''
    print(v1)
    '''

    data_saving_block = '''
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "v1" in locals():
        _kale_resource_save(
            v1, os.path.join(_kale_data_directory, "v1"))
    else:
        print("_kale_resource_save: `v1` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/test.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('test')

