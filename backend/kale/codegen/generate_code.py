import autopep8

import networkx as nx

from jinja2 import Environment, PackageLoader


# TODO: Define most of this function parameters in a config file?
#   Or extent the tagging language and provide defaults.
#   Need to implement tag arguments first.
def gen_kfp_code(nb_graph, experiment_name, pipeline_name, pipeline_description, pipeline_parameters, docker_base_image, volumes, deploy_pipeline):
    """
    Takes a NetworkX workflow graph with the following properties

    - node property 'code' contains the source code
    - node property 'ins' lists the variables to be de-serialized
    - node property 'outs' lists the variables to be serialized

    and generated a standalone Python script in KFP DSL to deploy
    a KFP pipeline.
    """
    # initialize templating environment
    template_env = Environment(loader=PackageLoader('kale', 'templates'))
    template_env.filters['add_suffix'] = lambda s, suffix: s+suffix

    # List of light-weight components generated code
    function_blocks = list()
    # List of names of components
    function_names = list()
    # Dictionary of steps defining the dependency graph
    function_prevs = dict()
    # arguments are actually the pipeline arguments. Since we don't know precisely in which pipeline
    # steps they are needed we just pass them to every one. The assumption is that these variables
    # were treated as constants notebook-wise.
    pipeline_args_names = list(pipeline_parameters.keys())
    # wrap in quotes every parameter - required by kfp
    pipeline_args = ', '.join([f"{arg}='{pipeline_parameters[arg][1]}'"
                               for arg in pipeline_args_names])
    function_args = ', '.join([f"{arg}: {pipeline_parameters[arg][0]}" for arg in pipeline_args_names])

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
            function_args=function_args,
            function_blocks=[block_data['source']],
            in_variables=block_data['ins'],
            out_variables=block_data['outs']
        ))
        function_names.append(block_name)

    for v in volumes:
        annotations = {a['key']: a['value'] for a in v['annotations']
                       if a['key'] != '' and a['value'] != ''}
        v['annotations'] = annotations

    leaf_nodes = [x for x in nb_graph.nodes() if nb_graph.out_degree(x) == 0]
    pipeline_template = template_env.get_template('pipeline_template.txt')
    pipeline_code = pipeline_template.render(
        block_functions=function_blocks,
        block_functions_names=function_names,
        block_function_prevs=function_prevs,
        experiment_name=experiment_name,
        pipeline_name=pipeline_name,
        pipeline_description=pipeline_description,
        pipeline_arguments=pipeline_args,
        pipeline_arguments_names=', '.join(pipeline_args_names),
        docker_base_image=docker_base_image,
        volumes=volumes if volumes is not None else [],
        deploy_pipeline=deploy_pipeline,
        leaf_nodes=leaf_nodes
    )

    # fix code style using pep8 guidelines
    pipeline_code = autopep8.fix_code(pipeline_code)
    return pipeline_code


