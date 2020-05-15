def test():
    from kale.utils import mlmd_utils as _kale_mlmd_utils
    _kale_mlmd_utils.init_metadata()

    block1 = '''
    v1 = "Hello"
    '''

    block2 = '''
    print(v1)
    '''

    data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("")
    _kale_marshal_utils.save(v1, "v1")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.kfp_utils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (
        block1,
        block2,
        data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/test.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('test')

    _kale_mlmd_utils.call("mark_execution_complete")
