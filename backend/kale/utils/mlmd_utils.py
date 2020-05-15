# Copyright 2020 The Kale Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Suite of helpers integrating Kale with ML-Metadata.

Implementation inspired by KFP Metadata Writer.
"""

import os
import json
import time
import logging

from ml_metadata.proto import metadata_store_pb2
from ml_metadata.metadata_store import metadata_store

from kale.utils import utils, pod_utils


DEFAULT_METADATA_GRPC_SERVICE_SERVICE_HOST = ("metadata-grpc-service.kubeflow"
                                              ".svc")
DEFAULT_METADATA_GRPC_SERVICE_SERVICE_PORT = 8080

ARGO_WORKFLOW_LABEL_KEY = "workflows.argoproj.io/workflow"

RUN_CONTEXT_TYPE_NAME = "KfpRun"
KFP_EXECUTION_TYPE_NAME_PREFIX = "components."

METADATA_CONTEXT_ID_LABEL_KEY = "pipelines.kubeflow.org/metadata_context_id"
METADATA_EXECUTION_ID_LABEL_KEY = ("pipelines.kubeflow.org/"
                                   "metadata_execution_id")
METADATA_ARTIFACT_IDS_ANNOTATION_KEY = ("pipelines.kubeflow.org/"
                                        "metadata_artifact_ids")
METADATA_INPUT_ARTIFACT_IDS_ANNOTATION_KEY = ("pipelines.kubeflow.org/"
                                              "metadata_input_artifact_ids")
METADATA_OUTPUT_ARTIFACT_IDS_ANNOTATION_KEY = ("pipelines.kubeflow.org/"
                                               "metadata_output_artifact_ids")
METADATA_WRITTEN_LABEL_KEY = "pipelines.kubeflow.org/metadata_written"

ROK_SNAPSHOT_ARTIFACT_TYPE_NAME = "RokSnapshot"
ROK_SNAPSHOT_ARTIFACT_PROPERTIES = {"name": metadata_store_pb2.STRING,
                                    "id": metadata_store_pb2.STRING,
                                    "version": metadata_store_pb2.STRING,
                                    "object": metadata_store_pb2.STRING,
                                    "bucket": metadata_store_pb2.STRING,
                                    "members": metadata_store_pb2.INT,
                                    "URL": metadata_store_pb2.STRING,
                                    "hash": metadata_store_pb2.STRING}
MLMD_EXECUTION_HASH_PROPERTY_KEY = "arrikto.com/execution-hash-key"
MLMD_EXECUTION_POD_NAME_PROPERTY_KEY = "kfp_pod_name"
MLMD_EXECUTION_CACHE_POD_NAME_PROPERTY_KEY = "pod_name"
MLMD_EXECUTION_POD_NAMESPACE_PROPERTY_KEY = "pod_namespace"
MLMD_EXECUTION_STATE_KEY = "state"

KALE_EXECUTION_STATE_KEY = "kubeflow-kale.org/state"
KALE_EXECUTION_STATE_RUNNING = "RUNNING"
KALE_EXECUTION_STATE_COMPLETED = "COMPLETE"
KALE_EXECUTION_STATE_CACHED = "CACHED"
KALE_EXECUTION_STATE_FAILED = "FAILED"


log = logging.getLogger(__name__)

mlmd_instance = None


class MLMetadata(object):
    """Contains all context for a Kale step's ML-Metadata representation."""
    def __init__(self):
        self.store = self._connect()
        self.pod_name = pod_utils.get_pod_name()
        self.pod_namespace = pod_utils.get_namespace()
        self.pod = pod_utils.get_pod(self.pod_name, self.pod_namespace)
        self.workflow_name = self.pod.metadata.labels.get(
            ARGO_WORKFLOW_LABEL_KEY)
        self.workflow = pod_utils.get_workflow(self.workflow_name,
                                               self.pod_namespace)

        workflow_labels = self.workflow["metadata"].get("labels", {})
        self.run_uuid = workflow_labels.get(pod_utils.KFP_RUN_ID_LABEL_KEY,
                                            self.workflow_name)

        workflow_annotations = self.workflow["metadata"].get("annotations", {})
        pipeline_spec = json.loads(workflow_annotations.get(
            "pipelines.kubeflow.org/pipeline_spec", {}))
        self.pipeline_name = pipeline_spec.get("name", self.workflow_name)

        self.component_id = pod_utils.compute_component_id(self.pod)
        self.execution_hash = self.pod.metadata.annotations.get(
            MLMD_EXECUTION_HASH_PROPERTY_KEY, utils.random_string(10))

        self.run_context = self._get_or_create_run_context()
        self.execution = self._create_execution_in_run_context()
        self._label_with_context_and_execution()

    @staticmethod
    def _connect():
        def establish_connection(store):
            """Ensure connection to MLMD store by making a request."""
            try:
                _ = store.get_context_types()
                return True
            except Exception as e:
                log.warning("Failed to access the Metadata store. Exception:"
                            " '%s'", str(e))
            return False

        metadata_service_host = os.environ.get(
            "METADATA_GRPC_SERVICE_SERVICE_HOST",
            DEFAULT_METADATA_GRPC_SERVICE_SERVICE_HOST)
        metadata_service_port = int(os.environ.get(
            "METADATA_GRPC_SERVICE_SERVICE_PORT",
            DEFAULT_METADATA_GRPC_SERVICE_SERVICE_PORT))

        mlmd_connection_config = metadata_store_pb2.MetadataStoreClientConfig(
            host=metadata_service_host, port=metadata_service_port)
        mlmd_store = metadata_store.MetadataStore(mlmd_connection_config)

        # We ensure that the connection to MLMD is established by retrying a
        # number of times and sleeping for 1 second between the tries.
        # These numbers are taken from the MetadataWriter implementation.
        for _ in range(100):
            if establish_connection(mlmd_store):
                return mlmd_store
            time.sleep(1)

        raise RuntimeError("Could not connect to the Metadata store.")

    def _get_or_create_artifact_type(self, type_name, properties: dict = None):
        return self._get_or_create_entity_type("artifact", type_name,
                                               properties)

    def _get_or_create_execution_type(self, type_name,
                                      properties: dict = None):
        return self._get_or_create_entity_type("execution", type_name,
                                               properties)

    def _get_or_create_context_type(self, type_name, properties: dict = None):
        return self._get_or_create_entity_type("context", type_name,
                                               properties)

    def _get_or_create_entity_type(self, mlmd_entity, type_name,
                                   properties: dict = None):
        putter = getattr(self.store, "put_%s_type" % mlmd_entity)
        mlmd_entity_type_class = getattr(metadata_store_pb2,
                                         "%sType" % mlmd_entity.title())
        mlmd_entity_type = mlmd_entity_type_class(name=type_name,
                                                  properties=properties)
        mlmd_entity_type.id = putter(mlmd_entity_type, can_add_fields=True)
        return mlmd_entity_type

    def _create_artifact_with_type(self, uri: str, type_name: str,
                                   property_types: dict = None,
                                   properties: dict = None,
                                   custom_properties: dict = None):
        artifact_type = self._get_or_create_artifact_type(
            type_name=type_name, properties=property_types)
        artifact = metadata_store_pb2.Artifact(
            uri=uri, type_id=artifact_type.id, properties=properties,
            custom_properties=custom_properties)
        artifact.id = self.store.put_artifacts([artifact])[0]
        return artifact

    def _create_execution_with_type(self, type_name: str,
                                    property_types: dict = None,
                                    properties: dict = None,
                                    custom_properties: dict = None,
                                    state=None):
        execution_type = self._get_or_create_execution_type(
            type_name=type_name, properties=property_types)
        execution = metadata_store_pb2.Execution(
            type_id=execution_type.id, properties=properties,
            custom_properties=custom_properties,
            last_known_state=state)
        execution.id = self.store.put_executions([execution])[0]
        return execution

    def _create_context_with_type(self, context_name: str, type_name: str,
                                  property_types: dict = None,
                                  properties: dict = None):
        context_type = self._get_or_create_context_type(
            type_name=type_name, properties=property_types)
        context = metadata_store_pb2.Context(name=context_name,
                                             type_id=context_type.id,
                                             properties=properties)
        context.id = self.store.put_contexts([context])[0]
        return context

    def _get_context_by_name(self, context_name: str):
        matching_contexts = [context
                             for context in self.store.get_contexts()
                             if context.name == context_name]
        assert len(matching_contexts) <= 1
        return (None if len(matching_contexts) == 0
                else matching_contexts[0])

    def _get_or_create_context_with_type(self, context_name: str,
                                         type_name: str,
                                         property_types: dict = None,
                                         properties: dict = None):
        context = self._get_context_by_name(context_name)
        if not context:
            context = self._create_context_with_type(
                context_name=context_name, type_name=type_name,
                property_types=property_types, properties=properties)

        return context

    def _get_or_create_run_context(self):
        run_id = metadata_store_pb2.Value(string_value=self.run_uuid)
        workflow_name = metadata_store_pb2.Value(
            string_value=self.workflow_name)
        pipeline_name = metadata_store_pb2.Value(
            string_value=self.pipeline_name)
        context_name = self.workflow_name

        property_types = {"run_id": metadata_store_pb2.STRING,
                          "pipeline_name": metadata_store_pb2.STRING,
                          "workflow_name": metadata_store_pb2.STRING}
        properties = {"run_id": run_id, "pipeline_name": pipeline_name,
                      "workflow_name": workflow_name}

        return self._get_or_create_context_with_type(
            context_name=context_name, type_name=RUN_CONTEXT_TYPE_NAME,
            property_types=property_types, properties=properties)

    def _create_execution_in_run_context(self):
        run_id = metadata_store_pb2.Value(string_value=self.run_uuid)
        pipeline_name = metadata_store_pb2.Value(
            string_value=self.pipeline_name)
        component_id = metadata_store_pb2.Value(string_value=self.component_id)
        state = metadata_store_pb2.Execution.RUNNING
        state_mlmd_value = metadata_store_pb2.Value(
            string_value=KALE_EXECUTION_STATE_RUNNING)

        property_types = {"run_id": metadata_store_pb2.STRING,
                          "pipeline_name": metadata_store_pb2.STRING,
                          "component_id": metadata_store_pb2.STRING,
                          MLMD_EXECUTION_STATE_KEY: metadata_store_pb2.STRING}
        properties = {"run_id": run_id, "pipeline_name": pipeline_name,
                      "component_id": component_id,
                      MLMD_EXECUTION_STATE_KEY: state_mlmd_value}

        exec_hash_mlmd_value = metadata_store_pb2.Value(
            string_value=self.execution_hash)
        pod_name_mlmd_value = metadata_store_pb2.Value(
            string_value=self.pod_name)
        pod_namespace_mlmd = metadata_store_pb2.Value(
            string_value=self.pod_namespace)
        custom_props = {
            MLMD_EXECUTION_HASH_PROPERTY_KEY: exec_hash_mlmd_value,
            MLMD_EXECUTION_POD_NAME_PROPERTY_KEY: pod_name_mlmd_value,
            MLMD_EXECUTION_CACHE_POD_NAME_PROPERTY_KEY: pod_name_mlmd_value,
            MLMD_EXECUTION_POD_NAMESPACE_PROPERTY_KEY: pod_namespace_mlmd,
            KALE_EXECUTION_STATE_KEY: state_mlmd_value}
        execution = self._create_execution_with_type(
            type_name=self.component_id, property_types=property_types,
            properties=properties, custom_properties=custom_props, state=state)

        association = metadata_store_pb2.Association(
            execution_id=execution.id, context_id=self.run_context.id)
        self.store.put_attributions_and_associations([], [association])
        return execution

    def _label_with_context_and_execution(self):
        self.pod = pod_utils.get_pod(self.pod_name, self.pod_namespace)
        labels = self.pod.metadata.labels

        labels.setdefault(METADATA_EXECUTION_ID_LABEL_KEY,
                          str(self.execution.id))
        labels.setdefault(METADATA_CONTEXT_ID_LABEL_KEY,
                          str(self.run_context.id))
        pod_utils.patch_pod(self.pod_name, self.pod_namespace,
                            {"metadata": {"labels": labels}})

    def _annotate_artifacts(self, annotation_key, ids):
        self.pod = pod_utils.get_pod(self.pod_name, self.pod_namespace)
        annotations = self.pod.metadata.annotations

        all_ids_str = annotations.get(annotation_key, "[]")
        all_ids = json.loads(all_ids_str)
        all_ids.extend(ids)
        all_ids.sort()
        all_ids_str = json.dumps(all_ids)
        annotations[annotation_key] = all_ids_str

        pod_utils.patch_pod(self.pod_name, self.pod_namespace,
                            {"metadata": {"annotations": annotations}})

    def _annotate_artifact_inputs(self, ids):
        self._annotate_artifacts(METADATA_INPUT_ARTIFACT_IDS_ANNOTATION_KEY,
                                 ids)

    def _annotate_artifact_outputs(self, ids):
        self._annotate_artifacts(METADATA_OUTPUT_ARTIFACT_IDS_ANNOTATION_KEY,
                                 ids)

    def _link_artifact(self, artifact, event_type):
        artifact_name = artifact.properties["name"].string_value
        step = metadata_store_pb2.Event.Path.Step(key=artifact_name)
        path = metadata_store_pb2.Event.Path(steps=[step])
        event = metadata_store_pb2.Event(execution_id=self.execution.id,
                                         artifact_id=artifact.id,
                                         type=event_type,
                                         path=path)

        self.store.put_events([event])

    def _link_artifact_as_output(self, artifact):
        self._link_artifact(artifact, metadata_store_pb2.Event.OUTPUT)

        attribution = metadata_store_pb2.Attribution(
            context_id=self.run_context.id, artifact_id=artifact.id)
        self.store.put_attributions_and_associations([attribution], [])

    def _link_artifact_as_input(self, artifact):
        self._link_artifact(artifact, metadata_store_pb2.Event.INPUT)

    def _create_rok_artifact_from_task(self, task):
        from rok_gw_client.client import RokClient
        rok_client = RokClient()
        result = task["task"]["result"]
        snapshot_id = result["event"]["id"]
        version = result["event"]["version"]
        obj = result["event"]["object"]
        bucket = task["task"]["bucket"]
        artifact_name = task["task"]["action_params"]["params"]["commit_title"]
        task_info = rok_client.version_info(bucket, obj, version)
        members = int(task_info["group_member_count"])
        url = task_info["rok_url"]
        uri = "/rok/buckets/%s/files/%s/versions/%s" % (bucket, obj, version)
        hash_value = task_info["hash"]

        property_types = ROK_SNAPSHOT_ARTIFACT_PROPERTIES

        values = {"name": metadata_store_pb2.Value(string_value=artifact_name),
                  "id": metadata_store_pb2.Value(string_value=snapshot_id),
                  "version": metadata_store_pb2.Value(string_value=version),
                  "object": metadata_store_pb2.Value(string_value=obj),
                  "bucket": metadata_store_pb2.Value(string_value=bucket),
                  "members": metadata_store_pb2.Value(int_value=members),
                  "URL": metadata_store_pb2.Value(string_value=url),
                  "hash": metadata_store_pb2.Value(string_value=hash_value)}

        custom_properties = dict()
        for i in range(members):
            member_name = "member_%s" % i
            member_obj = task_info.get("group_%s_object" % member_name)
            member_version = task_info.get("group_%s_version" % member_name)
            if not member_obj or not member_version:
                continue
            member_info = rok_client.version_info(bucket, member_obj,
                                                  member_version)
            member_mp = metadata_store_pb2.Value(
                string_value=member_info.get("meta_mountpoint"))
            member_url = metadata_store_pb2.Value(
                string_value=member_info.get("rok_url"))
            member_hash = metadata_store_pb2.Value(
                string_value=member_info.get("hash"))
            custom_properties["%s_URL" % member_name] = member_url
            custom_properties["%s_mount_point" % member_name] = member_mp
            custom_properties["%s_hash" % member_name] = member_hash

        # KFP UI groups Artifacts by run_id/pipeline_name/workspace before
        # switching to contexts:
        # https://github.com/kubeflow/pipelines/pull/2852
        # https://github.com/kubeflow/pipelines/pull/3485#issuecomment-612722767
        custom_properties["run_id"] = metadata_store_pb2.Value(
            string_value=self.run_uuid)

        return self._create_artifact_with_type(uri,
                                               ROK_SNAPSHOT_ARTIFACT_TYPE_NAME,
                                               property_types, values,
                                               custom_properties or None)

    def submit_output_rok_artifact(self, task):
        """Submit a RokSnapshot MLMD Artifact as output.

        Args:
            task: A Rok task as returned from version_register/version_info
        """
        rok_artifact = self._create_rok_artifact_from_task(task)
        self._link_artifact_as_output(rok_artifact)
        self._annotate_artifact_outputs([rok_artifact.id])

    def link_input_rok_artifacts(self):
        """Link previous steps output RokSnapshot artifacts to execution."""
        def _get_output_rok_artifacts(pod_names):
            # We return early if there are no RokSnapshot artifacts in the db
            try:
                rok_snapshot_type_id = self.store.get_artifact_type(
                    type_name=ROK_SNAPSHOT_ARTIFACT_TYPE_NAME).id
            except Exception:
                return []

            output_artifact_ids = []
            annotation = METADATA_OUTPUT_ARTIFACT_IDS_ANNOTATION_KEY
            k8s_client = pod_utils._get_k8s_v1_client()
            for name in pod_names:
                pod = k8s_client.read_namespaced_pod(name, self.pod_namespace)
                ids = json.loads(pod.metadata.annotations.get(annotation,
                                                              "[]"))
                output_artifact_ids.extend(ids)

            return [a for a
                    in self.store.get_artifacts_by_id(output_artifact_ids)
                    if a.type_id == rok_snapshot_type_id]

        # Search in workflow.Status.Nodes for step's parents
        nodes = self.workflow["status"]["nodes"]

        # Find all nodes that are direct ancestors
        parents = []
        for name, node in nodes.items():
            if (self.pod_name in node.get("children", [])
                    and name != self.workflow_name):
                parents.append(name)

        rok_artifacts = _get_output_rok_artifacts(parents)

        # Link artifacts as inputs
        input_ids = []
        for artifact in rok_artifacts:
            input_ids.append(artifact.id)
            self._link_artifact_as_input(artifact)
        self._annotate_artifact_inputs(input_ids)

    def update_execution(self):
        """Submit updated execution."""
        self.store.put_executions([self.execution])

    def update_execution_state(self, state: str = None):
        """Update execution's state."""
        self.execution.properties[
            MLMD_EXECUTION_STATE_KEY].string_value = state
        self.execution.custom_properties[
            KALE_EXECUTION_STATE_KEY].string_value = state
        self.update_execution()

    def mark_execution_complete(self):
        """Mark MLMD Execution's state as COMPLETE."""
        self.update_execution_state(KALE_EXECUTION_STATE_COMPLETED)


def get_mlmd_instance():
    """Get MLMetadata instance."""
    global mlmd_instance
    if not mlmd_instance:
        init_metadata()
    return mlmd_instance


def init_metadata():
    """Initialize MLMetadata instance."""
    global mlmd_instance
    if not mlmd_instance:
        mlmd_instance = MLMetadata()


def call(method, *args, **kwargs):
    """Wrapper for calling a method of MLMetadata instance."""
    getattr(get_mlmd_instance(), method)(*args, **kwargs)
