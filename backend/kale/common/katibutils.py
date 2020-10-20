# Copyright 2020 The Kale Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Suite of helpers for Katib."""

from kale.common import k8sutils


KATIB_API_GROUP = "kubeflow.org"
KATIB_API_VERSION = "v1alpha3"
KATIB_TRIALS_PLURAL = "trials"

EXPERIMENT_NAME_ANNOTATION_KEY = "kubeflow.org/katib-experiment-name"
EXPERIMENT_ID_ANNOTATION_KEY = "kubeflow.org/katib-experiment-id"
TRIAL_NAME_ANNOTATION_KEY = "kubeflow.org/katib-trial-name"
TRIAL_ID_ANNOTATION_KEY = "kubeflow.org/katib-trial-id"


def annotate_trial(name, namespace, annotations):
    """Add annotations to a Trial."""
    k8sutils.annotate_object(KATIB_API_GROUP, KATIB_API_VERSION,
                             KATIB_TRIALS_PLURAL, name, namespace,
                             annotations)


def get_trial(name, namespace):
    """Get a Trial."""
    k8s_client = k8sutils.get_co_client()
    return k8s_client.get_namespaced_custom_object(KATIB_API_GROUP,
                                                   KATIB_API_VERSION,
                                                   namespace,
                                                   KATIB_TRIALS_PLURAL, name)


def _get_owner_experiment(owner_references):
    owner = None
    expected_api_version = "%s/%s" % (KATIB_API_GROUP, KATIB_API_VERSION)
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
    owner = _get_owner_experiment(trial["metadata"]["ownerReferences"])
    if not owner:
        trial_name = trial["metadata"]["name"]
        trial_namespace = trial["metadata"]["namespace"]
        trial_uid = trial["metadata"]["uid"]
        raise RuntimeError("Failed to find owner Experiment for Trial."
                           " Name: %s, Namespace: %s UID: %s"
                           % (trial_name, trial_namespace, trial_uid))
    return owner.get("name"), owner.get("uid")
