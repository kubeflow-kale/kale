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
import sys
import json
import time
import logging
import tempfile
import importlib.util

from shutil import copyfile

from kfp import Client
from kfp.compiler import Compiler
from kfp_server_api.rest import ApiException

from kale.common import utils, podutils, workflowutils, katibutils


KFP_RUN_ID_LABEL_KEY = "pipeline/runid"
KFP_RUN_FINAL_STATES = ["Succeeded", "Skipped", "Failed", "Error"]
KFP_UI_METADATA_FILE_PATH = "/tmp/mlpipeline-ui-metadata.json"
KFP_UI_METRICS_FILE_PATH = "/tmp/mlpipeline-metrics.json"
KALE_KATIB_KFP_ANNOTATION = "kubeflow-kale.org/kfp-run-uuid"

_logger = None

log = logging.getLogger(__name__)


def _get_kfp_client(host=None, namespace: str = "kubeflow"):
    return Client(host=host, namespace=namespace)


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
    pipeline_package = os.path.join(os.path.dirname(pipeline_source),
                                    pipeline_name + '.pipeline.yaml')
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


def get_current_uimetadata(uimetadata_path=KFP_UI_METADATA_FILE_PATH,
                           default_if_not_exist=False):
    """Parse the current UI metadata file and return its contents as dict.

    Args:
        uimetadata_path: The path to the mlpipeline-ui-metadata.json file
        default_if_not_exist: set to True to return an empty uimetadata
            file (i.e. `{"outputs": []}`) in case it does not exist
    """
    default_ui_metadata = {"outputs": []}
    try:
        outputs = utils.read_json_from_file(uimetadata_path)
    except FileNotFoundError:
        if default_if_not_exist:
            return default_ui_metadata
        raise
    except json.JSONDecodeError:
        log.error("Could not JSON parse the ui metadata file as it is"
                  " malformed.")
        raise

    if not outputs.get("outputs"):
        outputs["outputs"] = []
    return outputs


def update_uimetadata(artifact_name,
                      uimetadata_path=KFP_UI_METADATA_FILE_PATH):
    """Update ui-metadata dictionary with a new web-app entry.

    Args:
        artifact_name: Name of the artifact
        uimetadata_path: path to mlpipeline-ui-metadata.json
    """
    try:
        outputs = get_current_uimetadata(uimetadata_path,
                                         default_if_not_exist=True)
    except json.JSONDecodeError:
        log.error("This step will not be able to visualize artifacts in the"
                  " KFP UI")
        return

    pod_name = podutils.get_pod_name()
    namespace = podutils.get_namespace()
    workflow_name = workflowutils.get_workflow_name(pod_name, namespace)
    html_artifact_entry = [{
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/{}/{}/{}'.format(
            workflow_name, pod_name, artifact_name + '.tgz')
    }]
    outputs['outputs'] += html_artifact_entry

    try:
        utils.ensure_or_create_dir(uimetadata_path)
    except RuntimeError:
        log.exception("Writing to '%s' failed. This step will not be able to"
                      " visualize artifacts in the KFP UI.", uimetadata_path)
        return
    with open(uimetadata_path, "w") as f:
        json.dump(outputs, f)


