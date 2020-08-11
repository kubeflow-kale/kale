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
import pprint
import tempfile

import logging
import logging.handlers

import nbformat as nb
import networkx as nx

from kubernetes.config import ConfigException

from kale.nbparser import parser
from kale.static_analysis import dependencies, ast
from kale.codegen import generate_code
from kale.common import utils, graphutils
from kale.common.podutils import get_docker_base_image
from kale.common.metadatautils import parse_metadata
from kale.common.logutils import get_or_create_logger

KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_notebook'


class Kale:
    """Use this class to convert a Notebook to a KFP py executable."""
    def __init__(self,
                 source_notebook_path: str,
                 notebook_metadata_overrides: dict = None,
                 debug: bool = False):
        self.source_path = os.path.expanduser(str(source_notebook_path))
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

        # used to set container step working dir same as current environment
        abs_working_dir = utils.get_abs_working_dir(self.source_path)
        self.pipeline_metadata['abs_working_dir'] = abs_working_dir
        self.detect_environment()

        # set up logging
        level = logging.DEBUG if debug else logging.INFO
        log_path = os.path.join(".", "kale.log")
        self.logger = get_or_create_logger(module=__name__, level=level,
                                           log_path=log_path)

        # mute other loggers
        logging.getLogger('urllib3.connectionpool').setLevel(logging.CRITICAL)

    def detect_environment(self):
        """Detect local confs to preserve reproducibility in pipeline steps."""
        # When running inside a Kubeflow Notebook Server we can detect the
        # running docker image and use it as default in the pipeline steps.
        if not self.pipeline_metadata['docker_image']:
            docker_image = ""
            try:
                # will fail in case in cluster config is not found
                docker_image = get_docker_base_image()
            except ConfigException:
                # no K8s config found
                # use kfp default image
                pass
            except Exception:
                # some other exception
                raise
            self.pipeline_metadata["docker_image"] = docker_image

    def notebook_to_graph(self):
        """Convert an annotated Notebook to a Graph."""
        # convert notebook to nx graph
        (pipeline_graph,
         pipeline_parameters_source,
         pipeline_metrics_source,
         imports_and_functions) = parser.parse_notebook(self.notebook,
                                                        self.pipeline_metadata)

        # get a dict from the 'pipeline parameters' cell source code
        pipeline_parameters_dict = ast.parse_assignments_expressions(
            pipeline_parameters_source)

        # get a list of variables that need to be logged as pipeline metrics
        pipeline_metrics = ast.parse_metrics_print_statements(
            pipeline_metrics_source)

        # run static analysis over the source code
        dependencies.dependencies_detection(
            pipeline_graph,
            pipeline_parameters=pipeline_parameters_dict,
            imports_and_functions=imports_and_functions
        )
        dependencies.assign_metrics(pipeline_graph, pipeline_metrics)

        # if there are multiple DAG leaves, add an empty step at the end of the
        # pipeline for final snapshot
        leaf_steps = graphutils.get_leaf_nodes(pipeline_graph)
        if self.pipeline_metadata.get("autosnapshot") and len(leaf_steps) > 1:
            auto_snapshot_name = 'final_auto_snapshot'
            # add a link from all the last steps of the pipeline to
            # the final auto snapshot one.
            for node in leaf_steps:
                pipeline_graph.add_edge(node, auto_snapshot_name)
            step_defaults = parser.parse_steps_defaults(
                self.pipeline_metadata.get("steps_defaults", []))
            data = {auto_snapshot_name: {
                "source": "", "ins": [], "outs": [],
                "annotations": step_defaults.get("annotations"),
                "labels": step_defaults.get("labels"),
                "limits": step_defaults.get("limits")}}
            nx.set_node_attributes(pipeline_graph, data)

        # TODO: Additional Step required:
        #  Run a static analysis over every step to check that pipeline
        #  parameters are not assigned with new values.
        return pipeline_graph, pipeline_parameters_dict

    def generate_kfp_executable(self, pipeline_graph, pipeline_parameters,
                                save_to_tmp=False):
        """Generate a Python executable starting from a Graph."""
        self.logger.debug("------------- Kale Start Run -------------")

        # generate full kfp pipeline definition
        gen_args = {"nb_graph": pipeline_graph,
                    "nb_path": os.path.abspath(self.source_path),
                    "pipeline_parameters": pipeline_parameters,
                    "metadata": self.pipeline_metadata}
        kfp_code = generate_code.gen_kfp_code(**gen_args)

        if save_to_tmp:
            output_path = None
        else:
            notebook_dir = os.path.dirname(self.source_path)
            filename = "{}.kale.py".format(
                self.pipeline_metadata['pipeline_name'])
            output_path = os.path.abspath(os.path.join(notebook_dir, filename))
        # save kfp generated code
        output_path = self.save_pipeline(kfp_code, output_path)
        return output_path

    def print_pipeline(self, pipeline_graph):
        """Prints a complete definition of the pipeline with all the tags."""
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
        """Save Python code to file."""
        if output_path is None:
            # create tmp path
            tmp_dir = tempfile.mkdtemp()
            filename = "kale_pipeline_code_{}.py".format(
                utils.random_string(5))
            output_path = os.path.join(tmp_dir, filename)

        with open(output_path, "w") as f:
            f.write(pipeline_code)
        self.logger.info("Pipeline code saved at {}".format(output_path))
        return output_path
