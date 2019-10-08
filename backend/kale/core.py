import os
import re
import pprint
import logging
import logging.handlers
import tempfile

import networkx as nx

from pathlib import Path
from shutil import copyfile

from kale.nbparser import parser
from kale.static_analysis import dep_analysis
from kale.codegen import generate_code


class Kale:
    def __init__(self,
                 source_notebook_path: str,
                 experiment_name,
                 pipeline_name,
                 pipeline_descr,
                 docker_image,
                 volumes,
                 notebook_version=4,
                 upload_pipeline=False,
                 run_pipeline=False,
                 kfp_dns=None,
                 debug=False
                 ):
        self.source_path = Path(source_notebook_path)
        self.output_path = os.path.join(os.path.dirname(self.source_path), f"kfp_{pipeline_name}.kfp.py")
        if not self.source_path.exists():
            raise ValueError(f"Path {self.source_path} does not exist")
        self.nbformat_version = notebook_version

        self.kfp_dns = f"http://{kfp_dns}/pipeline" if kfp_dns is not None else None

        self.upload_pipeline = upload_pipeline
        self.run_pipeline = run_pipeline

        self.experiment_name = experiment_name
        self.pipeline_name = pipeline_name
        self.pipeline_description = pipeline_descr
        self.docker_base_image = docker_image
        self.volumes = volumes

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

    def validate_metadata(self):
        kale_block_name_regex = r'^[a-z0-9]([-a-z0-9]*[a-z0-9])?$'
        kale_name_msg = "must consist of lower case alphanumeric characters or '-', " \
                        "and must start and end with an alphanumeric character."
        k8s_valid_name_regex = r'^[\.\-a-z0-9]+$'
        k8s_name_msg = "must consist of lower case alphanumeric characters, '-' or '.'"

        if not re.match(kale_block_name_regex, self.pipeline_name):
            raise ValueError(f"Pipeline name  {kale_name_msg}")
        for v in self.volumes:
            if 'name' not in v:
                raise ValueError("Provide a valid name for every volume")
            if not re.match(k8s_valid_name_regex, v['name']):
                raise ValueError(f"PV/PVC resource name {k8s_name_msg}")
            if 'snapshot' in v and v['snapshot'] and \
                    (('snapshot_name' not in v) or not re.match(k8s_valid_name_regex, v['snapshot_name'])):
                raise ValueError(
                    f"Provide a valid snapshot resource name if you want to snapshot a volume. Snapshot resource name {k8s_name_msg}")

    def run(self):
        self.logger.debug("------------- Kale Start Run -------------")
        try:
            # validate provided metadata
            self.validate_metadata()

            # convert notebook to nx graph
            pipeline_graph = parser.parse_notebook(self.source_path, self.nbformat_version)

            # run static analysis over the source code
            dep_analysis.variables_dependencies_detection(pipeline_graph)

            # generate full kfp pipeline definition
            kfp_code = generate_code.gen_kfp_code(nb_graph=pipeline_graph,
                                                  experiment_name=self.experiment_name,
                                                  pipeline_name=self.pipeline_name,
                                                  pipeline_description=self.pipeline_description,
                                                  docker_base_image=self.docker_base_image,
                                                  volumes=self.volumes,
                                                  deploy_pipeline=self.run_pipeline)

            # save kfp generated code
            self.save_pipeline(kfp_code)

            # deploy pipeline to KFP instance
            if self.upload_pipeline or self.run_pipeline:
                return self.deploy_pipeline_to_kfp(self.output_path)
        except Exception as e:
            # self.logger.debug(traceback.print_exc())
            self.logger.debug(e, exc_info=True)
            self.logger.error(e)
            self.logger.error("To see full traceback run Kale with --debug flag or have a look at kale.log logfile")

    def deploy_pipeline_to_kfp(self, pipeline_source):
        """
        Import the generated kfp pipeline definition and deploy it
        to a running KFP instance
        """
        import kfp.compiler as compiler
        import kfp
        import importlib.util

        # create a tmp folder
        tmp_dir = tempfile.mkdtemp()
        # copy generated script to temp dir
        copyfile(pipeline_source, tmp_dir + '/' + "pipeline_code.py")

        spec = importlib.util.spec_from_file_location(tmp_dir.split('/')[-1], tmp_dir + '/' + 'pipeline_code.py')
        foo = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(foo)

        pipeline_filename = self.pipeline_name + '.pipeline.tar.gz'
        compiler.Compiler().compile(foo.auto_generated_pipeline, pipeline_filename)

        try:
            # Get or create an experiment and submit a pipeline run
            # client = kfp.Client(host=self.kfp_url)
            client = kfp.Client()

            # upload the pipeline
            if self.upload_pipeline or self.run_pipeline:
                client.upload_pipeline(pipeline_filename, pipeline_name=self.pipeline_name)

            if self.run_pipeline:
                # create experiment or get existing one
                experiment = client.create_experiment(self.experiment_name)
                # Submit a pipeline run
                run_name = self.pipeline_name + '_run'
                run = client.run_pipeline(experiment.id, run_name, pipeline_filename, {})
                run_link = f"{self.kfp_dns}/#/runs/details/{run.id}"
                self.logger.info(f"Deployment Successful. Pipeline run at {run_link}")
        except Exception:
            # remove auto-generated tar package (used for deploy)
            os.remove(self.pipeline_name + '.pipeline.tar.gz')
            # raise again so excp is caught at higher level
            raise

        # sys.path.remove(tmp_dir)

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

    def save_pipeline(self, pipeline_code):
        # save pipeline code to temp directory
        # tmp_dir = tempfile.mkdtemp()
        # with open(tmp_dir + f"/{filename}", "w") as f:
        #     f.write(pipeline_code)
        # print(f"Pipeline code saved at {tmp_dir}/{filename}")

        # Save pipeline code in the notebook source directory
        with open(self.output_path, "w") as f:
            f.write(pipeline_code)
        self.logger.info(f"Pipeline code saved at {self.output_path}")
