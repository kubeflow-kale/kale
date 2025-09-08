def final_auto_snapshot():

    from kale.common import rokutils as _kale_rokutils
    _rok_snapshot_task = _kale_rokutils.snapshot_pipeline_step(
        "test",
        "final_auto_snapshot",
        "/path/to/nb",
        before=False)
