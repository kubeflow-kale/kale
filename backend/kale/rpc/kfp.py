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

import kfp
from kfp_server_api.rest import ApiException

from kale.utils import kfp_utils

_client = None


def _get_client(host=None):
    global _client

    if _client is None:
        _client = kfp.Client()

    return _client


def list_experiments(request):
    """List Kubeflow Pipelines experiments."""
    c = _get_client()
    experiments = [{"name": e.name,
                    "id": e.id}
                   for e in c.list_experiments().experiments or []]
    return experiments


def get_experiment(request, experiment_name):
    """Get a KFP experiment. If it does not exist return None."""
    client = _get_client()
    try:
        experiment = client.get_experiment(experiment_name=experiment_name)
    except ValueError as e:
        err_msg = "No experiment is found with name {}".format(experiment_name)
        if err_msg in str(e):
            return None
        else:
            # Unexpected exception
            raise
    return {"id": experiment.id, "name": experiment.name}


def create_experiment(request, experiment_name, raise_if_exists=False):
    """Create a new experiment."""
    client = _get_client()
    exp = get_experiment(None, experiment_name)
    if not exp:
        experiment = client.create_experiment(name=experiment_name)
        return {"id": experiment.id, "name": experiment.name}
    if raise_if_exists:
        raise ValueError("Failed to create experiment, experiment already"
                         " exists.")


def _get_pipeline_id(pipeline_name):
    client = _get_client()
    token = ""
    pipeline_id = None
    while pipeline_id is None or token is not None:
        pipelines = client.list_pipelines(page_token=token)
        token = pipelines.next_page_token
        f = next(filter(lambda x: x.name == pipeline_name,
                        pipelines.pipelines),
                 None)
        if f is not None:
            pipeline_id = f.id
    return pipeline_id


def upload_pipeline(request, pipeline_package_path, pipeline_metadata,
                    overwrite=False):
    """Upload a KFP package as a new pipeline."""
    client = _get_client()
    pipeline_name = pipeline_metadata["pipeline_name"]
    try:
        pipeline = client.upload_pipeline(pipeline_package_path, pipeline_name)
        return {"already_exists": False,
                "pipeline": {"id": pipeline.id, "name": pipeline.name}}
    except ApiException as e:
        # The exception is a general 500 error.
        # The only way to check that it refers to the pipeline already existing
        # is by matching the error message
        if "The name {} already exist".format(pipeline_name) in str(e):
            if overwrite:
                # Get the id of the existing pipeline
                pipeline_id = _get_pipeline_id(pipeline_name)
                # Delete the existing pipeline and upload the new one
                client._pipelines_api.delete_pipeline(id=pipeline_id)
                pipeline = client.upload_pipeline(pipeline_package_path,
                                                  pipeline_name)
                return {"already_exists": True,
                        "pipeline": {"id": pipeline.id, "name": pipeline.name}}
            else:
                return {"already_exists": True, "pipeline": None}
        else:
            # Unexpected exception
            raise


def run_pipeline(request, pipeline_metadata, pipeline_package_path=None,
                 pipeline_id=None):
    """Run a pipeline."""
    client = _get_client(pipeline_metadata.get("kfp_host", None))
    experiment = client.create_experiment(pipeline_metadata["experiment_name"])
    run_name = kfp_utils.generate_run_name(pipeline_metadata["pipeline_name"])
    run = client.run_pipeline(experiment.id, run_name,
                              pipeline_package_path=pipeline_package_path,
                              pipeline_id=pipeline_id)
    return {"id": run.id, "name": run.name, "status": run.status}


def get_run(request, run_id):
    """Get an existing run's details."""
    client = _get_client()
    run = client.get_run(run_id).run
    return {"id": run.id, "name": run.name, "status": run.status}
