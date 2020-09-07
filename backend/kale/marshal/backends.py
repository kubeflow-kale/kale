#  Copyright 2019-2020 The Kale Authors
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

import dill
import logging

from .resource_load import resource_load
from .resource_save import resource_save
from .resource_load import resource_all as fallback_load
from .resource_save import resource_all as fallback_save


log = logging.getLogger(__name__)


def _get_obj_name(s):
    return s.split('/')[-1]


@resource_load.register(r'.*\.pyfn')
def resource_function_load(uri, **kwargs):
    """Load a Python function."""
    log.info("Loading function: %s", _get_obj_name(uri))
    return dill.load(open(uri, "rb"))


@resource_save.register(r'function')
def resource_function_save(obj, path, **kwargs):
    """Save a Python function."""
    log.info("Saving function: %s", _get_obj_name(path))
    with open(path + ".pyfn", "wb") as f:
        dill.dump(obj, f)


@resource_load.register(r'.*\.npy')  # match anything ending in .npy
def resource_numpy_load(uri, **kwargs):
    """Load a numpy resource."""
    try:
        import numpy as np
        log.info("Loading numpy obj: %s", _get_obj_name(uri))
        return np.load(uri)
    except ImportError:
        return fallback_load(uri, **kwargs)


@resource_save.register(r'numpy\..*')
def resource_numpy_save(obj, path, **kwargs):
    """Save a numpy resource."""
    try:
        import numpy as np
        log.info("Saving numpy obj: %s", _get_obj_name(path))
        np.save(path + ".npy", obj)
    except ImportError:
        fallback_save(obj, path, **kwargs)


@resource_load.register(r'.*\.pdpkl')
def resource_pandas_load(uri, **kwargs):
    """Load a pandas resource."""
    try:
        import pandas as pd
        log.info("Loading pandas obj: %s", _get_obj_name(uri))
        return pd.read_pickle(uri)
    except ImportError:
        return fallback_load(uri, **kwargs)


@resource_save.register(r'pandas\..*(DataFrame|Series)')
def resource_pandas_save(obj, path, **kwargs):
    """Save a pandas DataFrame or Series."""
    try:
        import pandas as pd  # noqa: F401
        log.info("Saving pandas obj: %s", _get_obj_name(path))
        obj.to_pickle(path + '.pdpkl')
    except ImportError:
        fallback_save(obj, path, **kwargs)


@resource_load.register(r'.*\.pt')
def resource_torch_load(uri, **kwargs):
    """Load a torch resource."""
    try:
        import torch
        log.info("Loading PyTorch model: %s", _get_obj_name(uri))
        obj_torch = torch.load(uri, pickle_module=dill)
        if "nn.Module" in str(type(obj_torch)):
            # if the object is a Module we need to run eval
            obj_torch.eval()
        return obj_torch
    except ImportError:
        return fallback_load(uri, **kwargs)


@resource_save.register(r'torch.*')
def resource_torch_save(obj, path, **kwargs):
    """Save a torch resource."""
    try:
        import torch
        log.info("Saving PyTorch model: %s", _get_obj_name(path))
        torch.save(obj, path + ".pt", pickle_module=dill)
    except ImportError:
        fallback_save(obj, path, **kwargs)


@resource_load.register(r'.*\.keras')
def resource_keras_load(uri, **kwargs):
    """Load a Keras model."""
    try:
        from keras.models import load_model
        log.info("Loading Keras model: %s", _get_obj_name(uri))
        obj_keras = load_model(uri)
        return obj_keras
    except ImportError:
        return fallback_load(uri, **kwargs)


@resource_save.register(r'keras.*')
def resource_keras_save(obj, path, **kwargs):
    """Save a Keras model."""
    try:
        log.info("Saving Keras model: %s", _get_obj_name(path))
        obj.save(path + ".keras")
    except ImportError:
        fallback_save(obj, path, **kwargs)


@resource_load.register(r'.*\.tfkeras')
def resource_tf_load(uri, **kwargs):
    """Load a Keras model."""
    try:
        from tensorflow.keras.models import load_model
        log.info(f"Loading tf.Keras model: {uri}")
        obj_tfkeras = load_model(uri)
        return obj_tfkeras
    except ImportError:
        return fallback_load(uri, **kwargs)


@resource_save.register(r'tensorflow.python.keras.*')
def resource_tf_save(obj, path, **kwargs):
    """Save a tf.Keras model."""
    try:
        log.info("Saving Keras model: %s", _get_obj_name(path))
        obj.save(path + ".tfkeras")
    except ImportError:
        fallback_save(obj, path, **kwargs)
