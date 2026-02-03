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

import os
import yaml
import time
import json
import shutil
import logging
import requests
import kubernetes
import pkg_resources

from typing import Any, Dict, Callable

from kubernetes.client.rest import ApiException

from kale import NotebookProcessor, marshal
from kale.common import (astutils, flakeutils, podutils, k8sutils,
                         jputils, utils)

log = logging.getLogger(__name__)


PREDICTORS = [
    "onnx"
    "custom",
    "triton",
    "pytorch",
    "sklearn",
    "xgboost",
    "tensorflow",
]

CO_GROUP = "serving.kubeflow.org"
CO_VERSION = "v1alpha2"
CO_PLURAL = "inferenceservices"
API_VERSION = "%s/%s" % (CO_GROUP, CO_VERSION)

RAW_TEMPLATE = """\
apiVersion: %s
kind: InferenceService
metadata:
  annotations:
    sidecar.istio.io/inject: "false"
  name: {name}
spec:
  minReplicas: 0
  default:
    predictor:
""" % API_VERSION

PVC_PREDICTOR_TEMPLATE = """\
{predictor}:
  storageUri: "pvc://{pvc_name}{model_path}"
"""

CUSTOM_PREDICTOR_TEMPLATE = """\
container:
   image: {image}
   name: kfserving-container
   ports:
     - containerPort: {port}
   env:
     - name: STORAGE_URI
       value: "pvc://{pvc_name}{model_path}"
"""

TRANSFORMER_CUSTOM_TEMPLATE = """\
custom:
  container:
    command:
      - python3
      - -m
      - "kale.kfserving"
    image: {image}
    name: kfserving-container
    securityContext:
      runAsUser: 0
    env:
    - name: STORAGE_URI
      value: "pvc://{pvc_name}/"
    - name: PVC_MOUNT_POINT
      value: {pvc_mount_point}
"""

PVC_ROOT = os.getenv("HOME")  # assume there is always a PVC mounted at /HOME
TRANSFORMER_ASSETS_DIR = os.path.join(PVC_ROOT,
                                      ".kale.kfserving-transformer.dir")
TRANSFORMER_FN_ASSET_NAME = "transformer_function"
PREDICTOR_MODEL_DIR = os.path.join(PVC_ROOT, ".kale.kfserving.model.dir")
TRANSFORMER_SRC_NOTEBOOK_NAME = "source_notebook.ipynb"


class KFServer(object):
    """Wrapper around a deployed InferenceService.

    Use this class to retrieve information about an InferenceService or to
    hit the prediction endpoint.
    """

    def __init__(self, name: str, spec: str):
        self.name = name
        self.spec = spec

    def __repr__(self):
        """Show an interactive text in notebooks."""
        if utils.is_ipython():
            import IPython
            html = ('InferenceService <pre>%s</pre> serving requests at host'
                    ' <pre>%s</pre><br>'
                    'View model <a href="/models/details/%s/%s"'
                    ' target="_blank" >here</a>'
                    % (self.name,
                       get_inference_service_host(self.name),
                       podutils.get_namespace(),
                       self.name))
            IPython.display.display(IPython.display.HTML(html))
            return ""
        else:
            return super(KFServer, self).__repr__()

    def delete(self):
        """Delete the InferenceService CR."""
        namespace = podutils.get_namespace()
        log.info("Deleting InferenceServer '%s/%s'...", namespace, self.name)
        k8s_co_client = k8sutils.get_co_client()
        k8s_co_client.delete_namespaced_custom_object(CO_GROUP, CO_VERSION,
                                                      namespace, CO_PLURAL,
                                                      self.name)
        log.info("Successfully deleted InferenceService.")

    def predict(self, data: str, tensor=False):
        """Hit the InferenceService endpoint.

        tensor: when set to True, return the result loaded in tensor objects,
                based on the framework being used.
        """
        # FIXME: Change this API to accept a dictionary and perform a
        #  json.dumps instead of relying on the user to do this.
        log.info("Sending a request to the InferenceService...")
        log.info("Getting InferenceService's host...")
        host = get_inference_service_host(self.name)
        headers = {"content-type": "application/json", "Host": host}
        log.info("Sending request to InferenceService...")
        response = requests.post(
            "http://cluster-local-gateway.istio-system/v1/models/"
            "%s:predict" % self.name, data=data,
            headers=headers)
        if response.status_code == 200:
            log.info("Response: %s", utils.shorten_long_string(response.text))
            if tensor:
                return self._to_tensor(json.loads(response.text))
            else:
                return json.loads(response.text)
        else:
            log.error("The request failed with status code %s",
                      response.status_code)
            return response

    def _to_tensor(self, data):
        log.warning("Kale does not yet support converting the predicted"
                    " response to a tensor.")
        return data


