import dill
import torch
import numpy as np
import pandas as pd

from .resource_load import resource_load
from .resource_save import resource_save


@resource_load.register('.*\.npy')  # match anything ending in .npy
def resource_numpy_load(uri, **kwargs):
    print("Loading numpy obj")
    return np.load(uri)


@resource_save.register('numpy\..*')
def resource_numpy_save(obj, path, **kwargs):
    print("Saving numpy obj")
    return np.save(path+".npy", obj)


@resource_load.register('.*\.pdpkl')
def resource_pandas_load(uri, **kwargs):
    print("Loading pandas obj")
    return pd.read_pickle(uri)


@resource_save.register('pandas\..*')
def resource_pandas_save(obj, path, **kwargs):
    print("Saving pandas obj")
    return obj.to_pickle(path+'.pdpkl')


@resource_load.register('.*\.pt')
def resource_torch_load(uri, **kwargs):
    print("Loading PyTorch model")
    obj_torch = torch.load(uri, pickle_module=dill)
    if "nn.Module" in str(type(obj_torch)):
        # if the object is a Module we need to run eval
        obj_torch.eval()
    return obj_torch


@resource_save.register('torch.*')
def resource_torch_save(obj, path, **kwargs):
    print("Saving PyTorch model")
    return torch.save(obj, path + ".pt", pickle_module=dill)


