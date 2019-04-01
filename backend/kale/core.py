import sys
import pprint
import tempfile

import networkx as nx

from pathlib import Path

from nbparser import parser
from static_analysis import dep_analysis
from codegen import generate_code


class Kale:
    def __init__(self,
                 source_notebook_path: str,
                 pipeline_name,
                 pipeline_descr,
                 docker_image,
                 notebook_version=4,
                 auto_deploy=False,
                 kfp_port=8080,
                 ):
        self.source_path = Path(source_notebook_path)
        if not self.source_path.exists():
            raise ValueError(f"Path {self.source_path} does not exist")
        self.nbformat_version = notebook_version

        self.kfp_url = f"localhost:{kfp_port}/pipeline"
        self.deploy_pipeline = auto_deploy

        self.pipeline_name = pipeline_name
        self.pipeline_description = pipeline_descr
        self.docker_base_image = docker_image

        # path to Minikube folder where to store data
        self.mount_host_path = '/home/docker/data'
        # path to container folder where `mount_host_path` is mapped
        self.mount_container_path = '/data'

        self.temp_dirdirpath = tempfile.mkdtemp()

        self.run()

    def run(self):
        # convert notebook to nx graph
        pipeline_graph = parser.parse_notebook(self.source_path, self.nbformat_version)

        # run static analysis over the source code
        dep_analysis.variables_dependencies_detection(pipeline_graph)

        # generate lightweight components with marshal injection
        # TODO: Refactor gen module to generate first the light-weight components

        # generate full kfp pipeline definition
        kfp_code = generate_code.gen_kfp_code(nb_graph=pipeline_graph,
                                              pipeline_name=self.pipeline_name,
                                              pipeline_description=self.pipeline_description,
                                              docker_base_image=self.docker_base_image,
                                              mount_host_path=self.mount_host_path,
                                              mount_container_path=self.mount_container_path,
                                              deploy_pipeline=self.deploy_pipeline)

        # save kfp generated code
        self.save_pipeline(kfp_code)

        # deploy pipeline

    def deploy_pipeline_to_kfp(self):
        import kfp.compiler as compiler
        import kfp

        # import the generated pipeline code
        # add temp folder to PYTHONPATH
        sys.path.append(self.temp_dirdirpath)
        from pipeline_code import auto_generated_pipeline

        pipeline_filename = self.pipeline_name + '.pipeline.tar.gz'
        compiler.Compiler().compile(auto_generated_pipeline, pipeline_filename)

        # Get or create an experiment and submit a pipeline run
        client = kfp.Client(host=self.kfp_url)
        list_experiments_response = client.list_experiments()
        experiments = list_experiments_response.experiments

        print(experiments)

        if not experiments:
            # The user does not have any experiments available. Creating a new one
            experiment = client.create_experiment(self.pipeline_name + ' experiment')
        else:
            experiment = experiments[-1]  # Using the last experiment

        # Submit a pipeline run
        run_name = self.pipeline_name + ' run'
        run_result = client.run_pipeline(experiment.id, run_name, pipeline_filename, {})

        print(run_result)

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
        filename = f"kfp_{self.pipeline_name}.py"
        # save pipeline code to temp directory
        with open(self.temp_dirdirpath + f"/{filename}", "w") as f:
            f.write(pipeline_code)
        print(f"Pipelines code saved at {self.temp_dirdirpath}/{filename}")

        # if not self.deploy_pipeline:
        #     # save pipeline code also at execution path
        #     with open(filename, "w") as f:
        #         f.write(self.pipeline_code)
