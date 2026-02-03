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

import numpy as np
import statsmodels.api as sm

from sklearn.ensemble import GradientBoostingRegressor

import tensorflow as tf
from tensorflow import keras


def tilted_loss(q, y, f):
    e = (y - f)
    return keras.backend.mean(keras.backend.maximum(q * e, (q - 1) * e),
                              axis=-1)


class QuantileRegression:

    def __init__(self, raw_data, settings):
        # Inputs:
        # raw_data := tuple of numpy arrays
        # settings:= dictionary that specifies the settings for the model

        Xraw, Yraw, _ = raw_data

        self.model = sm.QuantReg(Yraw,
                                 Xraw).fit()

        return

    def get_parameters(self):
        # function use to retrieve the parameters of the model
        # Outputs:
        # model_parameters := data structure containing values for the
        # parameters (should be set to None if there is nothing to saved)
        model_parameters = {}
        # Retrieving coefficients
        model_parameters['coeff'] = self.model.params[1:]
        # Retrieveing intercept
        model_parameters['intercept'] = self.model.params[0]
        return model_parameters

    def set_parameters(self, model_parameters):
        # function used to update the model parameters
        # Input
        # model_parameters := data structure containing values for the
        # parameters
        # Set coefficients
        self.model.params[1:] = model_parameters['coeff']
        # Set intercept
        self.model.params[0] = model_parameters['intercept']
        return

    def training(self, raw_data, settings):
        # function used to train the model
        # Input:
        # raw_data := tuple of numpy arrays
        # settings := dictionary that specifies the settings for the model
        #
        # Output:
        # history := data structure storing information from the training
        # operation.
        # (should be set to None if there is nothing to saved)

        q = settings['q']
        max_iter = settings['max_iter']

        Xraw, Yraw, _ = raw_data

        self.model = sm.QuantReg(Yraw,
                                 Xraw).fit(q=q,
                                           max_iter=max_iter)

        history = None  # since there is no training history to be saved,
        # history is set to None
        return history

    def predict(self, raw_data, settings):
        # function used to perform predictions
        # Input:
        # raw_data := tuple of numpy arrays
        # settings := dictionary that specifies the settings for the model
        # Output:
        # raw_predictions := tuple of numpy arrays

        Xraw, _, _ = raw_data

        raw_predictions = self.model.predict(Xraw)

        return (raw_predictions)


class GradientBoostingQuantileRegression:

    def __init__(self, raw_data, settings):
        # Inputs:
        # raw_data := tuple of numpy arrays
        # settings:= dictionary that specifies the settings for the model

        self.model = GradientBoostingRegressor(loss=settings["loss"],
                                               alpha=settings["alpha"],
                                               n_estimators=settings[
                                                   "n_estimators"],
                                               max_depth=settings["max_depth"],
                                               learning_rate=settings[
                                                   "learning_rate"],
                                               min_samples_leaf=settings[
                                                   "min_samples_leaf"],
                                               min_samples_split=settings[
                                                   "min_samples_split"],
                                               verbose=settings["verbose"])

        return

    def get_parameters(self):
        # function use to retrieve the parameters of the model
        # Outputs:
        # model_parameters := dictionary containing values for the parameters
        # (should be set to None if there is nothing to saved)
        model_parameters = {}
        # Retrieving coefficients
        model_parameters = self.model.get_params()

        return model_parameters

    def set_parameters(self, model_parameters):
        # function used to update the model parameters
        # Input
        # model_parameters := dictionary structure containing values for the
        # parameters

        self.model.alpha = model_parameters["alpha"]
        self.model.criterion = model_parameters["criterion"]
        self.model.alpha = model_parameters["alpha"]
        self.model.criterion = model_parameters["criterion"]
        self.model.max_depth = model_parameters["max_depth"]
        self.model.min_samples_leaf = model_parameters["min_samples_leaf"]
        self.model.n_estimators = model_parameters["n_estimators"]

        return

    def training(self, raw_data, settings):
        # function used to train the model
        # Input:
        # raw_data := tuple of numpy arrays
        # settings := dictionary that specifies the settings for the model
        #  Output:
        #  history := data structure storing information from the training
        #  operation.
        #             (should be set to None if there is nothing to saved)

        Xraw, Yraw, _ = raw_data

        self.model.fit(Xraw,
                       Yraw)

        history = None  # since there is no training history to be saved,
        # history is set to None
        return history

    def predict(self, raw_data, settings):
        # function used to perform predictions
        # Input:
        # raw_data := tuple of numpy arrays
        # settings := dictionary that specifies the settings for the model
        # Output:
        # raw_predictions := tuple of numpy arrays

        Xraw, _, _ = raw_data

        raw_predictions = self.model.predict(Xraw)

        return (raw_predictions)


