import json

import kfp.dsl as _kfp_dsl
import kfp.components as _kfp_components

from collections import OrderedDict
from kubernetes import client as k8s_client


def step1():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    from kale.marshal.decorator import marshal

    pipeline_parameters = {}

    @marshal([], ['_b', '_a'], pipeline_parameters, "/marshal")
    def step1():
        a = 1
        b = 2
        return a, b

    step1()
    _kale_mlmdutils.call("mark_execution_complete")


def step2():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    from kale.marshal.decorator import marshal

    pipeline_parameters = {}

    @marshal(['_b', '_a'], ['_c'], pipeline_parameters, "/marshal")
    def step2(a, b):
        c = a + b
        print(c)
        return c

    step2()
    _kale_mlmdutils.call("mark_execution_complete")


def step3():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    from kale.marshal.decorator import marshal

    pipeline_parameters = {}

    @marshal(['_a', '_c'], [], pipeline_parameters, "/marshal")
    def step3(a, c):
        d = c + a
        print(d)

    step3()
    _kale_mlmdutils.call("mark_execution_complete")


_kale_step1_op = _kfp_components.func_to_container_op(step1)


_kale_step2_op = _kfp_components.func_to_container_op(step2)


_kale_step3_op = _kfp_components.func_to_container_op(step3)


@_kfp_dsl.pipeline(
    name='test',
    description=''
)
def auto_generated_pipeline():
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
    _kale_step_labels = {'common-label': 'true'}
    for _kale_k, _kale_v in _kale_step_labels.items():
        _kale_step1_task.add_pod_label(_kale_k, _kale_v)
    _kale_step_limits = {'amd/gpu': '1'}
    for _kale_k, _kale_v in _kale_step_limits.items():
        _kale_step1_task.container.add_resource_limit(_kale_k, _kale_v)
    _kale_step1_task.container.working_dir = "/test"
    _kale_step1_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
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

    _kale_step2_task = _kale_step2_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_step1_task)
    _kale_step_labels = {'common-label': 'true'}
    for _kale_k, _kale_v in _kale_step_labels.items():
        _kale_step2_task.add_pod_label(_kale_k, _kale_v)
    _kale_step2_task.set_retry_strategy(
        num_retries=5,
        retry_policy="Always",
        backoff_duration="20",
        backoff_factor=2,
        backoff_max_duration=None)
    _kale_step2_task.container.working_dir = "/test"
    _kale_step2_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
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

    _kale_step3_task = _kale_step3_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_step2_task, _kale_step1_task)
    _kale_step_annotations = {'step3-annotation': 'test'}
    for _kale_k, _kale_v in _kale_step_annotations.items():
        _kale_step3_task.add_pod_annotation(_kale_k, _kale_v)
    _kale_step_labels = {'common-label': 'true'}
    for _kale_k, _kale_v in _kale_step_labels.items():
        _kale_step3_task.add_pod_label(_kale_k, _kale_v)
    _kale_step3_task.container.working_dir = "/test"
    _kale_step3_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
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
