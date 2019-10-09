import autopep8

import networkx as nx

from jinja2 import Environment, PackageLoader


# TODO: Define most of this function parameters in a config file?
#   Or extent the tagging language and provide defaults.
#   Need to implement tag arguments first.
def gen_kfp_code(nb_graph, experiment_name, pipeline_name, pipeline_description, docker_base_image, volumes, deploy_pipeline):
    """
    Takes a NetworkX workflow graph with the following properties

    - node property 'code' contains the source code
    - node property 'ins' lists the variables to be de-serialized
    - node property 'outs' lists the variables to be serialized

    and generated a standalone Python script in KFP DSL to deploy
    a KFP pipeline.

    Args:
        nb_graph: NetworkX DiGraph
                    A directed graph representing the pipeline to be executed.
        pipeline_name:
        pipeline_description:
        docker_base_image:
        volumes:
        deploy_pipeline:

    Returns:

    """

    def add_suffix(s, suffix):
        return s + suffix
    # initialize templating environment
    template_env = Environment(loader=PackageLoader('kale', 'templates'))
    template_env.filters['add_suffix'] = add_suffix

    # List of light-weight components generated code
    function_blocks = list()
    # List of names of components
    function_names = list()
    # Dictionary of steps defining the dependency graph
    function_prevs = dict()

    # Order the pipeline topologically to cycle through the DAG
    for block_name in nx.topological_sort(nb_graph):
        # first create the function
        function_template = template_env.get_template('function_template.txt')
        block_data = nb_graph.nodes(data=True)[block_name]

        # check if the block has any ancestors
        predecessors = list(nb_graph.predecessors(block_name))
        args = list()
        if len(predecessors) > 0:
            for a in predecessors:
                args.append(f"{a}_task")
        function_prevs[block_name] = args

        function_blocks.append(function_template.render(
            pipeline_name=pipeline_name,
            function_name=block_name,
            function_blocks=[block_data['source']],
            in_variables=block_data['ins'],
            out_variables=block_data['outs']
        ))
        function_names.append(block_name)

    leaf_nodes = [x for x in nb_graph.nodes() if nb_graph.out_degree(x) == 0]
    pipeline_template = template_env.get_template('pipeline_template.txt')
    pipeline_code = pipeline_template.render(
        block_functions=function_blocks,
        block_functions_names=function_names,
        block_function_prevs=function_prevs,
        experiment_name=experiment_name,
        pipeline_name=pipeline_name,
        pipeline_description=pipeline_description,
        docker_base_image=docker_base_image,
        volumes=volumes if volumes is not None else [],
        deploy_pipeline=deploy_pipeline,
        leaf_nodes=leaf_nodes
    )

    # fix code style using pep8 guidelines
    pipeline_code = autopep8.fix_code(pipeline_code)
    return pipeline_code


