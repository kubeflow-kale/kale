from .dispatcher import RegexDispatcherSave


__all__ = 'resource_save'


resource_save = RegexDispatcherSave('resource_save')


@resource_save.register('.*', priority=1)
def resource_all(o, *args, **kwargs):
    t = str(type(o))
    raise NotImplementedError("Unable to serialize object type: " + t)
