def test():
    from backend.kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    v1 = _kale_marshal.load("v1")
    # -----------------------DATA LOADING END----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from backend.kale.common.jputils import run_code as _kale_run_code
    from backend.kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_data_loading_block,
                    )
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/test.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('test')

    _kale_mlmdutils.call("mark_execution_complete")
