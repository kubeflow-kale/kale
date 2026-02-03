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

from kale.sdk import step


@step(name="trainpredict")
def train_and_predict(raw_input):
    from lib.quantile_regression import QuantileRegression

    from settings import MODEL_SETTINGS

    model = QuantileRegression(raw_input, MODEL_SETTINGS)
    print("Running training")
    model.training(raw_input, MODEL_SETTINGS)

    print("Running prediction")
    return model.predict(raw_input, MODEL_SETTINGS)
