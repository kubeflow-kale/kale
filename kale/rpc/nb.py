import os
import shutil

from kale.core import Kale
from kale.utils import pod_utils, kfp_utils
from kale.marshal import resource_load


KALE_MARSHAL_DIR_POSTFIX = ".kale.marshal.dir"
KALE_PIPELINE_STEP_ENV = "KALE_PIPELINE_STEP"


def resume_notebook_path():
    p = os.environ.get("KALE_NOTEBOOK_PATH")
    if p and not os.path.isfile(p):
        raise RuntimeError("env path KALE_NOTEBOOK_PATH=%s is not a file" % p)
    if not p:
        return None

    home = os.environ.get("HOME")
    if not home.endswith('/'):
        home = home + '/'

    # JupyterLab needs a relative path to open a file
    # JP should always run form the HOME directory, so we strip the
    # leading HOME from the absolute path
    if p.startswith(home):
        return p[len(home):]
    else:
        return p


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
    kale_marshal_dir = ".%s%s" % (source_notebook_path,
                                  KALE_MARSHAL_DIR_POSTFIX)
    if not os.path.exists(kale_marshal_dir):
        return {}

    load_file_names = [f for f in os.listdir(kale_marshal_dir)
                       if os.path.isfile(os.path.join(kale_marshal_dir, f))]

    return {os.path.splitext(f)[0]:
            resource_load(os.path.join(kale_marshal_dir, f))
            for f in load_file_names}


def explore_notebook(source_notebook_path):
    step_name = os.getenv(KALE_PIPELINE_STEP_ENV, None)
    kale_marshal_dir = ".%s%s" % (source_notebook_path,
                                  KALE_MARSHAL_DIR_POSTFIX)

    if step_name and os.path.exists(kale_marshal_dir):
        return {"is_exploration": True,
                "step_name": step_name}
    return {"is_exploration": False,
            "step_name": ""}


def remove_marshal_dir(source_notebook_path):
    kale_marshal_dir = ".%s%s" % (source_notebook_path,
                                  KALE_MARSHAL_DIR_POSTFIX)
    if os.path.exists(kale_marshal_dir):
        shutil.rmtree(kale_marshal_dir)
