import dill
import torch
import numpy as np
import pandas as pd

from .resource_load import resource_load
from .resource_save import resource_save


def _get_obj_name(s):
    return s.split('/')[-1]

# TODO Add more backend for common data types

@resource_load.register('.*\.npy')  # match anything ending in .npy
def resource_numpy_load(uri, **kwargs):
    print(f"Loading numpy obj: {_get_obj_name(uri)}")
    return np.load(uri)


@resource_save.register('numpy\..*')
def resource_numpy_save(obj, path, **kwargs):
    print(f"Saving numpy obj: {_get_obj_name(path)}")
    return np.save(path+".npy", obj)


@resource_load.register('.*\.pdpkl')
def resource_pandas_load(uri, **kwargs):
    print(f"Loading pandas obj: {_get_obj_name(uri)}")
    return pd.read_pickle(uri)


@resource_save.register('pandas\..*')
def resource_pandas_save(obj, path, **kwargs):
    print(f"Saving pandas obj: {_get_obj_name(path)}")
    return obj.to_pickle(path+'.pdpkl')


@resource_load.register('.*\.pt')
def resource_torch_load(uri, **kwargs):
    print(f"Loading PyTorch model: {_get_obj_name(uri)}")
    obj_torch = torch.load(uri, pickle_module=dill)
    if "nn.Module" in str(type(obj_torch)):
        # if the object is a Module we need to run eval
        obj_torch.eval()
    return obj_torch


@resource_save.register('torch.*')
def resource_torch_save(obj, path, **kwargs):
    print(f"Saving PyTorch model: {_get_obj_name(path)}")
    return torch.save(obj, path + ".pt", pickle_module=dill)
