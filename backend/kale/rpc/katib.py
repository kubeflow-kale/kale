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

import os
from kubernetes.client.rest import ApiException

from kale.common import podutils, k8sutils, katibutils
from kale.rpc.errors import RPCNotFoundError, RPCUnhandledError

KATIB_PARAMETER_NAMES = ("objective", "algorithm", "parallelTrialCount",
                         "maxTrialCount", "maxFailedTrialCount", "parameters")
KATIB_DEFAULTS = {"parallelTrialCount": 3, "maxTrialCount": 12,
                  "maxFailedTrialCount": 3}
KATIB_EXPERIMENT_STATUS = ["Failed", "Succeeded", "Restarting", "Running",
                           "Created"]


def _launch_katib_experiment(request, katib_experiment, namespace):
    """Launch Katib experiment."""
    try:
        katibutils.create_experiment(katib_experiment, namespace)
    except ApiException as e:
        request.log.exception("Failed to launch Katib experiment")
        raise RPCUnhandledError(message="Failed to launch Katib experiment",
                                details=str(e), trans_id=request.trans_id)


def _sanitize_parameters(request, parameters, parameter_names, defaults,
                         parameters_type):
    """Keep just the known parameter fields that are required."""
    sanitized = {}
    for param in parameter_names:
        if param not in parameters and param not in defaults:
            request.log.exception("%s parameter '%s' was not provided",
                                  parameters_type, param)
            raise RPCNotFoundError(details=("%s parameter '%s' is required"
                                            % (parameters_type, param)),
                                   trans_id=request.trans_id)
        sanitized[param] = parameters.pop(param, defaults.get(param))
    if parameters:
        request.log.debug("Ignoring %s parameters: %s", parameters_type,
                          ", ".join(parameters.keys()))
    return sanitized


def _sanitize_katib_spec(request, katib_spec):
    """Sanitize a given Katib specification."""
    return _sanitize_parameters(request, katib_spec, KATIB_PARAMETER_NAMES,
                                KATIB_DEFAULTS, "Katib")


def _construct_experiment_return_base(experiment, namespace):
    return {"apiVersion": experiment["apiVersion"],
            "name": experiment["metadata"]["name"],
            "namespace": namespace,
            "status": None,
            "trials": 0,
            "maxTrialCount": experiment["spec"]["maxTrialCount"]}


def create_katib_experiment(request, pipeline_id, version_id,
                            pipeline_metadata, output_path):
    """Create and launch a new Katib experiment.

    The Katib metadata must include all the information required to create an
    Experiment CRD (algorithm, objective, search parameters, ...). This
    information is sanitized a new yaml is written to file. This yaml is then
    submitted to the K8s API server to create the Experiment CR.

    Args:
        request: RPC request object
        pipeline_id: The id of the KFP pipeline that will be run by the Trials
        version_id: The id of the KFP pipeline version run by the Trials
        pipeline_metadata: The Kale notebook metadata
        output_path: The directory to store the YAML definition

    Returns (dict): a dictionary describing the status of the experiment
    """
    old_katibutils_logger = katibutils.log
    katibutils.log = request.log

    try:
        namespace = podutils.get_namespace()
    except Exception:
        # XXX: When not running from within a pod, get_namespace() fails
        # XXX: If that's the case, use the 'kubeflow-user' one
        # XXX: This should probably change. It works for local/MiniKF dev
        namespace = "kubeflow-user"

    katib_name = pipeline_metadata.get("experiment_name")
    katib_spec = pipeline_metadata.get("katib_metadata", None)
    if not katib_spec:
        raise RPCNotFoundError(details=("Could not find Katib specification in"
                                        " notebook's metadata"),
                               trans_id=request.trans_id)
    # Perform a sanitization of the Katib specification, making sure all the
    # required first-layer-fields are set
    katib_spec = _sanitize_katib_spec(request, katib_spec)

    katib_experiment = katibutils.construct_experiment_cr(
        name=katib_name, experiment_spec=katib_spec,
        pipeline_id=pipeline_id, version_id=version_id,
        experiment_name=pipeline_metadata.get("experiment_name"),
        api_version=katibutils.discover_katib_version())
    definition_path = os.path.abspath(
        os.path.join(output_path, "%s.katib.yaml" % katib_name))
    request.log.info("Saving Katib experiment definition at %s",
                     definition_path)
    with open(definition_path, "w") as yaml_file:
        import yaml
        yaml_text = yaml.dump(katib_experiment)
        yaml_file.write(yaml_text)

    try:
        _launch_katib_experiment(request, katib_experiment, namespace)
    except Exception:
        katibutils.log = old_katibutils_logger
        raise

    katibutils.log = old_katibutils_logger
    return _construct_experiment_return_base(katib_experiment, namespace)


def get_experiment(request, experiment, namespace):
    """Get a Katib Experiment.

    This RPC is used by the labextension when polling for the state of a
    running Experiment.

    Args:
        request: RPC request object
        experiment: Name of the Katib experiment
        namespace: Namespace of the experiment

    Returns (dict): a dict describing the status of the running experiment
    """
    k8s_co_client = k8sutils.get_co_client()

    co_group = "kubeflow.org"
    co_plural = "experiments"

    try:
        exp = k8s_co_client.get_namespaced_custom_object(
            co_group, katibutils.discover_katib_version(), namespace,
            co_plural, experiment)
    except ApiException as e:
        request.log.exception("Failed to get Katib experiment")
        raise RPCUnhandledError(message="Failed to get Katib experiment",
                                details=str(e), trans_id=request.trans_id)

    ret = _construct_experiment_return_base(exp, namespace)
    if exp.get("status") is None:
        return ret

    status, reason, message = _get_experiment_status(exp["status"])
    ret.update({"status": status,
                "reason": reason,
                "message": message,
                "trials": exp["status"].get("trials", 0),
                "trialsFailed": exp["status"].get("trialsFailed", 0),
                "trialsRunning": exp["status"].get("trialsRunning", 0),
                "trialsSucceeded": exp["status"].get("trialsSucceeded", 0),
                "currentOptimalTrial": exp["status"].get(
                    "currentOptimalTrial")})
    return ret


def _get_experiment_status(experiment_status):
    """Retrieve an experiment's status."""

    def _is_status(condition, status):
        return condition["type"] == status and condition["status"] == "True"

    for status in KATIB_EXPERIMENT_STATUS:
        for condition in experiment_status["conditions"]:
            if _is_status(condition, status):
                return status, condition["reason"], condition["message"]
    return None, None, None
