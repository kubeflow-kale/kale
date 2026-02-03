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

"""Suite of helpers for Katib."""

import os
import sys
import copy
import logging

from kubernetes.client.rest import ApiException

from kale.common import k8sutils, podutils, kfputils, workflowutils


log = logging.getLogger(__name__)


KATIB_API_GROUP = "kubeflow.org"
KATIB_API_VERSION_V1ALPHA3 = "v1alpha3"
KATIB_API_VERSION_V1BETA1 = "v1beta1"
KATIB_TRIALS_PLURAL = "trials"
KATIB_EXPERIMENTS_PLURAL = "experiments"

EXPERIMENT_NAME_ANNOTATION_KEY = "kubeflow.org/katib-experiment-name"
EXPERIMENT_ID_ANNOTATION_KEY = "kubeflow.org/katib-experiment-id"
TRIAL_NAME_ANNOTATION_KEY = "kubeflow.org/katib-trial-name"
TRIAL_ID_ANNOTATION_KEY = "kubeflow.org/katib-trial-id"

KALE_KATIB_KFP_ANNOTATION_KEY = "kubeflow-kale.org/kfp-run-uuid"

TRIAL_IMAGE_ENV = "KALE_KATIB_KFP_TRIAL_IMAGE"
TRIAL_IMAGE = "gcr.io/arrikto/katib-kfp-trial:a7f7bb79-d9bf99ac"
TRIAL_SA = "pipeline-runner"
TRIAL_CONTAINER_NAME = "main"
KALE_PARAM_TRIAL_NAME = "kaleParamTrialName"

# In the Job CR we can only use '${trialParameters.*}', so to access
# information from the Trial spec (e.g. the Trial name) we need to first create
# a parameter that can be referenced in the Job spec.
TRIAL_PARAMETERS_BASE = [{"name": KALE_PARAM_TRIAL_NAME,
                          "reference": "${trialSpec.Name}"}]

JOB_CMD = """\
python3 -u -c "from kale.common.katibutils import create_and_wait_kfp_run;\
               create_and_wait_kfp_run(%s)"\
"""
JOB_CR = {"apiVersion": "batch/v1",
          "kind": "Job",
          "spec": {"backoffLimit": 0,
                   "template": {
                       "metadata": {
                           "annotations": {"sidecar.istio.io/inject": "false"},
                           "labels": {"access-ml-pipeline": "true"},
                       },
                       "spec": {"restartPolicy": "Never",
                                "serviceAccountName": TRIAL_SA,
                                "containers": [{"name": TRIAL_CONTAINER_NAME,
                                                "image": TRIAL_IMAGE}]}
                   }}}

RAW_TEMPLATE_V1ALPHA3 = """\
apiVersion: batch/v1
kind: Job
metadata:
  name: {{.Trial}}
  namespace: {{.NameSpace}}
spec:
  backoffLimit: 0
  template:
    metadata:
      annotations:
        sidecar.istio.io/inject: "false"
      labels:
        access-ml-pipeline: "true"
    spec:
      restartPolicy: Never
      serviceAccountName: pipeline-runner
      containers:
        - name: {{.Trial}}
          image: {image}
          command:
            - python3 -u -c "from kale.common.katibutils\
                import create_and_wait_kfp_run;\
                create_and_wait_kfp_run(\
                    pipeline_id='{pipeline_id}',\
                    version_id='{version_id}',\
                    run_name='{{.Trial}}',\
                    experiment_name='{experiment_name}',\
                    api_version='{api_version}',\
                    {{- with .HyperParameters }} {{- range .}}
                        {{.Name}}='{{.Value}}',\
                    {{- end }} {{- end }}\
                )"
"""


def _get_trial_image():
    return os.getenv(TRIAL_IMAGE_ENV, TRIAL_IMAGE)


def _get_base_job_cr():
    image = _get_trial_image()
    job = copy.deepcopy(JOB_CR)
    job["spec"]["template"]["spec"]["containers"][0]["image"] = image
    return job


