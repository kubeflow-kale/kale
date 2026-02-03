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

# Prototype of a model class  for an ML framework.
# Most of the member functions of the class will use two types of inputs:
#      - raw_data := a tuple of numpy arrays
#      - settings := a dictionary providing information to run the function.
#                   This dictionary will be initialized from the 'settings'
#                   section of the input json contract. Hence, all the
#                   information necessary to use all the member functions of
#                   the model should be already present in the 'settings'
#                   section of the json contract or at the latest added during
#                   the preprocessing operation.


class ModelPrototype:

    def __init__(self, raw_data, settings):
        # Inputs:
        #        raw_data := tuple of numpy arrays
        #        settings:= dictionary that specifies the settings for the
        #                          model

        # CODE here

        return

    def get_parameters(self):
        # function use to retrieve the parameters of the model
        # Outputs:
        #       model_parameters := data structure containing values for the
        #                          parameters  (should be set to None if there
        #                          is nothing to saved)

        model_parameters = None

        # CODE HERE

        return model_parameters

    def set_parameters(self, model_parameters):
        # function used to update the model parameters
        # Input
        # model_parameters := data structure containing values for the
        #                          parameters

        # CODE HERE

        return

    def training(self, raw_data, settings):
        # function used to train the model
        # Input:
        #       raw_data := tuple of numpy arrays
        #      settings := dictionary that specifies the settings for
        #                         the model
        #  Output:
        #        history := data structure storing information from the
        #        training operation. (should be set to None if there is
        #        nothing to saved)
        history = None
        # CODE HERE

        return history

    def predict(self, raw_data, settings):
        # function used to perform predictions
        # Input:
        #       raw_data := tuple of numpy arrays
        #       settings := dictionary that specifies the settings for
        #                           the model
        # Output:
        #       raw_predictions := tuple of numpy arrays

        # CODE HERE

        return raw_predictions
