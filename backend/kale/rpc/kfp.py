# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import kfp

from kale.common import kfputils


def _get_client(host=None):
    return kfp.Client()


def list_experiments(request):
    """List Kubeflow Pipelines experiments."""
    c = _get_client()
    experiments = [{"name": e.display_name,
                    "id": e.experiment_id}
                   for e in c.list_experiments().experiments or []]
    return experiments


def get_ui_host(request):
    """Get a UI Host. If it does not exist return None."""
    c = _get_client()
    host = getattr(c, "_uihost", None) or getattr(c, "host", None)
    return host


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
    except TypeError as e:
        # In case the installed KFP client does not contain the following fix:
        # https://github.com/kubeflow/pipelines/pull/4177
        err_msg = "'NoneType' object is not iterable"
        if err_msg in str(e):
            return None
        raise
    return {"id": experiment.experiment_id, "name": experiment.display_name}


def create_experiment(request, experiment_name, raise_if_exists=False):
    """Create a new experiment."""
    client = _get_client()
    exp = get_experiment(None, experiment_name)
    if not exp:
        experiment = client.create_experiment(name=experiment_name)
        return {
            "id": experiment.experiment_id,
            "name": experiment.display_name
        }
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
        f = next(filter(lambda x: x.display_name == pipeline_name,
                        pipelines.pipelines),
                 None)
        if f is not None:
            pipeline_id = f.pipeline_id
    return pipeline_id


def upload_pipeline(request, pipeline_package_path, pipeline_metadata):
    """Upload a KFP package as a new pipeline."""
    pipeline_name = pipeline_metadata["pipeline_name"]
    pid, vid = kfputils.upload_pipeline(pipeline_package_path,
                                        pipeline_name)
    return {"pipeline": {"pipelineid": pid, "versionid": vid,
                         "name": pipeline_name}}


def run_pipeline(
    request,
    pipeline_metadata,
    pipeline_id,
    version_id,
    pipeline_package_path
):
    """Run a pipeline."""
    run = kfputils.run_pipeline(
        experiment_name=pipeline_metadata["experiment_name"],
        pipeline_id=pipeline_id,
        version_id=version_id,
        pipeline_package_path=pipeline_package_path)

    return {
        "id": run.run_id,
        "name": run.run_info.display_name,
        "status": run.run_info.state
    }


def get_run(request, run_id):
    """Get an existing run's details."""
    client = _get_client()
    run = client.get_run(run_id)
    return {"id": run.run_id, "name": run.display_name, "status": run.state}
