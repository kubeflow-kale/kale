import json

import kfp.dsl as _kfp_dsl
import kfp.components as _kfp_components


from collections import OrderedDict
from kubernetes import client as k8s_client


# Add imports for KFP DSL Input/Output and Artifact types
from kfp.dsl import Input, Output  # Only import once

from kfp.dsl import Dataset

from kfp.dsl import Model

from kfp.dsl import Metrics

from kfp.dsl import ClassificationMetrics

from kfp.dsl import Artifact

from kfp.dsl import HTML


@_kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def sack():
    # This block populates pipeline parameters. If these are also component args,
    # then they will be overwritten by values passed as args.
    _kale_pipeline_parameters_block = '''
    '''

    from backend.kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import random
    '''

    _kale_block2 = '''
    def get_handful(left):
    if left == 0:
        print("There are no candies left! I want to cry :(")
        return 0
    c = random.randint(1, left)
    print("I got %s candies!" % c)
    return c
    '''

    _kale_block3 = '''
    print("Let's put in a bag %s candies and have three kids get a handful of them each" % CANDIES)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from backend.kale.common.jputils import run_code as _kale_run_code
    from backend.kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata

    _kale_blocks = (
        _kale_pipeline_parameters_block,
        _kale_data_loading_block,

        _kale_block1,
        _kale_block2,
        _kale_block3,
        _kale_data_saving_block
    )

    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/sack.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('sack')

    _kale_mlmdutils.call("mark_execution_complete")


# Add imports for KFP DSL Input/Output and Artifact types


@_kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def kid1(kid1: Output[Dataset]):
    # This block populates pipeline parameters. If these are also component args,
    # then they will be overwritten by values passed as args.
    _kale_pipeline_parameters_block = '''
    '''

    from backend.kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import random
    '''

    _kale_block2 = '''
    def get_handful(left):
    if left == 0:
        print("There are no candies left! I want to cry :(")
        return 0
    c = random.randint(1, left)
    print("I got %s candies!" % c)
    return c
    '''

    _kale_block3 = '''
    # kid1 gets a handful, without looking in the bad!
kid1 = get_handful(CANDIES)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from backend.kale.common.jputils import run_code as _kale_run_code
    from backend.kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata

    _kale_blocks = (
        _kale_pipeline_parameters_block,
        _kale_data_loading_block,

        _kale_block1,
        _kale_block2,
        _kale_block3,
        _kale_data_saving_block
    )

    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/kid1.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('kid1')

    _kale_mlmdutils.call("mark_execution_complete")

    return kid1


# Add imports for KFP DSL Input/Output and Artifact types


@_kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def kid2(kid1: Output[Dataset], kid2: Output[Dataset]):
    # This block populates pipeline parameters. If these are also component args,
    # then they will be overwritten by values passed as args.
    _kale_pipeline_parameters_block = '''
    '''

    from backend.kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import random
    '''

    _kale_block2 = '''
    def get_handful(left):
    if left == 0:
        print("There are no candies left! I want to cry :(")
        return 0
    c = random.randint(1, left)
    print("I got %s candies!" % c)
    return c
    '''

    _kale_block3 = '''
    kid2 = get_handful(CANDIES - kid1)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from backend.kale.common.jputils import run_code as _kale_run_code
    from backend.kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata

    _kale_blocks = (
        _kale_pipeline_parameters_block,
        _kale_data_loading_block,

        _kale_block1,
        _kale_block2,
        _kale_block3,
        _kale_data_saving_block
    )

    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/kid2.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('kid2')

    _kale_mlmdutils.call("mark_execution_complete")

    return kid1, kid2


# Add imports for KFP DSL Input/Output and Artifact types


