import dill

from .resource_load import resource_load
from .resource_save import resource_save
from .resource_load import resource_all as fallback_load
from .resource_save import resource_all as fallback_save

# TODO: Add more backends for common data types


def _get_obj_name(s):
    return s.split('/')[-1]


@resource_load.register(r'.*\.npy')  # match anything ending in .npy
def resource_numpy_load(uri, **kwargs):
    try:
        import numpy as np
        print(f"Loading numpy obj: {_get_obj_name(uri)}")
        return np.load(uri)
    except ImportError:
        return fallback_load(uri, **kwargs)


@resource_save.register(r'numpy\..*')
def resource_numpy_save(obj, path, **kwargs):
    try:
        import numpy as np
        print(f"Saving numpy obj: {_get_obj_name(path)}")
        np.save(path + ".npy", obj)
    except ImportError:
        fallback_save(obj, path, **kwargs)


@resource_load.register(r'.*\.pdpkl')
def resource_pandas_load(uri, **kwargs):
    try:
        import pandas as pd
        print(f"Loading pandas obj: {_get_obj_name(uri)}")
        return pd.read_pickle(uri)
    except ImportError:
        return fallback_load(uri, **kwargs)


@resource_save.register(r'pandas\..*')
def resource_pandas_save(obj, path, **kwargs):
    try:
        import pandas as pd
        print(f"Saving pandas obj: {_get_obj_name(path)}")
        obj.to_pickle(path+'.pdpkl')
    except ImportError:
        fallback_save(obj, path, **kwargs)


@resource_load.register(r'.*\.pt')
def resource_torch_load(uri, **kwargs):
    try:
        import torch
        print(f"Loading PyTorch model: {_get_obj_name(uri)}")
        obj_torch = torch.load(uri, pickle_module=dill)
        if "nn.Module" in str(type(obj_torch)):
            # if the object is a Module we need to run eval
            obj_torch.eval()
        return obj_torch
    except ImportError:
        return fallback_load(uri, **kwargs)


@resource_save.register(r'torch.*')
def resource_torch_save(obj, path, **kwargs):
    try:
        import torch
        print(f"Saving PyTorch model: {_get_obj_name(path)}")
        torch.save(obj, path + ".pt", pickle_module=dill)
    except ImportError:
        fallback_save(obj, path, **kwargs)
