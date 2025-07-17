import json

import kfp.dsl as _kfp_dsl
import kfp.components as _kfp_components

from collections import OrderedDict
from kubernetes import client as k8s_client


def step1():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    from kale.common import rokutils as _kale_rokutils
    _kale_mlmdutils.call("link_input_rok_artifacts")
    _kale_rokutils.snapshot_pipeline_step(
        "test",
        "step1",
        "",
        before=True)

    from kale.marshal.decorator import marshal as _kale_marshal
    from kale.common.runutils import link_artifacts as _kale_link_artifacts

    _kale_pipeline_parameters = {}

    @_kale_marshal([], ['data'], _kale_pipeline_parameters, "/marshal")
    def step1():
        return 10

    step1()

    _kale_artifacts = {}

    _kale_link_artifacts(_kale_artifacts)
    _rok_snapshot_task = _kale_rokutils.snapshot_pipeline_step(
        "test",
        "step1",
        "",
        before=False)
    _kale_mlmdutils.call("submit_output_rok_artifact", _rok_snapshot_task)

    _kale_mlmdutils.call("mark_execution_complete")


def step3(b: str):
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    from kale.common import rokutils as _kale_rokutils
    _kale_mlmdutils.call("link_input_rok_artifacts")
    _kale_rokutils.snapshot_pipeline_step(
        "test",
        "step3",
        "",
        before=True)

    from kale.marshal.decorator import marshal as _kale_marshal
    from kale.common.runutils import link_artifacts as _kale_link_artifacts

    _kale_pipeline_parameters = {"b": b}

    @_kale_marshal(['b', 'data'], [], _kale_pipeline_parameters, "/marshal")
    def step3(st, st2):
        print(st)

    step3()

    _kale_artifacts = {}

    _kale_link_artifacts(_kale_artifacts)
    _rok_snapshot_task = _kale_rokutils.snapshot_pipeline_step(
        "test",
        "step3",
        "",
        before=False)
    _kale_mlmdutils.call("submit_output_rok_artifact", _rok_snapshot_task)

    _kale_mlmdutils.call("mark_execution_complete")


def step2(a: int, c: int):
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    from kale.common import rokutils as _kale_rokutils
    _kale_mlmdutils.call("link_input_rok_artifacts")
    _kale_rokutils.snapshot_pipeline_step(
        "test",
        "step2",
        "",
        before=True)

    from kale.marshal.decorator import marshal as _kale_marshal
    from kale.common.runutils import link_artifacts as _kale_link_artifacts

    _kale_pipeline_parameters = {"a": a, "c": c}

    @_kale_marshal(['c', 'a', 'data'], ['res'], _kale_pipeline_parameters, "/marshal")
    def step2(var1, var2, data):
        print(var1 + var2)
        return 'Test'

    step2()

    _kale_artifacts = {}

    _kale_link_artifacts(_kale_artifacts)
    _rok_snapshot_task = _kale_rokutils.snapshot_pipeline_step(
        "test",
        "step2",
        "",
        before=False)
    _kale_mlmdutils.call("submit_output_rok_artifact", _rok_snapshot_task)

    _kale_mlmdutils.call("mark_execution_complete")


def final_auto_snapshot():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    from kale.marshal.decorator import marshal as _kale_marshal
    from kale.common.runutils import link_artifacts as _kale_link_artifacts

    _kale_pipeline_parameters = {}

    @_kale_marshal([], [], _kale_pipeline_parameters, "/marshal")
    def _no_op():
        pass

    _no_op()

    _kale_artifacts = {}

    _kale_link_artifacts(_kale_artifacts)
    from kale.common import rokutils as _kale_rokutils
    _kale_mlmdutils.call("link_input_rok_artifacts")
    _rok_snapshot_task = _kale_rokutils.snapshot_pipeline_step(
        "test",
        "final_auto_snapshot",
        "",
        before=False)
    _kale_mlmdutils.call("submit_output_rok_artifact", _rok_snapshot_task)

    _kale_mlmdutils.call("mark_execution_complete")


_kale_step1_op = _kfp_components.func_to_container_op(step1)


_kale_step3_op = _kfp_components.func_to_container_op(step3)


_kale_step2_op = _kfp_components.func_to_container_op(step2)


_kale_final_auto_snapshot_op = _kfp_components.func_to_container_op(
    final_auto_snapshot)


@_kfp_dsl.pipeline(
    name='test',
    description=''
)
def auto_generated_pipeline(a='1', b='Some string', c='5'):
    _kale_pvolumes_dict = OrderedDict()
    _kale_volume_step_names = []
    _kale_volume_name_parameters = []

    _kale_marshal_vop = _kfp_dsl.VolumeOp(
        name="kale-marshal-volume",
        resource_name="kale-marshal-pvc",
        modes=['ReadWriteMany'],
        size="1Gi"
    )
    _kale_volume_step_names.append(_kale_marshal_vop.name)
    _kale_volume_name_parameters.append(
        _kale_marshal_vop.outputs["name"].full_name)
    _kale_pvolumes_dict['/marshal'] = _kale_marshal_vop.volume

    _kale_volume_step_names.sort()
    _kale_volume_name_parameters.sort()

    _kale_step1_task = _kale_step1_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after()
    _kale_step1_task.container.working_dir = "/test"
    _kale_step1_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_step1_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_step1_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_step1_task.dependent_names +
                       _kale_volume_step_names)
    _kale_step1_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_step1_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_step3_task = _kale_step3_op(b)\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_step1_task)
    _kale_step3_task.container.working_dir = "/test"
    _kale_step3_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_step3_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_step3_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_step3_task.dependent_names +
                       _kale_volume_step_names)
    _kale_step3_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_step3_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_step2_task = _kale_step2_op(a, c)\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_step1_task)
    _kale_step2_task.container.working_dir = "/test"
    _kale_step2_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_step2_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_step2_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_step2_task.dependent_names +
                       _kale_volume_step_names)
    _kale_step2_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_step2_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_final_auto_snapshot_task = _kale_final_auto_snapshot_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_step3_task, _kale_step2_task)
    _kale_final_auto_snapshot_task.container.working_dir = "/test"
    _kale_final_auto_snapshot_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_final_auto_snapshot_task.output_artifact_paths.update(
        _kale_output_artifacts)
    _kale_final_auto_snapshot_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_final_auto_snapshot_task.dependent_names +
                       _kale_volume_step_names)
    _kale_final_auto_snapshot_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_final_auto_snapshot_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))


if __name__ == "__main__":
    pipeline_func = auto_generated_pipeline
    pipeline_filename = pipeline_func.__name__ + '.pipeline.tar.gz'
    import kfp.compiler as compiler
    compiler.Compiler().compile(pipeline_func, pipeline_filename)

    # Get or create an experiment and submit a pipeline run
    import kfp
    client = kfp.Client()
    experiment = client.create_experiment('test')

    # Submit a pipeline run
    from kale.common import kfputils
    pipeline_id, version_id = kfputils.upload_pipeline(
        pipeline_filename, "test")
    run_result = kfputils.run_pipeline(
        experiment_name=experiment.name, pipeline_id=pipeline_id, version_id=version_id)
