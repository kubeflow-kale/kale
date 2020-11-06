import json

import kfp.dsl as _kfp_dsl
import kfp.components as _kfp_components

from collections import OrderedDict
from kubernetes import client as k8s_client


def create_matrix(d1: int, d2: int):
    _kale_pipeline_parameters_block = '''
    d1 = {}
    d2 = {}
    '''.format(d1, d2)

    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_block1 = '''
    import numpy as np
    '''

    _kale_block2 = '''
    rnd_matrix = np.random.rand(d1, d2)
    '''

    _kale_block3 = '''
    from kale.common import kfputils as _kale_kfputils
    _kale_kfp_metrics = {
        "d1": d1,
        "d2": d2
    }
    _kale_kfputils.generate_mlpipeline_metrics(_kale_kfp_metrics)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    _kale_marshal.save(rnd_matrix, "rnd_matrix")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_pipeline_parameters_block,
                    _kale_block1,
                    _kale_block2,
                    _kale_block3,
                    _kale_data_saving_block)
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/create_matrix.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('create_matrix')

    _kale_mlmdutils.call("mark_execution_complete")


def sum_matrix():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    rnd_matrix = _kale_marshal.load("rnd_matrix")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    '''

    _kale_block2 = '''
    sum_result = rnd_matrix.sum()
    '''

    _kale_block3 = '''
    from kale.common import kfputils as _kale_kfputils
    _kale_kfp_metrics = {
        "sum-result": sum_result
    }
    _kale_kfputils.generate_mlpipeline_metrics(_kale_kfp_metrics)
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    _kale_blocks = (_kale_data_loading_block,
                    _kale_block1,
                    _kale_block2,
                    _kale_block3,
                    )
    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/sum_matrix.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('sum_matrix')

    _kale_mlmdutils.call("mark_execution_complete")


_kale_create_matrix_op = _kfp_components.func_to_container_op(create_matrix)


_kale_sum_matrix_op = _kfp_components.func_to_container_op(sum_matrix)


@_kfp_dsl.pipeline(
    name='hp-test-rnd',
    description=''
)
def auto_generated_pipeline(booltest='True', d1='5', d2='6', strtest='test'):
    _kale_pvolumes_dict = OrderedDict()
    _kale_volume_step_names = []
    _kale_volume_name_parameters = []

    _kale_marshal_vop = _kfp_dsl.VolumeOp(
        name="kale-marshal-volume",
        resource_name="kale-marshal-pvc",
        modes=_kfp_dsl.VOLUME_MODE_RWM,
        size="1Gi"
    )
    _kale_volume_step_names.append(_kale_marshal_vop.name)
    _kale_volume_name_parameters.append(
        _kale_marshal_vop.outputs["name"].full_name)
    _kale_pvolumes_dict['/marshal'] = _kale_marshal_vop.volume

    _kale_volume_step_names.sort()
    _kale_volume_name_parameters.sort()

    _kale_create_matrix_task = _kale_create_matrix_op(d1, d2)\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after()
    _kale_step_limits = {'nvidia.com/gpu': '2'}
    for _kale_k, _kale_v in _kale_step_limits.items():
        _kale_create_matrix_task.container.add_resource_limit(_kale_k, _kale_v)
    _kale_create_matrix_task.container.working_dir = "/kale"
    _kale_create_matrix_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-metrics': '/tmp/mlpipeline-metrics.json'})
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'create_matrix': '/create_matrix.html'})
    _kale_create_matrix_task.output_artifact_paths.update(
        _kale_output_artifacts)
    _kale_create_matrix_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_create_matrix_task.dependent_names +
                       _kale_volume_step_names)
    _kale_create_matrix_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_create_matrix_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_sum_matrix_task = _kale_sum_matrix_op()\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_create_matrix_task)
    _kale_sum_matrix_task.container.working_dir = "/kale"
    _kale_sum_matrix_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-metrics': '/tmp/mlpipeline-metrics.json'})
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'sum_matrix': '/sum_matrix.html'})
    _kale_sum_matrix_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_sum_matrix_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_sum_matrix_task.dependent_names +
                       _kale_volume_step_names)
    _kale_sum_matrix_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_sum_matrix_task.add_pod_annotation(
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
    experiment = client.create_experiment('hp-tuning')

    # Submit a pipeline run
    from kale.common.kfputils import generate_run_name
    run_name = generate_run_name('hp-test-rnd')
    run_result = client.run_pipeline(
        experiment.id, run_name, pipeline_filename, {})
