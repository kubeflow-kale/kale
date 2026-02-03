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

from kale.sdk import pipeline


from init import init
from preprocess import preprocess
from train import train_and_predict
from postprocess import postprocess


@pipeline(
    name="quantile-regression",
    experiment="quantile-regression",
    autosnapshot=False,
)
def quantile_regression():
    df = init()
    raw_input, processing_info = preprocess(df)
    raw_predictions = train_and_predict(raw_input)
    postprocess(raw_input, raw_predictions, processing_info)


if __name__ == "__main__":
    quantile_regression()
