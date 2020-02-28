def test():
    from kale.utils import pod_utils as _kale_pod_utils
    _kale_pod_utils.snapshot_pipeline_step(
        "T",
        "test",
        "/path/to/nb")
