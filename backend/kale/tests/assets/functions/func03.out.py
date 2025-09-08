def test():

    from kale.common import rokutils as _kale_rokutils
    _kale_rokutils.snapshot_pipeline_step(
        "test",
        "test",
        "/path/to/nb",
        before=True)

    _rok_snapshot_task = _kale_rokutils.snapshot_pipeline_step(
        "test",
        "test",
        "/path/to/nb",
        before=False)
