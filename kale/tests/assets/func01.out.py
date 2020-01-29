def test():
    import os
    import shutil
    from kale.utils import pod_utils as _kale_pod_utils
    from kale.marshal import resource_save as _kale_resource_save
    from kale.marshal import resource_load as _kale_resource_load

    _kale_data_directory = ""
    if not os.path.isdir(_kale_data_directory):
        os.makedirs(_kale_data_directory, exist_ok=True)
