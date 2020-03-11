def test():
    data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("")
    _kale_marshal_utils.set_kale_directory_file_names()
    v1 = _kale_marshal_utils.load("v1")
    # -----------------------DATA LOADING END----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_loading_block,
              )
    html_artifact = _kale_run_code(blocks)
    with open("/test.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('test')
