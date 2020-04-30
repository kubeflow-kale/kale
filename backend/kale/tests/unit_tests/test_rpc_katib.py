#  Copyright 2020 The Kale Authors
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

from kale.rpc import katib
from unittest import mock

from kale.rpc.run import KaleRPCRequest

THIS_DIR = os.path.dirname(os.path.abspath(__file__))


def _get_requets():
    return KaleRPCRequest(trans_id=0)


@mock.patch("kale.rpc.katib._launch_katib_experiment", new=mock.MagicMock())
def test_create_katib_experiment():
    """Test that a Katib Experiment CRD is generated correctly."""
    pipeline_metadata = {
        "experiment_name": "katib-test",
        "katib_metadata": {
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
    }
    m = mock.mock_open()
    with mock.patch("builtins.open", m):
        katib.create_katib_experiment(_get_requets(), "12345",
                                      pipeline_metadata, output_path=".")

    handle = m()
    target = open(os.path.join(THIS_DIR,
                               "../assets/yamls",
                               "katib-experiment.yaml")).read()
    assert handle.write.mock_calls[0][1][0] == target
