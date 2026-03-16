# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from kale import __version__  # noqa: F401

try:
    from .handlers import setup_handlers
except ImportError:
    setup_handlers = None


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "jupyterlab-kubeflow-kale"}]


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_kubeflow_kale"}]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    if setup_handlers is None:
        server_app.log.warning(
            "jupyterlab_kubeflow_kale handlers not available. "
            "Install kubeflow-kale[jupyter] for full functionality."
        )
        return
    setup_handlers(server_app.web_app)
    name = "jupyterlab-kubeflow-kale"
    server_app.log.info(f"Registered {name} server extension")
