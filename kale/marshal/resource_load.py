import dill

from .dispatchers import PatternDispatcher


__all__ = 'resource_load'


resource_load = PatternDispatcher('resource_load')


@resource_load.register('.*', priority=1)
def resource_all(uri, *args, **kwargs):
    print("Loading general object: {}".format(uri))
    return dill.load(open(uri, "rb"))


@resource_load.register('.+::.+', priority=15)
def resource_split(uri, *args, **kwargs):
    uri, other = uri.rsplit('::', 1)
    return resource_load(uri, other, *args, **kwargs)
