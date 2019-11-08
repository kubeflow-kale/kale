import os
import autopep8

import networkx as nx

from jinja2 import Environment, PackageLoader
from kale.utils.pod_utils import is_workspace_dir


# TODO: Define most of this function parameters in a config file?
#   Or extent the tagging language and provide defaults.
#   Need to implement tag arguments first.
def gen_kfp_code(nb_graph,
                 nb_path,
                 pipeline_parameters,
                 metadata,
                 auto_snapshot):
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

    # Include all volumes as pipeline parameters
    volumes = metadata.get('volumes', [])
    # Convert annotations to a dictionary and convert size to a string
    for v in volumes:
        # Convert annotations to a dictionary
        annotations = {a['key']: a['value'] for a in v['annotations'] or []
                       if a['key'] != '' and a['value'] != ''}
        v['annotations'] = annotations
        v['size'] = str(v['size'])

        if v['type'] == 'pv':
            # FIXME: How should we handle existing PVs?
            continue

        if v['type'] == 'pvc':
            par_name = f"vol_{v['mount_point'].replace('/', '_').strip('_')}"
            pipeline_parameters[par_name] = ('str', v['name'])
        elif v['type'] == 'new_pvc':
            rok_url = v['annotations'].get("rok/origin")
            if rok_url is not None:
                par_name = f"rok_{v['name'].replace('-', '_')}_url"
                pipeline_parameters[par_name] = ('str', rok_url)
        else:
            raise ValueError(f"Unknown volume type: {v['type']}")

    # The Jupyter Web App assumes the first volume of the notebook is the
    # working directory, so we make sure to make it appear first in the spec.
    volumes = sorted(volumes, reverse=True,
                     key=lambda v: is_workspace_dir(v['mount_point']))

    marshal_volume = True
    marshal_path = "/marshal"
    # Check if the workspace directory is under a mounted volume.
    # If so, marshal data into a folder in that volume,
    # otherwise create a new volume and mount it at /marshal
    wd = metadata.get('abs_working_dir', None)
    if wd:
        wd = os.path.realpath(wd)
        # get the volumes for which the working directory is a subpath of the mount point
        vols = list(filter(lambda x: wd.startswith(x['mount_point']), volumes))
        # if we found any, then set marshal directory inside working directory
        if len(vols) >= 1:
            marshal_volume = False
            marshal_dir = f".{os.path.basename(nb_path)}.kale.marshal.dir"
            marshal_path = os.path.join(wd, marshal_dir)

    pipeline_args_names = list(pipeline_parameters.keys())
    # wrap in quotes every parameter - required by kfp
    pipeline_args = ', '.join([f"{arg}='{pipeline_parameters[arg][1]}'"
                               for arg in pipeline_parameters])
    # arguments are actually the pipeline arguments. Since we don't know precisely in which pipeline
    # steps they are needed we just pass them to every one. The assumption is that these variables
    # were treated as constants notebook-wise.
    function_args = ', '.join([f"{arg}: {pipeline_parameters[arg][0]}" for arg in pipeline_parameters])

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
            pipeline_name=metadata['pipeline_name'],
            function_name=block_name,
            function_args=function_args,
            function_blocks=[block_data['source']],
            in_variables=block_data['ins'],
            out_variables=block_data['outs'],
            marshal_path=marshal_path,
            auto_snapshot=auto_snapshot,
            nb_path=nb_path
        ))
        function_names.append(block_name)

    leaf_nodes = [x for x in nb_graph.nodes() if nb_graph.out_degree(x) == 0]
    pipeline_template = template_env.get_template('pipeline_template.txt')
    pipeline_code = pipeline_template.render(
        block_functions=function_blocks,
        block_functions_names=function_names,
        block_function_prevs=function_prevs,
        experiment_name=metadata['experiment_name'],
        pipeline_name=metadata['pipeline_name'],
        pipeline_description=metadata.get('pipeline_description', ''),
        pipeline_arguments=pipeline_args,
        pipeline_arguments_names=', '.join(pipeline_args_names),
        docker_base_image=metadata.get('docker_image', ''),
        volumes=volumes,
        leaf_nodes=leaf_nodes,
        working_dir=metadata.get('abs_working_dir', None),
        marshal_volume=marshal_volume,
        marshal_path=marshal_path
    )

    # fix code style using pep8 guidelines
    pipeline_code = autopep8.fix_code(pipeline_code)
    return pipeline_code