def create_and_wait_kfp_run(pipeline_id: str,
                            version_id: str,
                            run_name: str,
                            experiment_name: str = "Default",
                            api_version: str = KATIB_API_VERSION_V1BETA1,
                            **kwargs):
    """Create a KFP run, wait for it to complete and retrieve its metrics.

    Create a KFP run from a KFP pipeline with custom arguments and wait for
    it to finish. If it succeeds, return its metrics, logging them in a format
    that can be parsed by Katib's metrics collector.

    Also, annotate the parent trial with the run UUID of the KFP run and
    annotation the KFP workflow with the Katib experiment and trial names and
    ids.

    Args:
        pipeline_id: KFP pipeline
        version_id: KFP pipeline's version
        run_name: The name of the new run
        experiment_name: KFP experiment to create run in. (default: "Default")
        api_version: The version of the Katib CRD (`v1alpha3` or `v1beta1`
        kwargs: All the parameters the pipeline will be fed with

    Returns:
        metrics: Dict of metrics along with their values
    """
    pod_namespace = podutils.get_namespace()
    run = kfputils.run_pipeline(experiment_name=experiment_name,
                                pipeline_id=pipeline_id,
                                version_id=version_id,
                                run_name=run_name,
                                **kwargs)
    run_id = run.id

    log.info("Annotating Trial '%s' with the KFP Run UUID '%s'...",
             run_name, run_id)
    try:
        # Katib Trial name == KFP Run name by design (see rpc.katib)
        annotate_trial(run_name, pod_namespace,
                       {KALE_KATIB_KFP_ANNOTATION_KEY: run_id}, api_version)
    except Exception:
        log.exception("Failed to annotate Trial '%s' with the KFP Run UUID"
                      " '%s'", run_name, run_id)

    log.info("Getting Workflow name for run '%s'...", run_id)
    workflow_name = kfputils.get_workflow_from_run(
        kfputils.get_run(run_id))["metadata"]["name"]
    log.info("Workflow name: %s", workflow_name)
    log.info("Getting the Katib trial...")
    trial = get_trial(run_name, pod_namespace, api_version)
    log.info("Trial name: %s, UID: %s", trial["metadata"]["name"],
             trial["metadata"]["uid"])
    log.info("Getting owner Katib experiment of trial...")
    exp_name, exp_id = get_owner_experiment_from_trial(trial)
    log.info("Experiment name: %s, UID: %s", exp_name, exp_id)
    wf_annotations = {
        EXPERIMENT_NAME_ANNOTATION_KEY: exp_name,
        EXPERIMENT_ID_ANNOTATION_KEY: exp_id,
        TRIAL_NAME_ANNOTATION_KEY: trial["metadata"]["name"],
        TRIAL_ID_ANNOTATION_KEY: trial["metadata"]["uid"],
    }
    try:
        workflowutils.annotate_workflow(workflow_name, pod_namespace,
                                        wf_annotations)
    except Exception:
        log.exception("Failed to annotate Workflow '%s' with the Katib"
                      " details", workflow_name)

    status = kfputils.wait_kfp_run(run_id)

    # If run has not succeeded, return no metrics
    if status != "Succeeded":
        log.warning("KFP run did not run successfully. No metrics to"
                    " return.")
        # exit gracefully with error
        sys.exit(-1)

    # Retrieve metrics
    run_metrics = kfputils.get_kfp_run_metrics(run_id)
    for name, value in run_metrics.items():
        log.info("%s=%s", name, value)

    return run_metrics


def annotate_trial(name, namespace, annotations,
                   api_version=KATIB_API_VERSION_V1BETA1):
    """Add annotations to a Trial."""
    k8sutils.annotate_object(KATIB_API_GROUP, api_version, KATIB_TRIALS_PLURAL,
                             name, namespace, annotations)


def get_trial(name, namespace, api_version=KATIB_API_VERSION_V1BETA1):
    """Get a Trial."""
    k8s_client = k8sutils.get_co_client()
    return k8s_client.get_namespaced_custom_object(KATIB_API_GROUP,
                                                   api_version,
                                                   namespace,
                                                   KATIB_TRIALS_PLURAL, name)


def _get_owner_experiment(owner_references,
                          api_version=KATIB_API_VERSION_V1BETA1):
    owner = None
    expected_api_version = "%s/%s" % (KATIB_API_GROUP, api_version)
    for ref in owner_references:
        api_version = ref.get("apiVersion")
        kind = ref.get("kind")
        controller = ref.get("controller")
        if (api_version == expected_api_version and kind == "Experiment"
                and controller):
            owner = ref
            break
    return owner


def get_owner_experiment_from_trial(trial):
    """Return the parent Experiment name and ID given a Trial."""
    api_version = trial["apiVersion"].split("/")[1]
    owner = _get_owner_experiment(trial["metadata"]["ownerReferences"],
                                  api_version=api_version)
    if not owner:
        trial_name = trial["metadata"]["name"]
        trial_namespace = trial["metadata"]["namespace"]
        trial_uid = trial["metadata"]["uid"]
        raise RuntimeError("Failed to find owner Experiment for Trial."
                           " Name: %s, Namespace: %s UID: %s"
                           % (trial_name, trial_namespace, trial_uid))
    return owner.get("name"), owner.get("uid")


