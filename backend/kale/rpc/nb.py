#  Copyright 2019-2020 The Kale Authors
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import os
import shutil
import logging
import nbformat

from tabulate import tabulate

from kale.core import Kale
from kale.nbparser import parser
from kale.static_analysis import ast
from kale.marshal import resource_load
from kale.rpc.log import create_adapter
from kale.rpc.errors import RPCInternalError
from kale.common import podutils, kfputils, kfutils

KALE_MARSHAL_DIR_POSTFIX = ".kale.marshal.dir"
KALE_PIPELINE_STEP_ENV = "KALE_PIPELINE_STEP"

logger = create_adapter(logging.getLogger(__name__))


def resume_notebook_path(request, server_root=None):
    """Get the relative path of the notebook found in KALE_NOTEBOOK_PATH.

    server_root is the path to where the jupyter server is running
    (--notebook-dir path, if set, otherwise location of the `jupyter` was run)
    The path is not absolute, but starts with `~` if under HOME.
    """
    p = os.environ.get("KALE_NOTEBOOK_PATH")
    if p and not os.path.isfile(p):
        raise RuntimeError("env path KALE_NOTEBOOK_PATH=%s is not a file" % p)
    if not p:
        return None

    home = os.environ.get("HOME")
    if not home.endswith('/'):
        home = home + '/'

    # JupyterLab needs a relative path to open a file. If server_root is not
    # defined, assume jupyter is running under HOME
    if server_root:
        server_root = os.path.expanduser(server_root)
        if not p.startswith(server_root):
            raise ValueError("Trying to resume a notebook from path %s, but"
                             " the provided server root %s does not match the"
                             " notebook's path." % (p, server_root))
        return p[len(server_root):]
    elif p.startswith(home):
        return p[len(home):]
    else:
        return p


def list_volumes(request):
    """Get the list of mounted volumes."""
    volumes = podutils.list_volumes()
    volumes_out = [{"type": "clone",
                    "name": volume.name,
                    "mount_point": path,
                    "size": size,
                    "size_type": "",
                    "snapshot": False}
                   for path, volume, size in volumes]
    return volumes_out


def get_base_image(request):
    """Get the current pod's docker base image."""
    return podutils.get_docker_base_image()


def compile_notebook(request, source_notebook_path,
                     notebook_metadata_overrides=None, debug=False):
    """Compile the notebook to KFP DSL."""
    instance = Kale(source_notebook_path, notebook_metadata_overrides, debug)
    instance.logger = request.log if hasattr(request, "log") else logger

    pipeline_graph, pipeline_parameters = instance.notebook_to_graph()
    script_path = instance.generate_kfp_executable(pipeline_graph,
                                                   pipeline_parameters)

    pipeline_name = instance.pipeline_metadata["pipeline_name"]
    package_path = kfputils.compile_pipeline(script_path, pipeline_name)

    return {"pipeline_package_path": os.path.relpath(package_path),
            "pipeline_metadata": instance.pipeline_metadata}


def validate_notebook(request, source_notebook_path,
                      notebook_metadata_overrides=None):
    """Validate notebook metadata."""
    # Notebook metadata is validated at class instantiation
    Kale(source_notebook_path, notebook_metadata_overrides)
    return True


def get_pipeline_parameters(request, source_notebook_path):
    """Get the pipeline parameters tagged in the notebook."""
    # read notebook
    log = request.log if hasattr(request, "log") else logger
    try:
        source_notebook_path = os.path.expanduser(source_notebook_path)
        notebook = nbformat.read(source_notebook_path,
                                 as_version=nbformat.NO_CONVERT)
        params_source = parser.get_pipeline_parameters_source(notebook)
        if params_source == '':
            raise ValueError("No pipeline parameters found. Please tag a cell"
                             " of the notebook with the `pipeline-parameters`"
                             " tag.")
        # get a dict from the 'pipeline parameters' cell source code
        params_dict = ast.parse_assignments_expressions(params_source)
    except ValueError as e:
        log.exception("Value Error during parsing of pipeline parameters")
        raise RPCInternalError(details=str(e), trans_id=request.trans_id)
    # convert dict in list so its easier to parse in js
    params = [[k, *v] for k, v in params_dict.items()]
    log.info("Pipeline parameters:")
    for ln in tabulate(params, headers=["name", "type", "value"]).split("\n"):
        log.info(ln)
    return params


