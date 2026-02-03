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


@step(name="results")
def results(acc_linear_svc, acc_log, acc_random_forest):
    import pandas as pd

    results = pd.DataFrame({
        'Model': ['Support Vector Machines', 'logistic Regression',
                  'Random Forest'],
        'Score': [acc_linear_svc, acc_log, acc_random_forest]})
    result_df = results.sort_values(by='Score', ascending=False)
    result_df = result_df.set_index('Score')
    print(result_df)