def generate_mlpipeline_metrics(metrics):
    """Generate a KFP_UI_METRICS_FILE_PATH file.

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

    try:
        utils.ensure_or_create_dir(KFP_UI_METRICS_FILE_PATH)
    except RuntimeError:
        log.exception("Writing to '%s' failed. This step will not be able to"
                      " show metrics in the KFP UI.", KFP_UI_METRICS_FILE_PATH)
        return
    with open(KFP_UI_METRICS_FILE_PATH, 'w') as f:
        json.dump({'metrics': metadata}, f)


def get_experiment_from_run_id(run_id: str):
    """Retrieve the experiment in which a run belongs.

    Returns: ApiExperiment - the KFP Experiment which owns the run
    """
    log.info("Getting experiment from run with ID '%s'...", run_id)
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
    log.info("Successfully retrieved experiment ID: %s", experiment_id)
    return client.experiments.get_experiment(id=experiment_id)


def get_run(run_id: str, host: str = None, namespace: str = "kubeflow"):
    """Retrieve KFP run based on RunID."""
    client = _get_kfp_client(host, namespace)
    return client.get_run(run_id)


# TODO: Use a global setup logging function
def _get_logger():
    """Setup logging."""
    global _logger
    if not _logger:
        fmt = "%(asctime)s %(module)s:%(lineno)d [%(levelname)s] %(message)s"
        datefmt = "%Y-%m-%dT%H:%M:%SZ"
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.DEBUG)
        stream_handler.setFormatter(logging.Formatter(fmt, datefmt))

        _logger = logging.getLogger(__name__)
        _logger.propagate = 0
        _logger.setLevel(logging.DEBUG)
        _logger.addHandler(stream_handler)
    return _logger


def _create_kfp_run(pipeline_id: str, run_name: str, version_id: str = None,
                    experiment_name: str = "Default",
                    namespace: str = "kubeflow", **kwargs):
    """Create a KFP run from a KFP pipeline with custom arguments.

    Args:
        pipeline_id: KFP pipeline
        version_id: KFP pipeline's version (optional, not supported yet)
        experiment_name: KFP experiment to create run in. (default: "Default")
        namespace: Namespace of KFP deployment
        kwargs: All the parameters the pipeline will be fed with

    Returns:
        run_id: ID of the created KFP run
    """
    kfp_client = _get_kfp_client(namespace=namespace)

    if not pipeline_id:
        raise ValueError("You must provide pipeline_id.")

    experiment = kfp_client.create_experiment(experiment_name)
    run = kfp_client.run_pipeline(experiment_id=experiment.id,
                                  job_name=run_name,
                                  pipeline_id=pipeline_id,
                                  # XXX: kfp-server-api==0.1.18.3 is the only
                                  # version that does work, but we cannot set
                                  # namespace in that old version
                                  # namespace=namespace,
                                  params=kwargs)

    return run.id


def _wait_kfp_run(run_id: str):
    """Wait for a KFP run to complete.

    Args:
        run_id: ID of the created KFP run
        namespace: Namespace of KFP deployment

    Returns:
        status: Status of KFP run upon completion
    """
    logger = _get_logger()

    logger.info("Watching for Run with ID: '%s'", run_id)

    while True:
        time.sleep(30)

        run = get_run(run_id)
        status = run.run.status
        logger.info("Run status: %s", status)

        if status not in KFP_RUN_FINAL_STATES:
            continue

        return status


def _get_kfp_run_metrics(run_id: str, namespace: str = "kubeflow"):
    """Retrieve output metrics of a KFP run.

    We sleep() and try multiple times to make sure that the KFP persistence
    agent has reported run metrics.

    Args:
        run_id: ID of the created KFP run
        namespace: Namespace of KFP deployment
    Returns:
        metrics: Dict of metrics along with their values
    """
    logger = _get_logger()

    run_metrics = None
    max_tries = 3
    tries = 0
    while not run_metrics:
        if tries >= max_tries:
            return {}
        time.sleep(5)
        logger.info("Try %d: Checking for run metrics...", tries)
        run = get_run(run_id=run_id)
        run_metrics = run.run.metrics
        tries += 1

    logger.info("Found run metrics!")
    return {metric.name: metric.number_value for metric in run_metrics}


def create_and_wait_kfp_run(pipeline_id: str, run_name: str,
                            version_id: str = None,
                            experiment_name: str = "Default",
                            namespace: str = "kubeflow", **kwargs):
    """Create a KFP run, wait for it to complete and retrieve its metrics.

    Create a KFP run from a KFP pipeline with custom arguments and wait for
    it to finish. If it succeeds, return its metrics.

    Args:
        pipeline_id: KFP pipeline
        version_id: KFP pipeline's version (optional, not supported yet)
        experiment_name: KFP experiment to create run in. (default: "Default")
        namespace: Namespace of KFP deployment
        kwargs: All the parameters the pipeline will be fed with

    Returns:
        metrics: Dict of metrics along with their values
    """
    logger = _get_logger()

    pod_namespace = podutils.get_namespace()

    run_id = _create_kfp_run(pipeline_id, run_name, version_id,
                             experiment_name, namespace, **kwargs)

    logger.info("Annotating Trial '%s' with the KFP Run UUID '%s'...",
                run_name, run_id)
    try:
        # Katib Trial name == KFP Run name by design (see rpc.katib)
        katibutils.annotate_trial(run_name, pod_namespace,
                                  {KALE_KATIB_KFP_ANNOTATION: run_id})
    except Exception:
        logger.exception("Failed to annotate Trial '%s' with the KFP Run UUID"
                         " '%s'", run_name, run_id)

    logger.info("Getting Workflow name for run '%s'...", run_id)
    workflow_name = _get_workflow_from_run(get_run(run_id))["metadata"]["name"]
    logger.info("Workflow name: %s", workflow_name)
    logger.info("Getting the Katib trial...")
    trial = katibutils.get_trial(run_name, pod_namespace)
    logger.info("Trial name: %s, UID: %s", trial["metadata"]["name"],
                trial["metadata"]["uid"])
    logger.info("Getting owner Katib experiment of trial...")
    exp_name, exp_id = katibutils.get_owner_experiment_from_trial(trial)
    logger.info("Experiment name: %s, UID: %s", exp_name, exp_id)
    wf_annotations = {
        katibutils.EXPERIMENT_NAME_ANNOTATION_KEY: exp_name,
        katibutils.EXPERIMENT_ID_ANNOTATION_KEY: exp_id,
        katibutils.TRIAL_NAME_ANNOTATION_KEY: trial["metadata"]["name"],
        katibutils.TRIAL_ID_ANNOTATION_KEY: trial["metadata"]["uid"],
    }
    try:
        workflowutils.annotate_workflow(workflow_name, pod_namespace,
                                        wf_annotations)
    except Exception:
        logger.exception("Failed to annotate Workflow '%s' with the Katib"
                         " details", workflow_name)

    status = _wait_kfp_run(run_id)

    # If run has not succeeded, return no metrics
    if status != "Succeeded":
        logger.warning("KFP run did not run successfully. No metrics to"
                       " return.")
        # exit gracefully with error
        sys.exit(-1)

    # Retrieve metrics
    run_metrics = _get_kfp_run_metrics(run_id, namespace)
    for name, value in run_metrics.items():
        logger.info("%s=%s", name, value)

    return run_metrics


def _get_workflow_from_run(run):
    return json.loads(run.pipeline_runtime.workflow_manifest)


def format_kfp_run_id_uri(run_id: str):
    """Return a KFP run ID as a URI."""
    return "kfp:run:%s" % run_id
