import re
import sys
import copy
import pprint
import tempfile
import importlib

import nbformat as nb
import networkx as nx

from pathlib import Path
from graphviz import Source
from jinja2 import Environment, PackageLoader

from kale.linter import CodeInspectorLinter
from kale.inspector import CodeInspector


class dotdict(dict):
    """
    dot.notation access to dictionary attributes
    """
    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__


class KaleCore:
    # Code blocks that are injected at the beginning of each pipelines block
    __GLOBAL_BLOCKS = ['imports', 'functions']
    # Variables that inserted at the beginning of pipeline blocks by templates
    __HARDCODED_VARIABLES = ['_input_data_folder']

    def __init__(self,
                 source_notebook_path: str,
                 pipeline_name,
                 pipeline_descr,
                 docker_image,
                 notebook_version=4,
                 auto_deploy=False,
                 kfp_port=8080,
                 ):
        print(__file__)
        self.source_path = source_notebook_path
        self.nbformat_version = notebook_version

        self.kfp_url = f"localhost:{kfp_port}/pipeline"
        self.deploy_pipeline = auto_deploy

        self.pipeline_name = pipeline_name
        self.pipeline_description = pipeline_descr
        self.docker_base_image = docker_image

        self.pipeline = nx.DiGraph()
        self.pipeline_code = ""

        # path to Minikube folder where to store data
        self.mount_host_path = '/home/docker/data'
        # path to container folder where `mount_host_path` is mapped
        self.mount_container_path = '/data'

        self.temp_dirdirpath = tempfile.mkdtemp()

        # initialize templating environment
        self.template_env = Environment(loader=PackageLoader('converter', 'templates'))

        # check notebook actually exists
        p = Path(self.source_path)
        if not p.exists():
            raise ValueError(f"Path {self.source_path} does not exist")

        # create notebook object from source notebook
        self.source = nb.read(p.__str__(), as_version=self.nbformat_version)

        # create internal representation of notebook pipeline
        self.parse_notebook_cells()
        # self.plot_pipeline()
        self.automatic_variable_detection()
        self.print_pipeline_state()
        self.create_pipeline_code()

        if self.deploy_pipeline:
            self.deploy_pipeline_to_kfp()

    def plot_pipeline(self):
        nx.drawing.nx_pydot.write_dot(self.pipeline, 'test.dot')
        s = Source.from_file('test.dot')
        s.view()

    @staticmethod
    def parse_metadata(metadata: dict):
        """

        Args:
            metadata:

        Returns:

        """
        parsed_tags = dotdict()

        # block_names is a list because a cell block might be assigned to more
        # than one pipeline block. It can happen with DL DataLoaders that are assigned to a specific device
        # and are used for multiple models
        parsed_tags['block_names'] = list()
        parsed_tags['in'] = list()
        parsed_tags['out'] = list()

        if 'tags' not in metadata:
            return parsed_tags

        # in case use are using Papermill to generate multiple notebooks
        # the parameters at the beginning of the notebook must be added
        # to every step of the pipeline.
        if 'parameters' in metadata['tags'] or 'injected-parameters' in metadata['tags']:
            metadata['tags'] = ["block:imports"]

        for t in metadata['tags']:
            if t == "skip":
                return None

            elems = t.split(':')
            # name of the current pipeline step
            if elems[0] == "block":
                if len(elems) != 2:
                    raise ValueError(f"Wrong block `block` tag: {t}")
                parsed_tags['block_names'].append(elems[1])
            # names of the [possible] previous [dependencies] steps
            if elems[0] == "prev":
                # skip first
                parsed_tags['previous_blocks'] = elems[1:]
            # variables to be read from previous step
            if elems[0] == "in":
                if len(elems) != 2:
                    raise ValueError(f"Wrong `in` tag: {t}")
                parsed_tags['in'].append(elems[1])
            # variables to be saved for later steps
            if elems[0] == "out":
                if len(elems) != 2:
                    raise ValueError(f"Wrong `out` tag: {t}")
                parsed_tags['out'].append(elems[1])
        return parsed_tags

    def validate_tags(self, tags):
        """

        Args:
            tags:

        Returns:

        """
        if 'previous_blocks' in tags:
            for p in tags.previous_blocks:
                if p not in self.pipeline.nodes:
                    raise ValueError(f"Block `{p}` does not exist. It was defined as previous block of `{tags.block_names}`")

        # validate block name to respect k8s syntax
        if 'block_names' in tags:
            for block_name in tags['block_names']:
                if re.match(r'^[a-z0-9]*$', block_name) is None:
                    raise ValueError("block_name label must only consist of lower case alphanumeric characters")

    def parse_notebook_cells(self):
        """
        Parses the cells of the source notebook based on their tags
        """
        # Used in case there some consecutive code block of the same pipeline block
        # and only the first block is tagged with the block name
        current_block = None

        # iterate over the notebook cells, from first to last
        for c in self.source.cells:
            # parse only source code cells
            if c.cell_type != "code":
                continue

            tags = self.parse_metadata(c.metadata)
            if tags is None:
                continue
            self.validate_tags(tags)
            # if the block was not tagged with a name,
            # add the source code to the block defined by the previous(es) cell(s)
            if len(tags.block_names) == 0:
                assert current_block is not None
                source_code = self.pipeline.nodes(data=True)[current_block]['source']
                source_code += "\n" + c.source
                # update pipeline block source code
                nx.set_node_attributes(self.pipeline, {current_block: {'source': source_code}})
            else:
                # TODO: Taking by default first block name tag. Need specific behavior
                current_block = tags.block_names[0]
                for block_name in tags.block_names:
                    # add node to DAG, adding tags and source code of notebook cell
                    if block_name not in self.pipeline.nodes:
                        _tags = self._copy_tags(tags)
                        _tags.block_name = block_name
                        self.pipeline.add_node(block_name,
                                               tags=_tags,
                                               source=c.source,
                                               ins=set(),
                                               outs=set())
                        if tags.previous_blocks:
                            for block in tags.previous_blocks:
                                self.pipeline.add_edge(block, block_name)
                    else:
                        # add code to existing block
                        source_code = self.pipeline.nodes(data=True)[block_name]['source']
                        existing_tags = self.pipeline.nodes(data=True)[block_name]['tags']
                        # use `set` operation to make unique list
                        if len(tags['in']) > 0:
                            existing_tags['in'].extend(tags['in'])
                            existing_tags['in'] = list(set(existing_tags['in']))
                        if len(tags['out']) > 0:
                            existing_tags['out'].extend(tags['out'])
                            existing_tags['out'] = list(set(existing_tags['out']))
                        source_code += "\n" + c.source
                        # update pipeline block source code
                        nx.set_node_attributes(self.pipeline, {block_name: {'source': source_code,
                                                                            'tags': existing_tags,
                                                                            'ins': set(),
                                                                            'outs': set()}})

    def automatic_variable_detection(self):
        # First get all the names of each code block
        inspector = CodeInspector()
        for block in self.pipeline.nodes:
            block_data = self.pipeline.nodes(data=True)[block]
            all_names = inspector.get_all_names(block_data['source'])
            nx.set_node_attributes(self.pipeline, {block: {'all_names': all_names}})

        # Merge together all the code blocks to detect all functions and class names
        _code_blocks = list()
        for block in self.pipeline.nodes:
            _code_blocks.append(self.pipeline.nodes(data=True)[block]['source'])
        complete_block = '\n'.join(_code_blocks)
        inspector.get_function_and_class_names(complete_block)

        # get all the missing names in each block
        self.in_variables_detection()
        self.out_variable_detection()

    def in_variables_detection(self):
        """

        Returns:

        """
        code_inspector = CodeInspectorLinter()
        # Go through pipeline DAG and parse variable names
        # Start first with __GLOBAL_BLOCKS: code blocks that are injected in every pipeline block
        block_names = self.pipeline.nodes()
        for block in block_names:
            if block in self.__GLOBAL_BLOCKS:
                continue

            _code_blocks = list()
            for g in self.__GLOBAL_BLOCKS:
                if g in self.pipeline.nodes:
                    _code_blocks.append(self.pipeline.nodes(data=True)[g]['source'])
            _code_blocks.append(self.pipeline.nodes(data=True)[block]['source'])
            complete_block = '\n'.join(_code_blocks)
            ins = code_inspector.inspect_code(code=complete_block)

            # remove from the list the variables that will be injected by template code
            ins.difference_update(set(KaleCore.__HARDCODED_VARIABLES))
            nx.set_node_attributes(self.pipeline, {block: {'ins': ins}})

    def out_variable_detection(self):
        """
        Create the `outs` set of variables to be written at the end of each block.
        To get the `outs` of each block, the function uses the topological order of
        the pipelines and cycles through all the ancestors of each block.
        Since we know what are the `ins` of the current block, we can get the blocks were
        those `ins` where created. If an ancestor matches the `ins` entry, then it will have
        a matching `outs`.
        """
        for block_name in reversed(list(nx.topological_sort(self.pipeline))):
            # global blocks are injected at the beginning of every code block
            if block_name in self.__GLOBAL_BLOCKS:
                continue
            ins = self.pipeline.nodes(data=True)[block_name]['ins']
            # TODO: assume for now that we are just passing data from father to children.
            #   In case we wanted to use deeper dependencies, use nx.ancestors()
            for _a in self.pipeline.predecessors(block_name):
                father_data = self.pipeline.nodes(data=True)[_a]
                # Intersect the missing names of this father child with all
                # the father's names. The intersection is the list of variables
                # that the father need to serialize
                outs = ins.intersection(father_data['all_names'])
                # include previous `outs` in case this father has multiple children steps
                outs.update(father_data['outs'])
                # add to father the new `outs` variables
                nx.set_node_attributes(self.pipeline, {_a: {'outs': outs}})

        # now merge the user defined (using tags) `out` variables
        for block_name in self.pipeline.nodes:
            block_data = self.pipeline.nodes(data=True)[block_name]
            if 'out' in block_data:
                outs = block_data['outs']
                outs.update(block_data['tags']['out'])
                nx.set_node_attributes(self.pipeline, {block_name: {'outs': outs}})

    def create_pipeline_code(self):
        # collect function blocks
        function_blocks = list()
        function_names = list()
        function_args = dict()

        # order the pipeline topologically to cycle through the DAG
        for block_name in nx.topological_sort(self.pipeline):
            # no need of processing step in global blocks
            if block_name in self.__GLOBAL_BLOCKS:
                continue
            # first create the function
            function_template = self.template_env.get_template('function_template.txt')
            block_data = self.pipeline.nodes(data=True)[block_name]

            # check if the block has any ancestors
            predecessors = list(self.pipeline.predecessors(block_name))
            args = list()
            if len(predecessors) > 0:
                for a in predecessors:
                    args.append(f"{a}_task.output")
            function_args[block_name] = args

            # list of code blocks to inject into the function
            _code_blocks = list()
            for g in self.__GLOBAL_BLOCKS:
                if g in self.pipeline.nodes:
                    _code_blocks.append(self.pipeline.nodes(data=True)[g]['source'])
            _code_blocks.append(block_data['source'])

            function_blocks.append(function_template.render(
                pipeline_name=self.pipeline_name,
                function_name=block_name,
                function_blocks=_code_blocks,
                function_args=[f"arg{i}" for i in range(0, len(args))],
                in_variables=block_data['ins'],
                out_variables=block_data['outs']
            ))
            function_names.append(block_name)

        pipeline_template = self.template_env.get_template('pipeline_template.txt')
        self.pipeline_code = pipeline_template.render(
            block_functions=function_blocks,
            block_functions_names=function_names,
            block_function_args=function_args,
            pipeline_name=self.pipeline_name,
            pipeline_description=self.pipeline_description,
            docker_base_image=self.docker_base_image,
            mount_host_path=self.mount_host_path,
            mount_container_path=self.mount_container_path,
            deploy_pipeline=self.deploy_pipeline
        )
        self.save_pipeline()

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

    def print_pipeline_state(self):
        """
        Prints a complete definition of the pipeline with all the tags
        """
        for block_name in nx.topological_sort(self.pipeline):
            block_data = self.pipeline.nodes(data=True)[block_name]

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

    def save_pipeline(self):
        filename = f"kfp_{self.pipeline_name}.py"
        # save pipeline code to temp directory
        with open(self.temp_dirdirpath + f"/{filename}", "w") as f:
            f.write(self.pipeline_code)
        print(f"Pipelines code saved at {self.temp_dirdirpath}/{filename}")

        # if not self.deploy_pipeline:
        #     # save pipeline code also at execution path
        #     with open(filename, "w") as f:
        #         f.write(self.pipeline_code)

    @staticmethod
    def _copy_tags(tags):
        new_tags = dotdict()
        for k, v in tags.items():
            if type(v) == list and len(v) == 0:
                new_tags[k] = list()
            else:
                new_tags[k] = copy.deepcopy(tags[k])
        return new_tags
