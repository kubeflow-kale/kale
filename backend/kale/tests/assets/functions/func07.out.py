def final_auto_snapshot():

    from kale.utils import pod_utils as _kale_pod_utils
    _kale_pod_utils.snapshot_pipeline_step(
        "T",
        "final_auto_snapshot",
        "/path/to/nb",
        before=False)