class KerasQuantileRegression:

    def __init__(self, raw_data, settings):
        # Inputs:
        # raw_data := tuple of numpy arrays
        # settings:= dictionary that specifies the settings for the model

        Xraw, _, _ = raw_data

        if len(Xraw.shape) == 1:
            input_dim = 1

        else:
            input_dim = Xraw.shape[1]

        self.model = keras.Sequential(
            [keras.layers.Dense(settings["units"],
             activation=tf.nn.relu,
             input_dim=input_dim),
             keras.layers.Dense(settings["units"],
             activation=tf.nn.relu),
             keras.layers.Dense(1)])
        return

    def get_parameters(self):
        # function use to retrieve the parameters of the model
        # Outputs:
        # model_parameters := list containing values for the parameters (should
        # be set to None if there is nothing to saved)
        model_parameters = []
        # Retrieving coefficients
        model_parameters = self.model.get_weights()

        return model_parameters

    def set_parameters(self, model_parameters):
        # function used to update the model parameters
        # Input
        # model_parameters := list structure containing values for the weights
        self.model.set_weights(model_parameters)

        return

    def training(self, raw_data, settings):
        # function used to train the model
        # Input:
        # raw_data := tuple of numpy arrays
        # settings := dictionary that specifies the settings for the model
        # Output:
        # history := data structure storing information from the training
        # operation.
        #            (should be set to None if there is nothing to saved)

        Xraw, Yraw, _ = raw_data

        optimizer = tf.optimizers.Adam(settings["learning_rate"])
        early_stop = keras.callbacks.EarlyStopping(monitor="val_loss",
                                                   patience=settings[
                                                       "patience"])

        self.model.compile(loss=lambda y, f: tilted_loss(settings["q"],
                                                         y,
                                                         f),
                           optimizer=optimizer)

        self.model.fit(Xraw,
                       Yraw,
                       epochs=settings["epochs"],
                       batch_size=settings["batch_size"],
                       verbose=settings["verbose"],
                       validation_split=settings["validation_split"],
                       callbacks=[early_stop])

        history = None  # since there is no training history to be saved,
        # history is set to None
        return history

    def predict(self, raw_data, settings):
        # function used to perform predictions
        # Input:
        # raw_data := tuple of numpy arrays
        # settings := dictionary that specifies the settings for the model
        # Output:
        # raw_predictions := tuple of numpy arrays

        Xraw, _, _ = raw_data

        raw_predictions = self.model.predict(Xraw)

        prediction_list = []

        for value in raw_predictions:
            prediction_list.append(value[0])

        return (np.array(prediction_list))


