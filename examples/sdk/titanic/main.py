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

# data functions
from loaddata import loaddata
from feature_engineering import featureengineering
from datapreprocessing import dataprocessing

# models
from svm import svm
from randomforest import randomforest
from logistic_regression import logistic_regression

# end
from results import results


@pipeline(
    name="titanic",
    experiment="test"
)
def titanic_pipeline():
    train, test = loaddata()
    train_proc, test_proc = dataprocessing(train, test)
    train_feat, train_labels = featureengineering(train_proc, test_proc)

    rf_acc = randomforest(train_feat, train_labels)
    svm_acc = svm(train_feat, train_labels)
    lg_acc = logistic_regression(train_feat, train_labels)

    results(svm_acc, lg_acc, rf_acc)


if __name__ == "__main__":
    titanic_pipeline()
