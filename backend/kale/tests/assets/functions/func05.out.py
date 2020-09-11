def test():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_block1 = '''
    v1 = "Hello"
    '''

    _kale_block2 = '''
    print(v1)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("")
    _kale_marshal_utils.save(v1, "v1")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (
        _kale_block1,
        _kale_block2,
        _kale_data_saving_block)
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/test.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('test')

    _kale_mlmdutils.call("mark_execution_complete")
