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

from kale.common import podutils


KATIB_API_GROUP = "kubeflow.org"
KATIB_API_VERSION = "v1alpha3"
KATIB_TRIALS_PLURAL = "trials"


def annotate_trial(name, namespace, annotations):
    """Add annotations to a Trial."""
    podutils.annotate_k8s_object(KATIB_API_GROUP, KATIB_API_VERSION,
                                 KATIB_TRIALS_PLURAL, name, namespace,
                                 annotations)
