import dill

from .dispatchers import TypeDispatcher


__all__ = 'resource_save'


resource_save = TypeDispatcher('resource_save')


@resource_save.register('.*', priority=1)
def resource_all(o, path, *args, **kwargs):
    # save any type of object in a general way
    print("Saving general object: {}".format(path.split('/')[-1]))
    with open(path + ".dillpkl", "wb") as f:
        dill.dump(o, f)