@_kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def kid3(kid1: Output[Dataset], kid2: Output[Dataset]):
    # This block populates pipeline parameters. If these are also component args,
    # then they will be overwritten by values passed as args.
    _kale_pipeline_parameters_block = '''
    '''

    from backend.kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import random
    '''

    _kale_block2 = '''
    def get_handful(left):
    if left == 0:
        print("There are no candies left! I want to cry :(")
        return 0
    c = random.randint(1, left)
    print("I got %s candies!" % c)
    return c
    '''

    _kale_block3 = '''
    kid3 = get_handful(CANDIES - kid1 - kid2)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from backend.kale.common.jputils import run_code as _kale_run_code
    from backend.kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata

    _kale_blocks = (
        _kale_pipeline_parameters_block,
        _kale_data_loading_block,

        _kale_block1,
        _kale_block2,
        _kale_block3,
        _kale_data_saving_block
    )

    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open("/kid3.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('kid3')

    _kale_mlmdutils.call("mark_execution_complete")

    return kid1, kid2


_kale_sack_op = _kfp_components.func_to_container_op(sack)


_kale_kid1_op = _kfp_components.func_to_container_op(kid1)


_kale_kid2_op = _kfp_components.func_to_container_op(kid2)


_kale_kid3_op = _kfp_components.func_to_container_op(kid3)


@_kfp_dsl.pipeline(
    name='kale-pipeline',
    description='Share some candies between three lovely kids'
)
def auto_generated_pipeline(CANDIES="20"):

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

    _kale_sack_task = _kale_sack_op(CANDIES)\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after()
    _kale_sack_task.container.working_dir = "D:\Projects\kale\examples\base"
    _kale_sack_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'sack': '/sack.html'})
    _kale_sack_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_sack_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_sack_task.dependent_names +
                       _kale_volume_step_names)
    _kale_sack_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_sack_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_kid1_task = _kale_kid1_op(CANDIES)\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_sack_task)
    _kale_kid1_task.container.working_dir = "D:\Projects\kale\examples\base"
    _kale_kid1_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'kid1': '/kid1.html'})
    _kale_kid1_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_kid1_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_kid1_task.dependent_names +
                       _kale_volume_step_names)
    _kale_kid1_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_kid1_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_kid2_task = _kale_kid2_op(CANDIES)\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_kid1_task)
    _kale_kid2_task.container.working_dir = "D:\Projects\kale\examples\base"
    _kale_kid2_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'kid2': '/kid2.html'})
    _kale_kid2_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_kid2_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_kid2_task.dependent_names +
                       _kale_volume_step_names)
    _kale_kid2_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_kid2_task.add_pod_annotation(
            "kubeflow-kale.org/volume-name-parameters",
            json.dumps(_kale_volume_name_parameters))

    _kale_kid3_task = _kale_kid3_op(CANDIES)\
        .add_pvolumes(_kale_pvolumes_dict)\
        .after(_kale_kid2_task)
    _kale_kid3_task.container.working_dir = "D:\Projects\kale\examples\base"
    _kale_kid3_task.container.set_security_context(
        k8s_client.V1SecurityContext(run_as_user=0))
    _kale_output_artifacts = {}
    _kale_output_artifacts.update(
        {'mlpipeline-ui-metadata': '/tmp/mlpipeline-ui-metadata.json'})
    _kale_output_artifacts.update({'kid3': '/kid3.html'})
    _kale_kid3_task.output_artifact_paths.update(_kale_output_artifacts)
    _kale_kid3_task.add_pod_label(
        "pipelines.kubeflow.org/metadata_written", "true")
    _kale_dep_names = (_kale_kid3_task.dependent_names +
                       _kale_volume_step_names)
    _kale_kid3_task.add_pod_annotation(
        "kubeflow-kale.org/dependent-templates", json.dumps(_kale_dep_names))
    if _kale_volume_name_parameters:
        _kale_kid3_task.add_pod_annotation(
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
    experiment = client.create_experiment('Kale-Pipeline-Experiment')

    # Submit a pipeline run
    from backend.kale.common import kfputils
    pipeline_id, version_id = kfputils.upload_pipeline(
        pipeline_filename, "kale-pipeline")
    run_result = kfputils.run_pipeline(
        experiment_name=experiment.name, pipeline_id=pipeline_id, version_id=version_id)
