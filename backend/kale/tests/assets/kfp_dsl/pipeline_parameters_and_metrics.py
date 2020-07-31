import kfp.dsl as dsl
import json
import kfp.components as comp
from collections import OrderedDict
from kubernetes import client as k8s_client


def create_matrix(d1: int, d2: int):
    pipeline_parameters_block = '''
    d1 = {}
    d2 = {}
    '''.format(d1, d2)

    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    block1 = '''
    import numpy as np
    '''

    block2 = '''
    rnd_matrix = np.random.rand(d1, d2)
    '''

    block3 = '''
    from kale.common import kfputils as _kale_kfputils
    _kale_kfp_metrics = {
        "d1": d1,
        "d2": d2
    }
    _kale_kfputils.generate_mlpipeline_metrics(_kale_kfp_metrics)
    '''

    data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    _kale_marshal_utils.save(rnd_matrix, "rnd_matrix")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata
    blocks = (pipeline_parameters_block,
              block1,
              block2,
              block3,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/create_matrix.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('create_matrix')

    _kale_mlmdutils.call("mark_execution_complete")


def sum_matrix():
    from kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale.marshal import utils as _kale_marshal_utils
    _kale_marshal_utils.set_kale_data_directory("/marshal")
    rnd_matrix = _kale_marshal_utils.load("rnd_matrix")
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
    import numpy as np
    '''

    block2 = '''
    sum_result = rnd_matrix.sum()
    '''

    block3 = '''
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
    blocks = (data_loading_block,
              block1,
              block2,
              block3,
              )
    html_artifact = _kale_run_code(blocks)
    with open("/sum_matrix.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('sum_matrix')

    _kale_mlmdutils.call("mark_execution_complete")


create_matrix_op = comp.func_to_container_op(create_matrix)


sum_matrix_op = comp.func_to_container_op(sum_matrix)


@dsl.pipeline(
    name='hp-test-rnd',
    description=''
)
def auto_generated_pipeline(booltest='True', d1='5', d2='6', strtest='test'):
    pvolumes_dict = OrderedDict()
    volume_step_names = []
    volume_name_parameters = []

    marshal_vop = dsl.VolumeOp(
        name="kale-marshal-volume",
        resource_name="kale-marshal-pvc",
        modes=dsl.VOLUME_MODE_RWM,
        size="1Gi"
    )
    volume_step_names.append(marshal_vop.name)
    volume_name_parameters.append(marshal_vop.outputs["name"].full_name)
    pvolumes_dict['/marshal'] = marshal_vop.volume

    volume_step_names.sort()
    volume_name_parameters.sort()

    create_matrix_task = create_matrix_op(d1, d2)\
        .add_pvolumes(pvolumes_dict)\
        .after()
    step_limits = {'nvidia.com/gpu': '2'}
    for k, v in step_limits.items():
        create_matrix_task.container.add_resource_limit(k, v)
    create_matrix_task.container.working_dir = "/kale"
    create_matrix_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update({'mlpipeline-metrics': '/mlpipeline-metrics.json'})
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'create_matrix': '/create_matrix.html'})
    create_matrix_task.output_artifact_paths.update(output_artifacts)
    create_matrix_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    dep_names = create_matrix_task.dependent_names + volume_step_names
    create_matrix_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        create_matrix_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))

    sum_matrix_task = sum_matrix_op()\
        .add_pvolumes(pvolumes_dict)\
        .after(create_matrix_task)
    sum_matrix_task.container.working_dir = "/kale"
    sum_matrix_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update({'mlpipeline-metrics': '/mlpipeline-metrics.json'})
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'sum_matrix': '/sum_matrix.html'})
    sum_matrix_task.output_artifact_paths.update(output_artifacts)
    sum_matrix_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    dep_names = sum_matrix_task.dependent_names + volume_step_names
    sum_matrix_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(dep_names))
    if volume_name_parameters:
        sum_matrix_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(volume_name_parameters))


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
