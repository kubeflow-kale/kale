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


@step(name="logisticregression")
def logistic_regression(train_df, train_labels):
    from sklearn.linear_model import LogisticRegression

    logreg = LogisticRegression(solver='lbfgs', max_iter=110)
    logreg.fit(train_df, train_labels)
    acc_log = round(logreg.score(train_df, train_labels) * 100, 2)
    print("Logistic Regression: %s" % acc_log)
    return acc_log



