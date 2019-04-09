from .dispatchers import TypeDispatcher


__all__ = 'resource_save'


resource_save = TypeDispatcher('resource_save')


@resource_save.register('.*', priority=1)
def resource_all(o, *args, **kwargs):
    t = str(type(o))
    raise NotImplementedError("Unable to serialize object type: " + t)