def construct_experiment_cr(name, experiment_spec, pipeline_id, version_id,
                            experiment_name,
                            api_version=KATIB_API_VERSION_V1BETA1):
    """Return an Experiment provided its spec."""
    if api_version == KATIB_API_VERSION_V1BETA1:
        f = _construct_experiment_cr_v1beta1
    else:
        f = _construct_experiment_cr_v1alpha3
    return f(name=name, experiment_spec=experiment_spec,
             pipeline_id=pipeline_id, version_id=version_id,
             experiment_name=experiment_name)


def _construct_experiment_cr_v1alpha3(name, experiment_spec, pipeline_id,
                                      version_id, experiment_name):
    """Return a v1alpha3 Experiment provided its spec."""
    experiment = {"apiVersion": "kubeflow.org/v1alpha3",
                  "kind": "Experiment",
                  "metadata": {"name": name},
                  "spec": experiment_spec}

    trial_parameters = {"image": _get_trial_image(),
                        "pipeline_id": pipeline_id,
                        "version_id": version_id,
                        "experiment_name": experiment_name,
                        "api_version": KATIB_API_VERSION_V1ALPHA3}

    raw_template = RAW_TEMPLATE_V1ALPHA3.replace("{{", "<<<").replace("}}",
                                                                      ">>>")
    raw_template = raw_template.format(**trial_parameters)
    raw_template = raw_template.replace("<<<", "{{").replace(">>>", "}}")
    experiment["spec"]["trialTemplate"] = {"goTemplate": {
        "rawTemplate": raw_template}}

    return experiment


def _construct_experiment_cr_v1beta1(name, experiment_spec, pipeline_id,
                                     version_id, experiment_name):
    """Return a v1beta1 Experiment provided its spec."""
    trial_tmpl = {"retain": True,
                  "primaryContainerName": TRIAL_CONTAINER_NAME,
                  "trialParameters": copy.deepcopy(TRIAL_PARAMETERS_BASE)}

    spec = copy.deepcopy(experiment_spec)
    param_names = [p["name"] for p in spec["parameters"]]
    trial_tmpl["trialParameters"].extend([{"name": p, "reference": p}
                                          for p in param_names])

    kwargs = {p: "${trialParameters.%s}" % p for p in param_names}
    kwargs.update({"pipeline_id": pipeline_id,
                   "version_id": version_id,
                   "run_name": "${trialParameters.%s}" % KALE_PARAM_TRIAL_NAME,
                   "experiment_name": experiment_name,
                   "api_version": KATIB_API_VERSION_V1BETA1})
    cmd = JOB_CMD % ", ".join("%s='%s'" % (k, v) for k, v in kwargs.items())
    job = _get_base_job_cr()
    job["spec"]["template"]["spec"]["containers"][0]["command"] = [cmd]
    trial_tmpl["trialSpec"] = job
    spec["trialTemplate"] = trial_tmpl
    experiment = {"apiVersion": "%s/%s" % (KATIB_API_GROUP,
                                           KATIB_API_VERSION_V1BETA1),
                  "kind": "Experiment",
                  "metadata": {"name": name},
                  "spec": spec}

    return experiment


def create_experiment(experiment, namespace):
    """Create a Katib Experiment."""
    k8s_co_client = k8sutils.get_co_client()
    log.info("Creating Katib Experiment '%s/%s'...",
             namespace, experiment["metadata"]["name"])
    api_version = experiment["apiVersion"].split("/")[1]
    exp = k8s_co_client.create_namespaced_custom_object(
        KATIB_API_GROUP, api_version, namespace,
        KATIB_EXPERIMENTS_PLURAL, experiment)
    log.info("Successfully created Katib Experiment!")
    return exp


def list_experiments(namespace, api_version=KATIB_API_VERSION_V1BETA1):
    """List Katib Experiments."""
    k8s_co_client = k8sutils.get_co_client()
    log.info("Listing Katib %s Experiment n namespace '%s'...",
             api_version, namespace)
    ret = k8s_co_client.list_namespaced_custom_object(
        KATIB_API_GROUP, api_version, namespace, KATIB_EXPERIMENTS_PLURAL)
    log.info("Successfully retrieved %d %s Experiments", len(ret), api_version)
    return ret


def discover_katib_version():
    """Retrieve the installed Katib version."""
    log.info("Discovering Katib version...")
    ns = podutils.get_namespace()
    api_version = KATIB_API_VERSION_V1BETA1
    try:
        list_experiments(ns, api_version)
    except ApiException as e:
        if e.status != 403:
            api_version = KATIB_API_VERSION_V1ALPHA3
            try:
                list_experiments(ns, api_version)
            except ApiException as e:
                if e.status != 403:
                    raise RuntimeError("Katib is not installed or has an"
                                       " unsupported CRD version. Supported"
                                       " CRD versions are 'v1alpha3' and"
                                       " 'v1beta1'.")

    log.info("Found Katib version %s", api_version)
    return api_version
