import os

from kale.core import Kale
from kale.utils import pod_utils, kfp_utils
from kale.marshal import resource_load


KALE_MARSHAL_DIR_POSTFIX = ".kale.marshal.dir"
KALE_PIPELINE_STEP_ENV = "KALE_PIPELINE_STEP"


def resume_notebook_path():
    return os.environ.get("KALE_NOTEBOOK_PATH")


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
                     debug=False):
    instance = Kale(source_notebook_path, notebook_metadata_overrides,
                    debug)
    pipeline_graph, pipeline_parameters = instance.notebook_to_graph()
    script_path = instance.generate_kfp_executable(pipeline_graph,
                                                   pipeline_parameters)

    pipeline_name = instance.pipeline_metadata["pipeline_name"]
    package_path = kfp_utils.compile_pipeline(script_path, pipeline_name)

    return {"pipeline_package_path": package_path,
            "pipeline_metadata": instance.pipeline_metadata}


def unmarshal_data(source_notebook_path):
    kale_marshal_dir = "." + source_notebook_path + KALE_MARSHAL_DIR_POSTFIX
    load_file_names = [f for f in os.listdir(kale_marshal_dir)
                       if os.path.isfile(os.path.join(kale_marshal_dir, f))]

    return {os.path.splitext(f)[0]:
            resource_load(os.path.join(kale_marshal_dir, f))
            for f in load_file_names}


def explore_notebook(source_notebook_path):
    kale_marshal_dir = "." + source_notebook_path + KALE_MARSHAL_DIR_POSTFIX
    step_name = os.getenv(KALE_PIPELINE_STEP_ENV, None)

    if os.path.exists(kale_marshal_dir) and step_name:
        return {"is_exploration": True,
                "step_name": step_name}
    return {"is_exploration": False,
            "step_name": ""}
