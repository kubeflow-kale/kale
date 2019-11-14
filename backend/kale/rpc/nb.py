from kale.core import Kale
from kale.utils import pod_utils, kfp_utils


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


def get_base_image():
    return pod_utils.get_docker_base_image()


def compile_notebook(source_notebook_path, notebook_metadata_overrides=None,
                     debug=False, auto_snapshot=False):
    instance = Kale(source_notebook_path, notebook_metadata_overrides,
                    debug, auto_snapshot)
    pipeline_graph, pipeline_parameters = instance.notebook_to_graph()
    script_path = instance.generate_kfp_executable(pipeline_graph,
                                                   pipeline_parameters)

    pipeline_name = instance.pipeline_metadata["pipeline_name"]
    package_path = kfp_utils.compile_pipeline(script_path, pipeline_name)

    return {"pipeline_package_path": package_path,
            "pipeline_metadata": instance.pipeline_metadata}
