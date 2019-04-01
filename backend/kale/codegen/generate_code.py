import networkx as nx

from jinja2 import Environment, PackageLoader


# Variables that inserted at the beginning of pipeline blocks by templates
__HARDCODED_VARIABLES = ['_input_data_folder']


def gen_lightweight_component(node):
    """
    Generates the KFP DSL code for a lightweight component
    from a graph node

    Args:
        node: NetworkX graph node
                The node of the nx graph representing a component of the pipeline

    Returns: string
                Generated Python Code

    """
    pass


def gen_pipeline_definition():
    pass


def gen_deploy():
    pass


def gen_kfp_code(nb_graph, pipeline_name, pipeline_description, docker_base_image, mount_host_path,
                 mount_container_path, deploy_pipeline):
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

    Returns: string
                Generated Python code

    """
    # initialize templating environment
    template_env = Environment(loader=PackageLoader('converter', 'templates'))

    # collect function blocks
    function_blocks = list()
    function_names = list()
    function_args = dict()

    # order the pipeline topologically to cycle through the DAG
    for block_name in nx.topological_sort(nb_graph):
        # first create the function
        function_template = template_env.get_template('function_template.txt')
        block_data = nb_graph.nodes(data=True)[block_name]

        # check if the block has any ancestors
        predecessors = list(nb_graph.predecessors(block_name))
        args = list()
        if len(predecessors) > 0:
            for a in predecessors:
                args.append(f"{a}_task.output")
        function_args[block_name] = args

        function_blocks.append(function_template.render(
            pipeline_name=pipeline_name,
            function_name=block_name,
            function_blocks=[block_data['source']],
            function_args=[f"arg{i}" for i in range(0, len(args))],
            in_variables=block_data['ins'],
            out_variables=block_data['outs']
        ))
        function_names.append(block_name)

    pipeline_template = template_env.get_template('pipeline_template.txt')
    pipeline_code = pipeline_template.render(
        block_functions=function_blocks,
        block_functions_names=function_names,
        block_function_args=function_args,
        pipeline_name=pipeline_name,
        pipeline_description=pipeline_description,
        docker_base_image=docker_base_image,
        mount_host_path=mount_host_path,
        mount_container_path=mount_container_path,
        deploy_pipeline=deploy_pipeline
    )
    return pipeline_code
