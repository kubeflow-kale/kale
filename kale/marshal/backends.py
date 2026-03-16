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

import logging

from kale.marshal.backend import MarshalBackend, get_dispatcher

log = logging.getLogger(__name__)


register_backend = get_dispatcher().register


@register_backend
class FunctionBackend(MarshalBackend):
    """Marshal Python functions."""

    name = "Function backend"
    display_name = "function"
    file_type = "pyfn"
    obj_type_regex = r"function"


@register_backend
class SKLearnBackend(MarshalBackend):
    """Marshal SKLearn objects."""

    name = "SKLearn backend"
    display_name = "scikit-learn"
    file_type = "joblib"
    obj_type_regex = r"sklearn\..*"
    predictor_type = "sklearn"

    # `joblib` is a separate library from sklearn that must be installed
    # independently. Don't fallback to dill since this will break when
    # serving models.
    fallback_on_missing_lib = False

    def save(self, obj, path):
        """Save a SKLearn object."""
        import joblib

        joblib.dump(obj, path)

    def load(self, file_path):
        """Restore a SKLearn object."""
        import joblib

        return joblib.load(file_path)


@register_backend
class NumpyBackend(MarshalBackend):
    """Marshal Numpy objects functions."""

    name = "Numpy backend"
    display_name = "numpy"
    file_type = "npy"
    obj_type_regex = r"numpy\..*"

    def save(self, obj, path):
        """Save a Numpy object."""
        import numpy as np

        np.save(path, obj)

    def load(self, file_path):
        """Restore a Numpy object."""
        import numpy as np

        return np.load(file_path)


@register_backend
class PandasBackend(MarshalBackend):
    """Marshal Pandas objects."""

    name = "Pandas backend"
    display_name = "pandas"
    file_type = "pdpkl"
    obj_type_regex = r"pandas\..*(DataFrame|Series)"

    def save(self, obj, path):
        """Save a Pandas object."""
        import pandas as pd  # noqa: F401

        obj.to_pickle(path)

    def load(self, file_path):
        """Restore a Pandas object."""
        import pandas as pd

        return pd.read_pickle(file_path)


@register_backend
class XGBoostModelBackend(MarshalBackend):
    """Marshal XGBoost Model object."""

    name = "XGBoost Model backend"
    display_name = "xgboost"
    file_type = "bst"
    obj_type_regex = r"xgboost\.core\.Booster"
    predictor_type = "xgboost"

    def save(self, obj, path):
        """Save an XGBoost Model object."""
        obj.save_model(path)

    def load(self, file_path):
        """Restore an XGBoost Model object."""
        import xgboost as xgb

        obj_xgb = xgb.Booster()
        obj_xgb.load_model(file_path)
        return obj_xgb


@register_backend
class XGBoostDMatrixBackend(MarshalBackend):
    """Marshal XGBoost DMatrix object."""

    name = "XGBoost DMatrix backend"
    display_name = "xgboost-dmatrix"
    file_type = "dmatrix"
    obj_type_regex = r"xgboost\.core\.DMatrix"

    def save(self, obj, path):
        """Save an XGBoost DMatrix object."""
        obj.save_binary(path)

    def load(self, file_path):
        """Restore an XGBoost DMatrix object."""
        import xgboost as xgb

        return xgb.DMatrix(file_path)


@register_backend
class PyTorchBackend(MarshalBackend):
    """Marshal PyTorch objects."""

    name = "PyTorch backend"
    display_name = "pytorch"
    file_type = "pt"
    obj_type_regex = r"torch\.nn\.modules\.module\.Module"

    def save(self, obj, path):
        """Save a PyTorch object."""
        import torch

        model_script = torch.jit.script(obj)
        model_script.save(path)

    def load(self, file_path):
        """Restore a PyTorch object."""
        import torch

        obj_torch = torch.jit.load(file_path)
        # `jit.load` returns a `ScirptModule` object.
        # To turn it into a PyTorch `Module` again
        # we pass it inside a `Sequential` container.
        # The `Sequential` container is a wrapper
        # that feeds the data to the modules it contains in order.
        # Here, we create a `Sequential` container
        # with only one item, so it works like a wrapper
        # function around our model.
        obj_torch = torch.nn.Sequential(obj_torch)
        obj_torch.eval()
        return obj_torch


@register_backend
class KerasBackend(MarshalBackend):
    """Marshal Keras objects."""

    name = "Keras backend"
    display_name = "keras"
    file_type = "keras"
    obj_type_regex = r"keras\..*"

    def save(self, obj, path):
        """Save a Keras object."""
        import keras  # noqa: F401

        obj.save(path)

    def load(self, file_path):
        """Restore a Keras object."""
        from keras.models import load_model

        return load_model(file_path)


@register_backend
class TensorflowKerasBackend(MarshalBackend):
    """Marshal Tensorflow Keras objects."""

    name = "Tensorflow backend"
    display_name = "tensorflow"
    file_type = "tfkeras"
    obj_type_regex = r"tensorflow\.python\.keras.*"
    predictor_type = "tensorflow"

    def save(self, obj, path):
        """Save a Tensorflow Keras object."""
        import tensorflow.keras  # noqa: F401

        # XXX: Adding `/1` since tensorflow serve expects the model's models
        #  to be saved under a versioned folder
        obj.save(path + "/1")

    def load(self, file_path):
        """Restore a Tensorflow Keras object."""
        from tensorflow.keras.models import load_model

        try:
            obj = load_model(file_path, compile=False)
        except OSError:
            # XXX: try to load a model that was saved within a versioned
            #  folder (for tensorflow serve)
            obj = load_model(file_path + "/1", compile=False)
        return obj
