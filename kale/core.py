import os
import re
import copy
import json
import pprint
import random
import string

import logging
import subprocess
import logging.handlers

import nbformat as nb
import networkx as nx

from pathlib import Path

from kubernetes.config import ConfigException

from kale.nbparser import parser
from kale.static_analysis import dep_analysis
from kale.codegen import generate_code
from kale.utils.pod_utils import get_namespace, get_docker_base_image


NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE = """\
This is a snapshot of notebook {} in namespace {}.

This snapshot was created by Kale in order to clone the volumes of the notebook
and use them to spawn a Kubeflow pipeline.\
"""

KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook'
METADATA_REQUIRED_KEYS = [
    'experiment_name',
    'pipeline_name',
]


def random_string(size=5, chars=string.ascii_lowercase + string.digits):
    """Generate random string."""
    return "".join(random.choice(chars) for _ in range(size))


class Kale:
    def __init__(self,
                 source_notebook_path: str,
                 notebook_metadata_overrides: dict = None,
                 debug: bool = False,
                 auto_snapshot: bool = False):
        self.auto_snapshot = auto_snapshot
        self.source_path = Path(source_notebook_path)
        if not self.source_path.exists():
            raise ValueError(f"Path {self.source_path} does not exist")

        # read notebook
        self.notebook = nb.read(self.source_path.__str__(), as_version=nb.NO_CONVERT)

        # read Kale notebook metadata. In case it is not specified get an empty dict
        self.pipeline_metadata = self.notebook.metadata.get(KALE_NOTEBOOK_METADATA_KEY, dict())
        # override notebook metadata with provided arguments
        if notebook_metadata_overrides:
            self.pipeline_metadata = {**self.pipeline_metadata,
                                      **{k: v for k, v in notebook_metadata_overrides.items() if v}}

        pipeline_name = "%s-%s" % (self.pipeline_metadata['pipeline_name'],
                                   random_string())
        self.pipeline_metadata['pipeline_name'] = pipeline_name
        self.validate_metadata()
        self.detect_environment()

        # setup logging
        self.logger = logging.getLogger("kubeflow-kale")
        formatter = logging.Formatter('%(asctime)s | %(name)s |  %(levelname)s: %(message)s', datefmt='%m-%d %H:%M')
        self.logger.setLevel(logging.DEBUG)

        stream_handler = logging.StreamHandler()
        if debug:
            stream_handler.setLevel(logging.DEBUG)
        else:
            stream_handler.setLevel(logging.INFO)
        stream_handler.setFormatter(formatter)

        self.log_dir_path = Path(".")
        file_handler = logging.FileHandler(filename=self.log_dir_path / 'kale.log', mode='a')
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

    def validate_metadata(self):
        kale_block_name_regex = r'^[a-z0-9]([-a-z0-9]*[a-z0-9])?$'
        kale_name_msg = ("must consist of lower case alphanumeric characters "
                         "or '-', and must start and end with an alphanumeric"
                         " character.")
        k8s_valid_name_regex = r'^[\.\-a-z0-9]+$'
        k8s_name_msg = ("must consist of lower case alphanumeric characters, "
                        "'-' or '.'")

        # check for required fields
        for required in METADATA_REQUIRED_KEYS:
            if required not in self.pipeline_metadata:
                raise ValueError("Key %s not found. Add this field either on "
                                 "the notebook metadata or as an override" %
                                 required)

        if not re.match(kale_block_name_regex,
                        self.pipeline_metadata['pipeline_name']):
            raise ValueError("Pipeline name  %s" % kale_name_msg)

        volumes = self.pipeline_metadata.get('volumes', [])
        if volumes or isinstance(volumes, list):
            for v in volumes:
                if 'name' not in v:
                    raise ValueError("Provide a valid name for every volume")
                if not re.match(k8s_valid_name_regex, v['name']):
                    raise ValueError(f"PV/PVC resource name {k8s_name_msg}")
                if ('snapshot' in v and
                    v['snapshot'] and
                    (('snapshot_name' not in v) or
                     not re.match(k8s_valid_name_regex, v['snapshot_name']))):
                    raise ValueError(
                        "Provide a valid snapshot resource name if you want to"
                        " snapshot a volume. Snapshot resource name %s" %
                        k8s_name_msg)
        else:
            raise ValueError("Volumes must be a valid list of volumes spec")

    def run_cmd(self, cmd):
        p = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE)
        exit_code = p.wait()
        out = p.stdout.read()
        err = p.stderr.read()
        if exit_code:
            msg = f"Command '{cmd}' failed with exit code: {exit_code}"
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

        msg = f"Volume '{volume['name']}' not found in notebook snapshot"
        raise ValueError(msg)

    def create_cloned_volumes(self, volumes):
        if not any(v['type'] == 'clone' for v in volumes):
            return volumes

        # FIXME: Make sure the bucket exists
        bucket_name = "notebooks"
        hostname = os.getenv("HOSTNAME")
        # FIXME: Import the Rok client instead of spawning external commands
        namespace = get_namespace()
        commit_title = f"Snapshot of notebook {hostname}"
        commit_message = NOTEBOOK_SNAPSHOT_COMMIT_MESSAGE.format(hostname,
                                                                 namespace)
        output = self.run_cmd(f"rok-gw -o json object-register jupyter"
                              f" '{bucket_name}' '{hostname}' --no-interactive"
                              f" --param namespace='{namespace}'"
                              f" --param commit_title='{commit_title}'"
                              f" --param commit_message='{commit_message}'")

        output = json.loads(output)
        snapshot_volumes = output['result']['version']['group_members']

        # Retrieve the mount point of each snapshotted volume
        for v in snapshot_volumes:
            obj_name = v["object_name"]
            version_name = v["version_name"]
            output = self.run_cmd(f"rok-gw -o json object-show '{bucket_name}'"
                                  f" '{obj_name}' --version '{version_name}'"
                                  " --detail")
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
        self.pipeline_metadata['abs_working_dir'] = os.path.dirname(os.path.abspath(self.source_path))

        # When running inside a Kubeflow Notebook Server we can detect the running
        # docker image and use it as default in the pipeline steps.
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
        pipeline_graph, pipeline_parameters_code_block = parser.parse_notebook(self.notebook)

        pipeline_parameters_dict = dep_analysis.pipeline_parameters_detection(pipeline_parameters_code_block)

        # run static analysis over the source code
        dep_analysis.variables_dependencies_detection(pipeline_graph,
                                                      ignore_symbols=set(pipeline_parameters_dict.keys()))

        # TODO: Additional Step required:
        #  Run a static analysis over every step to check that pipeline
        #  parameters are not assigned with new values.
        return pipeline_graph, pipeline_parameters_dict

    def generate_kfp_executable(self, pipeline_graph, pipeline_parameters):
        self.logger.debug("------------- Kale Start Run -------------")

        # generate full kfp pipeline definition
        kfp_code = generate_code.gen_kfp_code(nb_graph=pipeline_graph,
                                              nb_path=os.path.abspath(self.source_path),
                                              pipeline_parameters=pipeline_parameters,
                                              metadata=self.pipeline_metadata,
                                              auto_snapshot=self.auto_snapshot)

        output_path = os.path.join(os.path.dirname(self.source_path),
                                   f"{self.pipeline_metadata['pipeline_name']}.kale.py")
        # save kfp generated code
        self.save_pipeline(kfp_code, output_path)
        return output_path

    def print_pipeline(self, pipeline_graph):
        """
        Prints a complete definition of the pipeline with all the tags
        """
        for block_name in nx.topological_sort(pipeline_graph):
            block_data = pipeline_graph.nodes(data=True)[block_name]

            print(f"Block: {block_name}")
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

    def save_pipeline(self, pipeline_code, output_path):
        # save pipeline code to temp directory
        # tmp_dir = tempfile.mkdtemp()
        # with open(tmp_dir + f"/{filename}", "w") as f:
        #     f.write(pipeline_code)
        # print(f"Pipeline code saved at {tmp_dir}/{filename}")

        # Save pipeline code in the notebook source directory
        with open(output_path, "w") as f:
            f.write(pipeline_code)
        self.logger.info(f"Pipeline code saved at {output_path}")
