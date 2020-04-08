#  Copyright 2019-2020 The Kale Authors
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
import os
import json
import tempfile
import importlib.util

from shutil import copyfile

from kfp import Client
from kfp.compiler import Compiler
from kfp_server_api.rest import ApiException

from kale.utils import utils, pod_utils


def _get_kfp_client(host=None):
    return Client(host=host)


def get_pipeline_id(pipeline_name, host=None):
    """List through the existing pipelines and filter by pipeline name.

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
        f = next(
            filter(lambda x: x.name == pipeline_name, pipelines.pipelines),
            None)
        if f is not None:
            pipeline_id = f.id
    return pipeline_id


def compile_pipeline(pipeline_source, pipeline_name):
    """Read in the generated python script and compile it to a KFP package."""
    # create a tmp folder
    tmp_dir = tempfile.mkdtemp()
    # copy generated script to temp dir
    copyfile(pipeline_source, tmp_dir + '/' + "pipeline_code.py")

    path = tmp_dir + '/' + 'pipeline_code.py'
    spec = importlib.util.spec_from_file_location(tmp_dir.split('/')[-1], path)
    foo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(foo)

    # path to generated pipeline package
    pipeline_package = pipeline_name + '.pipeline.tar.gz'
    Compiler().compile(foo.auto_generated_pipeline, pipeline_package)
    return pipeline_package


def upload_pipeline(pipeline_package_path, pipeline_name, overwrite=False,
                    host=None):
    """Upload pipeline package to KFP.

    Args:
        pipeline_package_path: Path to .tar.gz kfp pipeline
        pipeline_name: Name of the uploaded pipeline
        overwrite: Set to True to overwrite in case a pipeline with the same
        name already exists
        host: custom host when executing outside of the cluster
    """
    client = _get_kfp_client(host)
    try:
        client.upload_pipeline(pipeline_package_path,
                               pipeline_name=pipeline_name)
    except ApiException as e:
        # The exception is a general 500 error.
        # The only way to check that it refers to the pipeline already existing
        # is by matching the error message
        exc_msg = 'The name {} already exist'.format(pipeline_name)
        if overwrite and exc_msg in str(e):
            # Get the id of the existing pipeline
            pipeline_id = get_pipeline_id(pipeline_name, host=host)
            # Delete the existing pipeline and upload the new one
            client._pipelines_api.delete_pipeline(id=pipeline_id)
            client.upload_pipeline(pipeline_package_path,
                                   pipeline_name=pipeline_name)
        else:
            # Unexpected exception
            raise


def run_pipeline(run_name, experiment_name, pipeline_package_path, host=None):
    """Run pipeline (without uploading) in kfp.

    Args:
        run_name: The name of the kfp run
        experiment_name: The name of the kfp experiment
        pipeline_package_path: Path to the .tar.gz package containing the
        pipeline spec
        host: custom host when executing outside of the cluster

    Returns:
        Pipeline run metadata
    """
    client = _get_kfp_client(host)
    experiment = client.create_experiment(experiment_name)
    # Submit a pipeline run
    run = client.run_pipeline(experiment.id, run_name, pipeline_package_path,
                              {})
    # return the run metadata
    return run


def generate_run_name(pipeline_name: str):
    """Generate a new run name based on pipeline name."""
    return "{}_run-{}".format(pipeline_name, utils.random_string(5))


def update_uimetadata(artifact_name,
                      uimetadata_path='/mlpipeline-ui-metadata.json'):
    """Update ui-metadata dictionary with a new web-app entry.

    Args:
        artifact_name: Name of the artifact
        uimetadata_path: path to mlpipeline-ui-metadata.json
    """
    # Default empty ui-metadata dict
    outputs = {"outputs": []}
    if os.path.exists(uimetadata_path):
        try:
            outputs = json.loads(
                open(uimetadata_path, 'r').read())
            if not outputs.get('outputs', None):
                outputs['outputs'] = []
        except json.JSONDecodeError as e:
            print("Failed to parse json file {}: {}\n"
                  "This step will not be able to visualize artifacts in the"
                  " KFP UI".format(uimetadata_path, e))

    pod_name = pod_utils.get_pod_name()
    namespace = pod_utils.get_namespace()
    workflow_name = pod_utils.get_workflow_name(pod_name, namespace)
    html_artifact_entry = [{
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/{}/{}/{}'.format(
            workflow_name, pod_name, artifact_name + '.tgz')
    }]
    outputs['outputs'] += html_artifact_entry
    with open(uimetadata_path, "w") as f:
        json.dump(outputs, f)


def generate_mlpipeline_metrics(metrics):
    """Generate a /mlpipeline-metrics.json file.

    Args:
        metrics (dict): a dictionary where the key is the metric name and the
            value is its value.
    """
    metadata = list()
    for name, value in metrics.items():
        if not isinstance(value, (int, float)):
            try:
                value = float(value)
            except ValueError:
                print("Variable {} with type {} not supported as pipeline"
                      " metric. Can only write `int` or `float` types as"
                      " pipeline metrics".format(name, type(value)))
                continue
        metadata.append({
            'name': name,
            'numberValue': value,
            'format': "RAW",
        })

    with open('/mlpipeline-metrics.json', 'w') as f:
        json.dump({'metrics': metadata}, f)


def get_experiment_from_run_id(run_id: str):
    """Retrieve the experiment in which a run belongs.

    Returns: ApiExperiment - the KFP Experiment which owns the run
    """
    client = _get_kfp_client()
    run = client.runs.get_run(run_id=run_id).run
    experiment_id = None
    type_experiment = client.api_models.ApiResourceType.EXPERIMENT
    relationship_owner = client.api_models.ApiRelationship.OWNER
    for ref in run.resource_references:
        if (ref.relationship == relationship_owner
                and ref.key.type == type_experiment):
            experiment_id = ref.key.id
    # NOTE: It is safe to assume that a resource reference of type EXPERIMENT
    # exists, as well as an experiment with that ID
    return client.experiments.get_experiment(id=experiment_id)