def serve(model: Any,
          name: str = None,
          wait: bool = True,
          predictor: str = None,
          preprocessing_fn: Callable = None,
          preprocessing_assets: Dict = None) -> KFServer:
    """Main API used to serve models from a notebook or a pipeline step.

    This function procedurally deploys a KFServing InferenceService, starting
    from a model object. A summary list of actions follows:

    * Autogenerate an InferenceService name, if not provided
    * Process transformer function (and related assets)
    * Dump the model, to a path under a mounted PVC
    * Snapshot the PVC
    * Hydrate a new PVC from the new snapshot
    * Submit an InferenceService CR
    * Monitor the CR until it becomes ready

    FIXME: Improve documentation. Provide some examples in the docstring and
      explain how the preprocessing function parsing works.

    Args:
        model: Model object to be used as a predictor
        name (optional): Name of the predictor. Will be autogenerated if not
            provided
        wait (optional): Wait for the InferenceService to become ready.
            Default: True
        predictor (optional): Predictor type to be used for the
            InferenceService. If not provided it will be inferred using
            the the matching marshalling backends.
        preprocessing_fn (optional): A processing function that will be
            deployed as a KFServing Transformer
        preprocessing_assets (optional): A dictionary with object required by
            the preprocessing function. This is needed in case the
            preprocessing function references global objects.

    Returns: A KFServer instance
    """
    log.info("Starting serve procedure for model '%s'", model)
    if not name:
        name = "%s-%s" % (podutils.get_pod_name(), utils.random_string(5))

    # Validate and process transformer
    if preprocessing_fn:
        _prepare_transformer_assets(preprocessing_fn, preprocessing_assets)

    # Detect predictor type
    predictor_type = marshal.get_backend(model).predictor_type
    if predictor and predictor != predictor_type:
        raise RuntimeError("Trying to create an InferenceService with"
                           " predictor of type '%s' but the model is of type"
                           " '%s'" % (predictor, predictor_type))
    if not predictor_type:
        log.error("Kale does not yet support serving objects with '%s'"
                  " backend.\n\nPlease help us improve Kale by opening a new"
                  " issue at:\n"
                  "https://github.com/kubeflow-kale/kale/issues",
                  marshal.get_backend(model).display_name)
        utils.graceful_exit(-1)
    predictor = predictor_type  # in case `predictor` is None

    volume = podutils.get_volume_containing_path(PVC_ROOT)
    volume_name = volume[1].persistent_volume_claim.claim_name
    log.info("Model is contained in volume '%s'", volume_name)

    # Dump the model
    marshal.set_data_dir(PREDICTOR_MODEL_DIR)
    model_filepath = marshal.save(model, "model")
    log.info("Model saved successfully at '%s'", model_filepath)

    new_pvc_name = volume_name
    # Need an absolute path from the *root* of the PVC. Add '/' if not exists.
    pvc_model_path = "/" + PREDICTOR_MODEL_DIR.lstrip(PVC_ROOT)
    # Tensorflow saves the model's files into a directory by itself
    if predictor == "tensorflow":
        pvc_model_path += "/" + os.path.basename(model_filepath).lstrip("/")

    kfserver = create_inference_service(
        name=name,
        predictor=predictor,
        pvc_name=new_pvc_name,
        model_path=pvc_model_path,
        transformer=preprocessing_fn is not None)

    if wait:
        monitor_inference_service(kfserver.name)
    return kfserver


