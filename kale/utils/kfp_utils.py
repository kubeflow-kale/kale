import tempfile
import importlib.util

from shutil import copyfile

from kfp import Client
from kfp.compiler import Compiler

from kfp_server_api.rest import ApiException


def _get_kfp_client(host=None):
    return Client(host=host)


def get_pipeline_id(pipeline_name, host=None):
    """
    List through the existing pipelines and filter
    by pipeline name

    Args:
        pipeline_name: name of the pipeline
        host: custom host when executing outside of the cluster

    Returns:
        The matching pipeline id. None if not found
    """
    client = _get_kfp_client(host)
    token = ''
    pipeline_id = None
    while pipeline_id is None or token is not None:
        pipelines = client.list_pipelines(page_token=token)
        token = pipelines.next_page_token
        f = next(filter(lambda x: x.name == pipeline_name, pipelines.pipelines), None)
        if f is not None:
            pipeline_id = f.id
    return pipeline_id


def compile_pipeline(pipeline_source, pipeline_name):
    """
    Read in the generated python script and compile it
    to a KFP package
    """
    # create a tmp folder
    tmp_dir = tempfile.mkdtemp()
    # copy generated script to temp dir
    copyfile(pipeline_source, tmp_dir + '/' + "pipeline_code.py")

    spec = importlib.util.spec_from_file_location(tmp_dir.split('/')[-1], tmp_dir + '/' + 'pipeline_code.py')
    foo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(foo)

    # path to generated pipeline package
    pipeline_package = pipeline_name + '.pipeline.tar.gz'
    Compiler().compile(foo.auto_generated_pipeline, pipeline_package)
    return pipeline_package


def upload_pipeline(pipeline_package_path, pipeline_name, overwrite=False, host=None):
    """
    Upload pipeline package to KFP

    Args:
        pipeline_package_path: Path to .tar.gz kfp pipeline
        pipeline_name: Name of the uploaded pipeline
        overwrite: Set to True to overwrite in case a pipeline with the same name already exists
        host: custom host when executing outside of the cluster
    """
    client = _get_kfp_client(host)
    try:
        client.upload_pipeline(pipeline_package_path, pipeline_name=pipeline_name)
    except ApiException as e:
        # The exception is a general 500 error.
        # The only way to check that it refers to the pipeline already existing
        # is by matching the error message
        if overwrite and 'The name {} already exist'.format(pipeline_name) in str(e):
            # Get the id of the existing pipeline
            pipeline_id = get_pipeline_id(pipeline_name, host=host)
            # Delete the existing pipeline and upload the new one
            client._pipelines_api.delete_pipeline(id=pipeline_id)
            client.upload_pipeline(pipeline_package_path, pipeline_name=pipeline_name)
        else:
            # Unexpected exception
            raise


def run_pipeline(run_name, experiment_name, pipeline_package_path, host=None):
    """
    Run pipeline (without uploading) in kfp

    Args:
        run_name: The name of the kfp run
        experiment_name: The name of the kfp experiment
        pipeline_package_path: Path to the .tar.gz package containing the pipeline spec
        host: custom host when executing outside of the cluster

    Returns:
        Pipeline run metadata

    """
    client = _get_kfp_client(host)
    experiment = client.create_experiment(experiment_name)
    # Submit a pipeline run
    run = client.run_pipeline(experiment.id, run_name, pipeline_package_path, {})
    # return the run metadata
    return run


