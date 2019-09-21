import os
import pprint
import logging
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
                 run_name,
                 pipeline_name,
                 pipeline_descr,
                 docker_image,
                 volumes,
                 notebook_version=4,
                 auto_deploy=False,
                 kfp_dns=None,
                 ):
        self.source_path = Path(source_notebook_path)
        self.output_path = os.path.join(os.path.dirname(self.source_path), f"kfp_{pipeline_name}.kfp.py")
        if not self.source_path.exists():
            raise ValueError(f"Path {self.source_path} does not exist")
        self.nbformat_version = notebook_version

        self.kfp_dns = f"http://{kfp_dns}/pipeline" if kfp_dns is not None else None

        self.deploy_pipeline = auto_deploy

        self.experiment_name = experiment_name
        self.run_name = run_name
        self.pipeline_name = pipeline_name
        self.pipeline_description = pipeline_descr
        self.docker_base_image = docker_image
        self.volumes = volumes

        # path to container folder where `mount_host_path` is mapped
        self.mount_container_path = '/data'

        # Setup logging
        self.log_dir_path = Path(".")
        # set up logging to file
        logging.basicConfig(level=logging.DEBUG,
                            format='%(asctime)s %(name)-12s %(levelname)-8s %(message)s',
                            datefmt='%m-%d %H:%M',
                            )
        self.logger = logging.getLogger('kubeflow-kale')
        self.logger.setLevel(logging.DEBUG)
        # create file handler which logs even debug messages
        fh = logging.FileHandler(self.log_dir_path / 'log.log', mode='w')
        fh.setLevel(logging.DEBUG)
        self.logger.addHandler(fh)

    def run(self):
        # convert notebook to nx graph
        try:
            pipeline_graph = parser.parse_notebook(self.source_path, self.nbformat_version)
        except ValueError as e:
            return {"result": str(e)}

        # run static analysis over the source code
        dep_analysis.variables_dependencies_detection(pipeline_graph)

        # generate full kfp pipeline definition
        kfp_code = generate_code.gen_kfp_code(nb_graph=pipeline_graph,
                                              pipeline_name=self.pipeline_name,
                                              pipeline_description=self.pipeline_description,
                                              docker_base_image=self.docker_base_image,
                                              volumes=self.volumes,
                                              mount_container_path=self.mount_container_path,
                                              deploy_pipeline=self.deploy_pipeline)

        # save kfp generated code
        self.save_pipeline(kfp_code)

        # deploy pipeline to KFP instance
        if self.deploy_pipeline:
            return self.deploy_pipeline_to_kfp(self.output_path)

    def deploy_pipeline_to_kfp(self, pipeline_source):
        """
        Import the generated kfp pipeline definition and deploy it
        to a running KFP instance
        """
        import kfp.compiler as compiler
        import kfp
        import importlib.util
        import logging

        logging.getLogger('urllib3.connectionpool').setLevel(logging.CRITICAL)

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
            experiment = client.create_experiment(self.pipeline_name)

            # Submit a pipeline run
            run_name = self.pipeline_name + '_run'
            run = client.run_pipeline(experiment.id, run_name, pipeline_filename, {})
            run_link = f"{self.kfp_dns}/#/runs/details/{run.id}"
            self.logger.info(f"Pipeline run at {run_link}")
            return {"result": "Deployment successful.", "run": run_link}
        except Exception as e:
            # remove auto-generated tar package (used for deploy)
            os.remove(self.pipeline_name + '.pipeline.tar.gz')
            self.logger.info(f"Kale deployment failed with exception: {e}")
            return {"result": "Deployment Failed - no connection with Kubeflow Pipelines Endpoint"}

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