def get_pipeline_metrics(request, source_notebook_path):
    """Get the pipeline metrics tagged in the notebook."""
    # read notebook
    log = request.log if hasattr(request, "log") else logger
    try:
        source_notebook_path = os.path.expanduser(source_notebook_path)
        notebook = nbformat.read(source_notebook_path,
                                 as_version=nbformat.NO_CONVERT)
        metrics_source = parser.get_pipeline_metrics_source(notebook)
        if metrics_source == '':
            raise ValueError("No pipeline metrics found. Please tag a cell"
                             " of the notebook with the `pipeline-metrics`"
                             " tag.")
        # get a dict from the 'pipeline parameters' cell source code
        metrics = ast.parse_metrics_print_statements(metrics_source)
    except ValueError as e:
        log.exception("Failed to parse pipeline metrics")
        raise RPCInternalError(details=str(e), trans_id=request.trans_id)
    log.info("Pipeline metrics: {}".format(metrics))
    return metrics


def _get_kale_marshal_dir(source_notebook_path):
    nb_file_name = os.path.basename(source_notebook_path)
    nb_dir_name = os.path.dirname(source_notebook_path)
    kale_marshal_dir_name = ".{}{}".format(nb_file_name,
                                           KALE_MARSHAL_DIR_POSTFIX)
    return os.path.realpath(os.path.join(nb_dir_name, kale_marshal_dir_name))


def unmarshal_data(source_notebook_path):
    """Unmarshal data from the marshal directory."""
    source_notebook_path = os.path.expanduser(source_notebook_path)
    kale_marshal_dir = _get_kale_marshal_dir(source_notebook_path)
    if not os.path.exists(kale_marshal_dir):
        return {}

    load_file_names = [f for f in os.listdir(kale_marshal_dir)
                       if os.path.isfile(os.path.join(kale_marshal_dir, f))]

    return {os.path.splitext(f)[0]:
            resource_load(os.path.join(kale_marshal_dir, f))
            for f in load_file_names}


def explore_notebook(request, source_notebook_path):
    """Check if the notebook is to be resumed at a specific pipeline step."""
    source_notebook_path = os.path.expanduser(source_notebook_path)
    step_name = os.getenv(KALE_PIPELINE_STEP_ENV, None)
    kale_marshal_dir = _get_kale_marshal_dir(source_notebook_path)

    if step_name and os.path.exists(kale_marshal_dir):
        return {"is_exploration": True,
                "step_name": step_name}
    return {"is_exploration": False,
            "step_name": ""}


def remove_marshal_dir(request, source_notebook_path):
    """Remove the marshal directory."""
    source_notebook_path = os.path.expanduser(source_notebook_path)
    kale_marshal_dir = _get_kale_marshal_dir(source_notebook_path)
    if os.path.exists(kale_marshal_dir):
        shutil.rmtree(kale_marshal_dir)


def find_poddefault_labels_on_server(request):
    """Find server's labels that correspond to poddefaults applied."""
    request.log.info("Retrieving PodDefaults applied to server...")
    applied_poddefaults = kfutils.find_applied_poddefaults(
        podutils.get_pod(podutils.get_pod_name(),
                         podutils.get_namespace()),
        kfutils.list_poddefaults())
    pd_names = [pd["metadata"]["name"] for pd in applied_poddefaults]
    request.log.info("Retrieved applied PodDefaults: %s", pd_names)

    labels = kfutils.get_poddefault_labels(applied_poddefaults)
    request.log.info("PodDefault labels applied on server: %s",
                     ", ".join(["%s: %s" % (k, v) for k, v in labels.items()]))
    return labels
