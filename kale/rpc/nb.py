from kale.utils import pod_utils


def list_volumes():
    volumes = pod_utils.list_volumes()
    volumes_out = [{"type": "clone",
                    "name": volume.name,
                    "mount_point": path,
                    "size": size,
                    "size_type": "",
                    "snapshot": False}
                   for path, volume, size in volumes]
    return volumes_out
