def test():
    from kale.utils import mlmd_utils as _kale_mlmd_utils
    _kale_mlmd_utils.init_metadata()

    from kale.utils import pod_utils as _kale_pod_utils
    _kale_mlmd_utils.call("link_input_rok_artifacts")
    _kale_pod_utils.snapshot_pipeline_step(
        "T",
        "test",
        "/path/to/nb",
        before=True)

    _rok_snapshot_task = _kale_pod_utils.snapshot_pipeline_step(
        "T",
        "test",
        "/path/to/nb",
        before=False)
    _kale_mlmd_utils.call("submit_output_rok_artifact", _rok_snapshot_task)

    _kale_mlmd_utils.call("mark_execution_complete")