# Create network
class q_model:
    def __init__(self,
                 sess,
                 quantiles,
                 in_shape=1,
                 out_shape=1,
                 batch_size=32):

        # To fix the tf.placeholder() is not compatible with eager execution
        # issue.
        tf.compat.v1.disable_eager_execution()

        self.sess = sess

        self.quantiles = quantiles
        self.num_quantiles = len(quantiles)

        self.in_shape = in_shape
        self.out_shape = out_shape
        self.batch_size = batch_size

        self.outputs = []
        self.losses = []
        self.loss_history = []

        self.build_model()

    def build_model(self,
                    scope='q_model',
                    reuse=tf.compat.v1.AUTO_REUSE,
                    units=512):

        with tf.compat.v1.variable_scope(scope, reuse=reuse) as scope:
            self.x = tf.compat.v1.placeholder(tf.float32,
                                              shape=(None,
                                                     self.in_shape))

            self.y = tf.compat.v1.placeholder(tf.float32,
                                              shape=(None,
                                                     self.out_shape))

            self.layer0 = tf.compat.v1.layers.dense(self.x,
                                                    units=units,
                                                    activation=tf.nn.relu)

            self.layer1 = tf.compat.v1.layers.dense(self.layer0,
                                                    units=units,
                                                    activation=tf.nn.relu)

            # Create outputs and losses for all quantiles
            for i, q in enumerate(self.quantiles):
                # Get output layers
                output = tf.compat.v1.layers.dense(self.layer1, self.out_shape,
                                                   name="{}_q{}".format(i, int(
                                                       q * 100)))
                self.outputs.append(output)

                # Create losses
                error = tf.subtract(self.y, output)
                loss = tf.reduce_mean(tf.maximum(q * error, (q - 1) * error),
                                      axis=-1)

                self.losses.append(loss)

            # Create combined loss
            self.combined_loss = tf.reduce_mean(tf.add_n(self.losses))
            self.train_step = tf.compat.v1.train.AdamOptimizer().minimize(
                self.combined_loss)

    def fit(self, x, y, epochs=200):
        for epoch in range(epochs):
            epoch_losses = []

            for idx in range(0, x.shape[0], self.batch_size):
                batch_x = x[idx: min(idx + self.batch_size, x.shape[0]), :]
                batch_y = y[idx: min(idx + self.batch_size, y.shape[0])]

                batch_y = batch_y.reshape(len(batch_y), 1)

                feed_dict = {self.x: batch_x,
                             self.y: batch_y}

                _, c_loss = self.sess.run(
                    [self.train_step, self.combined_loss],
                    feed_dict)
                epoch_losses.append(c_loss)

            epoch_loss = np.mean(epoch_losses)
            self.loss_history.append(epoch_loss)
            if epoch % 100 == 0:
                print("Epoch {}: {}".format(epoch, epoch_loss))

    def predict(self, x):
        # Run model to get outputs
        feed_dict = {self.x: x}
        predictions = self.sess.run(self.outputs, feed_dict)

        return predictions


class TensorFlowQuantileRegression:

    def __init__(self, raw_data, settings):
        # Inputs:
        # raw_data := tuple of numpy arrays
        # settings:= dictionary that specifies the settings for the model

        self.sess = tf.compat.v1.Session()

        Xraw, _, _ = raw_data

        # Model instantiation
        self.model = q_model(self.sess,
                             settings["quantiles"],
                             in_shape=Xraw.shape[1],
                             batch_size=settings["batch_size"])

        return

    def get_parameters(self):
        # function use to retrieve the parameters of the model
        # Outputs:
        # model_parameters := Dictionary containing values for the parameters
        # (should be set to None if there is nothing to saved)
        model_parameters = {}
        # Retrieving coefficients
        model_parameters["x"] = self.model.x
        model_parameters["y"] = self.model.y
        model_parameters["layer0"] = self.model.layer0
        model_parameters["layer1"] = self.model.layer1

        return model_parameters

    def set_parameters(self, model_parameters):
        # function used to update the model parameters
        # Input
        # model_parameters := list structure containing values for the weights
        self.model.x = model_parameters["x"]
        self.model.y = model_parameters["y"]
        self.model.layer0 = model_parameters["layer0"]
        self.model.layer1 = model_parameters["layer1"]

        return

    def training(self, raw_data, settings):
        # function used to train the model
        # Input:
        # raw_data := tuple of numpy arrays
        # settings := dictionary that specifies the settings for the model
        # Output:
        # history := data structure storing information from the training
        # operation.
        #            (should be set to None if there is nothing to saved)

        Xraw, Yraw, _ = raw_data

        # Initialize all variables
        init_op = tf.compat.v1.global_variables_initializer()
        self.sess.run(init_op)

        self.model.fit(Xraw,
                       Yraw,
                       settings["epochs"])

        history = None  # since there is no training history to be saved,
        # history is set to None
        return history

    def predict(self, raw_data, settings):
        # function used to perform predictions
        # Input:
        # raw_data := tuple of numpy arrays
        # settings := dictionary that specifies the settings for the model
        # Output:
        # raw_predictions := tuple of numpy arrays

        Xraw, _, _ = raw_data
        raw_predictions = self.model.predict(Xraw)

        return (raw_predictions)
