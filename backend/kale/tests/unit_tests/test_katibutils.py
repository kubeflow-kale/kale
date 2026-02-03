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
import yaml

from kale.common import katibutils

THIS_DIR = os.path.dirname(os.path.abspath(__file__))

EXPERIMENT_SPEC = {
    "algorithm": {
        "algorithmName": "grid"
    },
    "objective": {
        "goal": 100,
        "objectiveMetricName": "result",
        "type": "maximize",
    },
    "parameters": [
        {
            "feasibleSpace": {
                "max": "50.0",
                "min": "1.0",
                "step": "10.0"
            },
            "name": "a",
            "parameterType": "double"
        },
        {
            "feasibleSpace": {
                "max": "5",
                "min": "1",
                "step": "9"
            },
            "name": "b",
            "parameterType": "int"
        },
        {
            "feasibleSpace": {
                "list": ["1", "9", "15"]
            },
            "name": "c",
            "parameterType": "categorical"
        }
    ],
    "parallelTrialCount": 1,
    "maxFailedTrialCount": 6,
    "maxTrialCount": 30,
}


def test_create_katib_experiment_v1alpha3():
    """Test that a Katib v1alpha3 Experiment CRD is generated correctly."""
    experiment_name = "katib-test"

    katib_experiment = katibutils._construct_experiment_cr_v1alpha3(
        name=experiment_name, experiment_spec=EXPERIMENT_SPEC,
        pipeline_id="12345", version_id="12345",
        experiment_name=experiment_name)

    target = open(os.path.join(THIS_DIR,
                               "../assets/yamls",
                               "katib-experiment-v1alpha3.yaml")).read()
    target = target.replace("{{KATIB_TRIAL_IMAGE}}",
                            katibutils._get_trial_image())

    assert yaml.dump(katib_experiment) == target


def test_create_katib_experiment_v1beta1():
    """Test that a Katib v1beta1 Experiment CRD is generated correctly."""
    experiment_name = "katib-test"

    katib_experiment = katibutils._construct_experiment_cr_v1beta1(
        name=experiment_name, experiment_spec=EXPERIMENT_SPEC,
        pipeline_id="12345", version_id="12345",
        experiment_name=experiment_name)

    target = open(os.path.join(THIS_DIR,
                               "../assets/yamls",
                               "katib-experiment-v1beta1.yaml")).read()
    target = target.replace("{{KATIB_TRIAL_IMAGE}}",
                            katibutils._get_trial_image())

    assert yaml.dump(katib_experiment) == target


def test_img_from_env():
    """Test with image from the environment.

    Test that a Katib v1beta1 Experiment CRD is generated correctly when there
    is a different image specified in the environment.
    """
    image = "test/image:1234"
    os.environ[katibutils.TRIAL_IMAGE_ENV] = image

    assert katibutils._get_trial_image() == image
    del os.environ[katibutils.TRIAL_IMAGE_ENV]
