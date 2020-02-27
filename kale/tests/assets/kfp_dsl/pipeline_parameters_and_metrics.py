import kfp.dsl as dsl
import kfp.components as comp
from collections import OrderedDict
from kubernetes import client as k8s_client


def create_matrix(d1: int, d2: int):
    import os
    import shutil
    from kale.utils import pod_utils as _kale_pod_utils
    from kale.marshal import resource_save as _kale_resource_save
    from kale.marshal import resource_load as _kale_resource_load

    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)

    import numpy as np
    rnd_matrix = np.random.rand(d1, d2)

    # -----------------------DATA SAVING START---------------------------------
    if "rnd_matrix" in locals():
        _kale_resource_save(
            rnd_matrix, os.path.join(_kale_data_directory, "rnd_matrix"))
    else:
        print("_kale_resource_save: `rnd_matrix` not found.")
    # -----------------------DATA SAVING END-----------------------------------


def sum_matrix(d1: int, d2: int):
    import os
    import shutil
    from kale.utils import pod_utils as _kale_pod_utils
    from kale.marshal import resource_save as _kale_resource_save
    from kale.marshal import resource_load as _kale_resource_load

    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)

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
    import numpy as np
    result = rnd_matrix.sum()

    # -----------------------DATA SAVING START---------------------------------
    if "result" in locals():
        _kale_resource_save(
            result, os.path.join(_kale_data_directory, "result"))
    else:
        print("_kale_resource_save: `result` not found.")
    # -----------------------DATA SAVING END-----------------------------------


def pipeline_metrics(d1: int, d2: int):
    import os
    import shutil
    from kale.utils import pod_utils as _kale_pod_utils
    from kale.marshal import resource_save as _kale_resource_save
    from kale.marshal import resource_load as _kale_resource_load

    _kale_data_directory = "/marshal"
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)

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


create_matrix_op = comp.func_to_container_op(create_matrix)


sum_matrix_op = comp.func_to_container_op(sum_matrix)


pipeline_metrics_op = comp.func_to_container_op(pipeline_metrics)


@dsl.pipeline(
    name='hp-test-rnd',
    description=''
)
def auto_generated_pipeline(d1='5', d2='6'):
    pvolumes_dict = OrderedDict()

    marshal_vop = dsl.VolumeOp(
        name="kale_marshal_volume",
        resource_name="kale-marshal-pvc",
        modes=dsl.VOLUME_MODE_RWM,
        size="1Gi"
    )
    pvolumes_dict['/marshal'] = marshal_vop.volume

    create_matrix_task = create_matrix_op(d1, d2)\
        .add_pvolumes(pvolumes_dict)\
        .after()
    create_matrix_task.container.working_dir = "/kale"
    create_matrix_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))

    sum_matrix_task = sum_matrix_op(d1, d2)\
        .add_pvolumes(pvolumes_dict)\
        .after(create_matrix_task)
    sum_matrix_task.container.working_dir = "/kale"
    sum_matrix_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))

    pipeline_metrics_task = pipeline_metrics_op(d1, d2)\
        .add_pvolumes(pvolumes_dict)\
        .after(sum_matrix_task)
    pipeline_metrics_task.container.working_dir = "/kale"
    pipeline_metrics_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    pipeline_metrics_task.output_artifact_paths.update(
        {'mlpipeline-metrics': '/mlpipeline-metrics.json'})


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
