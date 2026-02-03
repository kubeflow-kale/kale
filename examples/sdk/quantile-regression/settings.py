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

INPUTS = ["CLOUD_COVER", "DEWPOINT", "HEAT_INDEX", "TEMPERATURE", "WIND_CHILL",
          "WIND_DIRECTION", "WIND_SPEED", "TOTAL_CAP_GEN_RES",
          "TOTAL_CAP_LOAD_RES", "AVERAGE", "total_load", "DA_PRICE"]
OUTPUTS = ["response_var"]
DATE_TIME = "DateTime"

_DATA_FOLDER = "./data"
_TRAIN_DATA_FILE = "TrainingData.csv"
_TEST_DATA_FILE = "TestData.csv"
_OUTPUT_FILE = "outputTrainingData_qr.csv"
TRAINING_DATA = os.path.join(_DATA_FOLDER, _TRAIN_DATA_FILE)
TEST_DATA = os.path.join(_DATA_FOLDER, _TEST_DATA_FILE)
OUTPUT_DATA = os.path.join(_DATA_FOLDER, _OUTPUT_FILE)

MODEL_SETTINGS = {
    "q": 0.5,
    "max_iter": 5000
}