def _prepare_transformer_assets(fn: Callable, assets: Dict = None):
    notebook_path = jputils.get_notebook_path()
    processor = NotebookProcessor(nb_path=notebook_path,
                                  skip_validation=True)
    fn_source = astutils.get_function_source(fn, strip_signature=False)
    missing_names = flakeutils.pyflakes_report(
        processor.get_imports_and_functions() + "\n" + fn_source)
    if not assets:
        assets = dict()
    if not isinstance(assets, dict):
        ValueError("Please provide preprocessing assets as a dictionary"
                   " mapping variables *names* to their objects")
    missing_assets = [x not in assets.keys() for x in missing_names]
    if any(missing_assets):
        raise RuntimeError("The following abjects are a dependency for the"
                           " provided preprocessing function. Please add the"
                           " to the `preprocessing_assets` dictionary: %s"
                           % [a for a, m in zip(missing_names, missing_assets)
                              if m])
    # save function and assets
    utils.clean_dir(TRANSFORMER_ASSETS_DIR)
    marshal.set_data_dir(TRANSFORMER_ASSETS_DIR)
    marshal.save(fn, TRANSFORMER_FN_ASSET_NAME)
    for asset_name, asset_value in assets.items():
        marshal.save(asset_value, asset_name)
    # save notebook as well
    shutil.copy(notebook_path, os.path.join(TRANSFORMER_ASSETS_DIR,
                                            TRANSFORMER_SRC_NOTEBOOK_NAME))


def create_inference_service(name: str,
                             predictor: str,
                             pvc_name: str,
                             model_path: str,
                             image: str = None,
                             port: int = None,
                             transformer: bool = False,
                             submit: bool = True) -> KFServer:
    """Create and submit an InferenceService.

    Args:
        name (str): Name of the InferenceService CR
        predictor (str): One of serveutils.PREDICTORS
        pvc_name (str): Name of the PVC which contains the model
        model_path (str): Absolute path to the dump of the model
        image (optional): Image to run the InferenceService
        port (optional): To be used in conjunction with `image`. The port where
            the custom endpoint is exposed.
        transformer (bool): True if the InferenceService is to be deployed with
            a transformer.
        submit (bool): Set to False to just create the YAML and not submit the
            CR to the K8s.

    Returns (str): Path to the generated YAML
    """
    if predictor not in PREDICTORS:
        raise ValueError("Invalid predictor: %s. Choose one of %s"
                         % (predictor, PREDICTORS))

    if predictor == "custom":
        if not image:
            raise ValueError("You must specify an image when using a custom"
                             " predictor.")
        if not port:
            raise ValueError("You must specify a port when using a custom"
                             " predictor.")
        predictor_spec = CUSTOM_PREDICTOR_TEMPLATE.format(
            image=image,
            port=port,
            pvc_name=pvc_name,
            model_path=model_path)
    else:
        if image is not None:
            log.info("Creating an InferenceService with predictor '%s'."
                     " Ignoring image...", predictor)
        if port is not None:
            log.info("Creating an InferenceService with predictor '%s'."
                     " Ignoring port...", predictor)
        predictor_spec = PVC_PREDICTOR_TEMPLATE.format(predictor=predictor,
                                                       pvc_name=pvc_name,
                                                       model_path=model_path)

    infs_spec = yaml.safe_load(RAW_TEMPLATE.format(name=name))
    predictor_spec = yaml.safe_load(predictor_spec)
    if predictor == "tensorflow":
        # XXX: TF Server is the only predictor being pulled from an external
        # repository. TFServer container are tagger using the library's version
        # number. All the other predictor are built by the KFServing community
        # and are tagged following KFServing's version number. Default values
        # for these can be set in the `inferenceservice-config` ConfigMap.
        _version = _get_runtime_version(predictor)
        predictor_spec["tensorflow"]["runtimeVersion"] = _version
    infs_spec["spec"]["default"]["predictor"] = predictor_spec

    if transformer:
        transformer_spec = yaml.safe_load(
            TRANSFORMER_CUSTOM_TEMPLATE.format(
                image=podutils.get_docker_base_image(),
                pvc_name=pvc_name,
                pvc_mount_point=PVC_ROOT
            ))
        infs_spec["spec"]["default"]["transformer"] = transformer_spec

    yaml_filename = "%s.kfserving.yaml" % name
    yaml_contents = yaml.dump(infs_spec)
    log.info("Saving InferenceService definition at '%s'", yaml_filename)
    with open(yaml_filename, "w") as yaml_file:
        yaml_file.write(yaml_contents)

    if submit:
        _submit_inference_service(infs_spec, podutils.get_namespace())
        _add_owner_references(name, pvc_name)
    return KFServer(name=name, spec=yaml_contents)


def _get_runtime_version(predictor: str):
    library = [backend.display_name
               for backend in marshal.get_backends().values()
               if backend.predictor_type == predictor]
    if not library:
        raise ValueError("The provided predictor is not backed by any"
                         " Kale marshalling backend.")
    if len(library) > 1:
        raise ValueError("Too many backends are matching the '%s' predictor:"
                         " %s" % (predictor, library))
    return pkg_resources.get_distribution(library[0]).version


