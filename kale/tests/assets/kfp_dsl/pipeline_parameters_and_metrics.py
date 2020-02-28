import kfp.dsl as dsl
import kfp.components as comp
from collections import OrderedDict
from kubernetes import client as k8s_client


def create_matrix(d1: int, d2: int, booltest: bool, strtest: str):
    pipeline_parameters_block = '''
    d1 = {}
    d2 = {}
    booltest = {}
    strtest = "{}"
    '''.format(d1, d2, booltest, strtest)

    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    block1 = '''
    import numpy as np
    '''

    block2 = '''
    rnd_matrix = np.random.rand(d1, d2)
    '''

    data_saving_block = '''
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "rnd_matrix" in locals():
        _kale_resource_save(
            rnd_matrix, os.path.join(_kale_data_directory, "rnd_matrix"))
    else:
        print("_kale_resource_save: `rnd_matrix` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, pipeline_parameters_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/create_matrix.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('create_matrix')


def sum_matrix(d1: int, d2: int, booltest: bool, strtest: str):
    pipeline_parameters_block = '''
    d1 = {}
    d2 = {}
    booltest = {}
    strtest = "{}"
    '''.format(d1, d2, booltest, strtest)

    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "rnd_matrix" not in _kale_directory_file_names:
        raise ValueError("rnd_matrix" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "rnd_matrix")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("rnd_matrix", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    rnd_matrix = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
    import numpy as np
    '''

    block2 = '''
    result = rnd_matrix.sum()
    '''

    data_saving_block = '''
    import os
    from kale.marshal import resource_save as _kale_resource_save
    # -----------------------DATA SAVING START---------------------------------
    if "result" in locals():
        _kale_resource_save(
            result, os.path.join(_kale_data_directory, "result"))
    else:
        print("_kale_resource_save: `result` not found.")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, pipeline_parameters_block, data_loading_block,
              block1,
              block2,
              data_saving_block)
    html_artifact = _kale_run_code(blocks)
    with open("/sum_matrix.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('sum_matrix')


def pipeline_metrics(d1: int, d2: int, booltest: bool, strtest: str):
    pipeline_parameters_block = '''
    d1 = {}
    d2 = {}
    booltest = {}
    strtest = "{}"
    '''.format(d1, d2, booltest, strtest)

    data_dir_block = '''
    import os
    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
    '''

    data_loading_block = '''
    import os
    from kale.marshal import resource_load as _kale_resource_load

    # -----------------------DATA LOADING START--------------------------------
    _kale_directory_file_names = [
        os.path.splitext(f)[0]
        for f in os.listdir(_kale_data_directory)
        if os.path.isfile(os.path.join(_kale_data_directory, f))
    ]
    if "result" not in _kale_directory_file_names:
        raise ValueError("result" + " does not exists in directory")
    _kale_load_file_name = [
        f
        for f in os.listdir(_kale_data_directory)
        if (os.path.isfile(os.path.join(_kale_data_directory, f)) and
            os.path.splitext(f)[0] == "result")
    ]
    if len(_kale_load_file_name) > 1:
        raise ValueError("Found multiple files with name %s: %s"
                         % ("result", str(_kale_load_file_name)))
    _kale_load_file_name = _kale_load_file_name[0]
    result = _kale_resource_load(
        os.path.join(_kale_data_directory, _kale_load_file_name))
    # -----------------------DATA LOADING END----------------------------------
    '''

    block1 = '''
    import json

    metrics_metadata = list()
    metrics = {
    "d1": d1,
    "d2": d2,
    "result": result,
    }

    for k in metrics:
        if isinstance(metrics[k], (int, float)):
            metric = metrics[k]
        else:
            try:
                metric = float(metrics[k])
            except ValueError:
                print("Variable {} with type {} not supported as pipeline"
                      " metric. Can only write `int` or `float` types as"
                      " pipeline metrics".format(k, type(k)))
                continue
        metrics_metadata.append({
                    'name': k,
                    'numberValue': metric,
                    'format': "RAW",
                })

    with open('/mlpipeline-metrics.json', 'w') as f:
        json.dump({'metrics': metrics_metadata}, f)
    '''

    # run the code blocks inside a jupyter kernel
    from kale.utils.jupyter_utils import run_code as _kale_run_code
    from kale.utils.jupyter_utils import update_uimetadata as _kale_update_uimetadata
    blocks = (data_dir_block, pipeline_parameters_block, data_loading_block,
              block1,
              )
    html_artifact = _kale_run_code(blocks)
    with open("/pipeline_metrics.html", "w") as f:
        f.write(html_artifact)
    _kale_update_uimetadata('pipeline_metrics')


create_matrix_op = comp.func_to_container_op(create_matrix)


sum_matrix_op = comp.func_to_container_op(sum_matrix)


pipeline_metrics_op = comp.func_to_container_op(pipeline_metrics)


@dsl.pipeline(
    name='hp-test-rnd',
    description=''
)
def auto_generated_pipeline(d1='5', d2='6', booltest='True', strtest='test'):
    pvolumes_dict = OrderedDict()

    marshal_vop = dsl.VolumeOp(
        name="kale_marshal_volume",
        resource_name="kale-marshal-pvc",
        modes=dsl.VOLUME_MODE_RWM,
        size="1Gi"
    )
    pvolumes_dict['/marshal'] = marshal_vop.volume

    create_matrix_task = create_matrix_op(d1, d2, booltest, strtest)\
        .add_pvolumes(pvolumes_dict)\
        .after()
    create_matrix_task.container.working_dir = "/kale"
    create_matrix_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'create_matrix': '/create_matrix.html'})
    create_matrix_task.output_artifact_paths.update(output_artifacts)

    sum_matrix_task = sum_matrix_op(d1, d2, booltest, strtest)\
        .add_pvolumes(pvolumes_dict)\
        .after(create_matrix_task)
    sum_matrix_task.container.working_dir = "/kale"
    sum_matrix_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update(
        {'mlpipeline-ui-metadata': '/mlpipeline-ui-metadata.json'})
    output_artifacts.update({'sum_matrix': '/sum_matrix.html'})
    sum_matrix_task.output_artifact_paths.update(output_artifacts)

    pipeline_metrics_task = pipeline_metrics_op(d1, d2, booltest, strtest)\
        .add_pvolumes(pvolumes_dict)\
        .after(sum_matrix_task)
    pipeline_metrics_task.container.working_dir = "/kale"
    pipeline_metrics_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    output_artifacts = {}
    output_artifacts.update({'mlpipeline-metrics': '/mlpipeline-metrics.json'})
    pipeline_metrics_task.output_artifact_paths.update(output_artifacts)


if __name__ == "__main__":
    pipeline_func = auto_generated_pipeline
    pipeline_filename = pipeline_func.__name__ + '.pipeline.tar.gz'
    import kfp.compiler as compiler
    compiler.Compiler().compile(pipeline_func, pipeline_filename)

    # Get or create an experiment and submit a pipeline run
    import kfp
    client = kfp.Client()
    experiment = client.create_experiment('hp tuning')

    # Submit a pipeline run
    run_name = 'hp-test-rnd_run'
    run_result = client.run_pipeline(
        experiment.id, run_name, pipeline_filename, {})
