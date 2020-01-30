import os
import copy
import json
import pprint
import tempfile

import logging
import subprocess
import logging.handlers

import nbformat as nb
import networkx as nx

from kubernetes.config import ConfigException

from kale.nbparser import parser
from kale.static_analysis import dependencies, ast
from kale.codegen import generate_code
from kale.utils.utils import random_string
from kale.utils.pod_utils import get_namespace, get_docker_base_image
from kale.utils.metadata_utils import parse_metadata

NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE = """\
This is a snapshot of notebook {} in namespace {}.

This snapshot was created by Kale in order to clone the volumes of the notebook
and use them to spawn a Kubeflow pipeline.\
"""

KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook'


class Kale:
    def __init__(self,
                 source_notebook_path: str,
                 notebook_metadata_overrides: dict = None,
                 debug: bool = False,
                 auto_snapshot: bool = False):
        self.auto_snapshot = auto_snapshot
        self.source_path = str(source_notebook_path)
        if not os.path.exists(self.source_path):
            raise ValueError("Path {} does not exist".format(self.source_path))

        # read notebook
        self.notebook = nb.read(self.source_path,
                                as_version=nb.NO_CONVERT)

        # read Kale notebook metadata.
        # In case it is not specified get an empty dict
        notebook_metadata = self.notebook.metadata.get(
            KALE_NOTEBOOK_METADATA_KEY, dict())
        # override notebook metadata with provided arguments
        if notebook_metadata_overrides:
            notebook_metadata.update(notebook_metadata_overrides)

        # validate metadata and apply transformations when needed
        self.pipeline_metadata = parse_metadata(notebook_metadata)

        self.detect_environment()

        # setup logging
        self.logger = logging.getLogger("kubeflow-kale")
        formatter = logging.Formatter(
            '%(asctime)s | %(name)s |  %(levelname)s: %(message)s',
            datefmt='%m-%d %H:%M')
        self.logger.setLevel(logging.DEBUG)

        stream_handler = logging.StreamHandler()
        if debug:
            stream_handler.setLevel(logging.DEBUG)
        else:
            stream_handler.setLevel(logging.INFO)
        stream_handler.setFormatter(formatter)

        self.log_dir_path = "."
        file_handler = logging.FileHandler(
            filename=self.log_dir_path + '/kale.log', mode='a')
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.DEBUG)

        self.logger.addHandler(file_handler)
        self.logger.addHandler(stream_handler)

        # mute other loggers
        logging.getLogger('urllib3.connectionpool').setLevel(logging.CRITICAL)

        # Replace all requested cloned volumes with the snapshotted PVCs
        volumes = self.pipeline_metadata['volumes'][:] \
            if self.pipeline_metadata['volumes'] else []
        self.pipeline_metadata['volumes'] = self.create_cloned_volumes(volumes)

    def run_cmd(self, cmd):
        p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE)
        exit_code = p.wait()
        out = p.stdout.read()
        err = p.stderr.read()
        if exit_code:
            msg = "Command '{}' failed with exit code: {}".format(cmd,
                                                                  exit_code)
            self.logger.error("{}:{}".format(msg, err))
            raise RuntimeError(msg)

        return out

    def _get_cloned_volume(self, volume, snapshot_volumes):
        for snap in snapshot_volumes:
            if snap['mount_point'] == volume['mount_point']:
                volume = copy.deepcopy(volume)
                volume['type'] = 'new_pvc'
                volume['annotations'] = [{'key': 'rok/origin',
                                          'value': snap['rok_url']}]
                return volume

        msg = "Volume '{}' not found in notebook snapshot"
        msg = msg.format(volume['name'])
        raise ValueError(msg)

    def create_cloned_volumes(self, volumes):
        if not any(v['type'] == 'clone' for v in volumes):
            return volumes

        # FIXME: Make sure the bucket exists
        bucket_name = "notebooks"
        hostname = os.getenv("HOSTNAME")
        # FIXME: Import the Rok client instead of spawning external commands
        namespace = get_namespace()
        commit_title = "Snapshot of notebook {}".format(hostname)
        commit_message = NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE.format(hostname,
                                                                 namespace)
        output_cmd = (
                "rok-gw -o json object-register jupyter"
                + " '{}' '{}' --no-interactive".format(bucket_name, hostname)
                + " --param namespace='{}'".format(namespace)
                + " --param commit_title='{}'".format(commit_title)
                + " --param commit_message='{}'".format(commit_message))
        output = self.run_cmd(output_cmd)

        output = json.loads(output)
        snapshot_volumes = output['result']['version']['group_members']

        # Retrieve the mount point of each snapshotted volume
        for v in snapshot_volumes:
            obj_name = v["object_name"]
            version_name = v["version_name"]
            output_cmd = (
                    "rok-gw -o json object-show '{}'".format(bucket_name)
                    + " '{}' --version '{}'".format(obj_name, version_name)
                    + " --detail")
            output = self.run_cmd(output_cmd)
            v["mount_point"] = json.loads(output)["metadata"]["mountpoint"]

        _volumes = []
        for volume in volumes or []:
            if volume['type'] == 'clone':
                volume = self._get_cloned_volume(volume, snapshot_volumes)
            _volumes.append(volume)

        return _volumes

    def detect_environment(self):
        """
        Detect local configs to preserve reproducibility of
        dev env in pipeline steps
        """
        # used to set container step working dir same as current environment
        self.pipeline_metadata['abs_working_dir'] = os.path.dirname(
            os.path.abspath(self.source_path))

        # When running inside a Kubeflow Notebook Server we can detect the
        # running docker image and use it as default in the pipeline steps.
        if not self.pipeline_metadata['docker_image']:
            try:
                # will fail in case in cluster config is not found
                self.pipeline_metadata['docker_image'] = get_docker_base_image()
            except ConfigException:
                # no K8s config found
                # use kfp default image
                pass
            except Exception:
                # some other exception
                raise

    def notebook_to_graph(self):
        # convert notebook to nx graph
        pipeline_graph, pipeline_parameters_source = parser.parse_notebook(
            self.notebook)

        # get a dict from the 'pipeline parameters' cell source code
        pipeline_parameters_dict = ast.parse_assignments_expressions(
            pipeline_parameters_source)

        # run static analysis over the source code
        to_ignore = set(pipeline_parameters_dict.keys())
        dependencies.dependencies_detection(pipeline_graph,
                                            ignore_symbols=to_ignore)

        # add an empty step at the end of the pipeline for final snapshot
        if self.auto_snapshot:
            auto_snapshot_name = 'final_auto_snapshot'
            # add a link from all the last steps of the pipeline to
            # the final auto snapshot one.
            leaf_steps = [x for x in pipeline_graph.nodes()
                          if pipeline_graph.out_degree(x) == 0]
            for node in leaf_steps:
                pipeline_graph.add_edge(node, auto_snapshot_name)
            data = {auto_snapshot_name: {'source': '', 'ins': [], 'outs': []}}
            nx.set_node_attributes(pipeline_graph, data)

        # TODO: Additional Step required:
        #  Run a static analysis over every step to check that pipeline
        #  parameters are not assigned with new values.
        return pipeline_graph, pipeline_parameters_dict

    def generate_kfp_executable(self, pipeline_graph, pipeline_parameters,
                                save_to_tmp=False):
        self.logger.debug("------------- Kale Start Run -------------")

        # generate full kfp pipeline definition
        kfp_code = generate_code.gen_kfp_code(nb_graph=pipeline_graph,
                                              nb_path=os.path.abspath(
                                                  self.source_path),
                                              pipeline_parameters=pipeline_parameters,
                                              metadata=self.pipeline_metadata,
                                              auto_snapshot=self.auto_snapshot)

        if save_to_tmp:
            output_path = None
        else:
            notebook_dir = os.path.dirname(self.source_path)
            filename = f"{self.pipeline_metadata['pipeline_name']}.kale.py"
            output_path = os.path.join(notebook_dir, filename)
        # save kfp generated code
        output_path = self.save_pipeline(kfp_code, output_path)
        return output_path

    def print_pipeline(self, pipeline_graph):
        """
        Prints a complete definition of the pipeline with all the tags
        """
        for block_name in nx.topological_sort(pipeline_graph):
            block_data = pipeline_graph.nodes(data=True)[block_name]

            print("Block: {}".format(block_name))
            print("Previous Blocks:")
            if 'previous_blocks' in block_data['tags']:
                pprint.pprint(block_data['tags']['previous_blocks'], width=1)
            print("Ins")
            if 'ins' in block_data:
                pprint.pprint(sorted(block_data['ins']), width=1)
            print("Outs")
            if 'outs' in block_data:
                pprint.pprint(sorted(block_data['outs']), width=1)
            print()
            print("-------------------------------")
            print()

    def to_dot(self, graph, dot_path):
        """Write the graph to a dot file.

        Args:
            graph: NetworkX graph instance
            dot_path: Path to .dot file location
        """
        nx.drawing.nx_pydot.write_dot(graph, dot_path)

    def save_pipeline(self, pipeline_code, output_path=None):
        if output_path is None:
            # create tmp path
            tmp_dir = tempfile.mkdtemp()
            filename = f"kale_pipeline_code_{random_string(5)}.py"
            output_path = os.path.join(tmp_dir, filename)

        with open(output_path, "w") as f:
            f.write(pipeline_code)
        self.logger.info(f"Pipeline code saved at {output_path}")
        return output_path