def _submit_inference_service(inference_service: Dict, namespace: str):
    k8s_co_client = k8sutils.get_co_client()

    name = inference_service["metadata"]["name"]
    log.info("Creating InferenceService '%s'...", name)
    try:
        k8s_co_client.create_namespaced_custom_object(CO_GROUP, CO_VERSION,
                                                      namespace, CO_PLURAL,
                                                      inference_service)
    except ApiException:
        log.exception("Failed to create InferenceService")
        raise
    log.info("Successfully created InferenceService: %s", name)


def _add_owner_references(infs_name: str, pvc_name: str):
    # add owner reference to the PVC
    log.info("Adding owner references to PVC '%s' for InferenceService '%s'",
             pvc_name, infs_name)
    client = k8sutils.get_v1_client()
    infs = get_inference_service(infs_name)
    pvc = client.read_namespaced_persistent_volume_claim(
        pvc_name, podutils.get_namespace())
    ref = kubernetes.client.V1OwnerReference(api_version=API_VERSION,
                                             kind="InferenceService",
                                             name=infs_name,
                                             uid=infs["metadata"]["uid"])
    if not pvc.metadata.owner_references:
        pvc.metadata.owner_references = [ref]
    else:
        pvc.metadata.owner_references.append(ref)
    client.patch_namespaced_persistent_volume_claim(
        name=pvc_name,
        namespace=podutils.get_namespace(),
        body=pvc)


def monitor_inference_service(name: str):
    """Waits for an InferenceService to become ready.

    An InferenceService is considered ready when two conditions are met:

      1. the ``status.conditions`` field of the CR contains a condition of
         type ``Ready`` with a ``True`` status.
      2. The CR defines a valid host/url for the (default) predictor.

    Args:
        name (str): Name of the KFServing InferenceService
    """
    host = None

    def _is_ready(inference_service):
        if not inference_service.get("status"):
            return False
        for condition in inference_service["status"].get("conditions", []):
            if (condition.get("type") == "Ready"
                    and condition.get("status") == "True"):
                return True
        return False

    while host is None:
        log.info("Waiting for InferenceService '%s' to become ready...", name)
        try:
            inf = get_inference_service(name)
        except ApiException as e:
            log.error("Failed to get InferenceService. ApiException: %s", e)
            return

        if _is_ready(inf):
            try:
                if inf["status"].get("default"):  # v1alpha3
                    host = inf["status"]["default"]["predictor"]["host"]
                elif inf["status"].get("components"):  # v1beta1
                    host = inf["status"]["components"]["predictor"]["url"]
            except KeyError:
                pass
        time.sleep(3)

    log.info("InferenceService '%s' is ready.", name)


def get_inference_service(name: str):
    """Get an InferenceService object."""
    k8s_co_client = k8sutils.get_co_client()
    ns = podutils.get_namespace()
    return k8s_co_client.get_namespaced_custom_object(CO_GROUP, CO_VERSION,
                                                      ns, CO_PLURAL, name)


def get_inference_service_host(name: str) -> str:
    """Get the hostname of the InferenceService.

    Args:
        name (str): Name of the KFServing InferenceService

    Returns:
        str: The status.url field of the InferenceService CR. Empty string
            if ``url`` is not defined.
    """
    inference_service = get_inference_service(name)
    try:
        url = inference_service["status"]["url"]
    except KeyError:
        log.error("Could not find url for InferenceService '%s'", name)
        return ""
    if url.startswith("http://"):
        url = url[len("http://"):]
    return url.replace("example.com", "svc.cluster.local")


def get_inference_service_default_predictor_host(name: str) -> str:
    """Get the hostname of the default predictor.

    This function supports both v1alpha3 and v1beta1 InferenceService CRDs.
    The predictor's url/host is defined in two different fields:

    - ``v1alpha3``: ``status.default.predictor.host``
    - ``v1beta1``: ``status.components.predictor.url``

    Args:
        name (str): Name of the KFServing InferenceService

    Returns:
        str: The host/url field of the (default) predictor. Empty string if
            it cannot be determined.
    """
    inf = get_inference_service(name)
    try:
        if inf["status"].get("default"):  # v1alpha3
            return inf["status"]["default"]["predictor"]["host"]
        elif inf["status"].get("components"):  # v1beta1
            return inf["status"]["components"]["predictor"]["url"]
    except KeyError:
        log.error("Could not find the predictor's url for InferenceService"
                  " '%s'", name)
        return ""
