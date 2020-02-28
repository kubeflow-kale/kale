import os
import autopep8

import networkx as nx

from jinja2 import Environment, PackageLoader, FileSystemLoader


def _initialize_templating_env(templates_path=None):
    if templates_path:
        loader = FileSystemLoader(templates_path)
    else:
        loader = PackageLoader('kale', 'templates')
    template_env = Environment(loader=loader)
    # add custom filters
    template_env.filters['add_suffix'] = lambda s, suffix: s + suffix
    return template_env


def get_volume_parameters(volumes):
    """Create pipeline parameters for volumes to be mounted on pipeline steps.

    Args:
        volumes: a volume spec

    Returns (dict): volume pipeline parameters
    """
    volume_parameters = dict()
    for v in volumes:
        if v['type'] == 'pv':
            # FIXME: How should we handle existing PVs?
            continue

        if v['type'] == 'pvc':
            mount_point = v['mount_point'].replace('/', '_').strip('_')
            par_name = "vol_{}".format(mount_point)
            volume_parameters[par_name] = ('str', v['name'])
        elif v['type'] == 'new_pvc':
            rok_url = v['annotations'].get("rok/origin")
            if rok_url is not None:
                par_name = "rok_{}_url".format(v['name'].replace('-', '_'))
                volume_parameters[par_name] = ('str', rok_url)
        else:
            raise ValueError("Unknown volume type: {}".format(v['type']))
    return volume_parameters


def get_marshal_data(wd, volumes, nb_path):
    """Get the marshal volume path, if needed.

    Check the current volumes, in case the current working directory is a
    subpath of one the mounted volumes, then use the current working directory
    as the place for the marshal directory. Otherwise, write all marshal data
    to /marshal.

    Args:
        wd: current working directory. Can be None
        volumes: volumes dictionary
        nb_path: path to the notebook file

    Returns: (dict): a dict composed of
        - 'marshal_volume' (bool): True if we use a custom marshal volume
        - 'marshal_path' (str): path to the volume, if `marshal_volume` is True
    """
    marshal_volume = True
    marshal_path = "/marshal"
    # Check if the workspace directory is under a mounted volume.
    # If so, marshal data into a folder in that volume,
    # otherwise create a new volume and mount it at /marshal
    if wd:
        wd = os.path.realpath(wd)
        # get the volumes for which the working directory is a subpath of
        # the mount point
        vols = list(filter(lambda x: wd.startswith(x['mount_point']), volumes))
        # if we found any, then set marshal directory inside working directory
        if len(vols) > 0:
            marshal_volume = False
            basename = os.path.basename(nb_path)
            marshal_dir = ".{}.kale.marshal.dir".format(basename)
            marshal_path = os.path.join(wd, marshal_dir)
    return {
        'marshal_volume': marshal_volume,
        'marshal_path': marshal_path
    }


def get_args(pipeline_parameters):
    """Generate pipeline and function parameter.

    The generated lists will be passed to the rendering template.

    Args:
        pipeline_parameters (dict): pipeline parameters as
        {<name>:(<type>,<value>)}

    Returns (dict): a dict composed of:
        - 'pipeline_args_names': pipeline argument names as list
        - 'pipeline_args_type': pipeline arguments types as list
        - 'pipeline_args_values': function arguments values as list
    """
    pipeline_args_names = list(pipeline_parameters.keys())
    pipeline_args_types = [arg[0] for arg in pipeline_parameters.values()]
    pipeline_args_values = [arg[1] for arg in pipeline_parameters.values()]

    return {
        'pipeline_args_names': pipeline_args_names,
        'pipeline_args_types': pipeline_args_types,
        'pipeline_args_values': pipeline_args_values
    }


def pipeline_dependencies_tasks(g):
    """Generate a dictionary of Pipeline dependencies.

    Args:
        g: Pipeline graph

    Returns (dict): k: step_name, v: list of predecessors
    """
    deps = dict()
    for step_name in nx.topological_sort(g):
        deps[step_name] = ["{}_task".format(pred)
                           for pred in g.predecessors(step_name)]
    return deps


def generate_lightweight_component(template, step_name, step_data, nb_path,
                                   metadata):
    """Use the function template to generate Python code."""
    step_source = step_data.get('source', [])
    step_marshal_in = step_data.get('ins', [])
    step_marshal_out = step_data.get('outs', [])

    fn_code = template.render(
        step_name=step_name,
        function_body=step_source,
        in_variables=step_marshal_in,
        out_variables=step_marshal_out,
        nb_path=nb_path,
        **metadata
    )
    # fix code style using pep8 guidelines
    return autopep8.fix_code(fn_code)


def generate_pipeline(template, nb_graph, step_names, lightweight_components,
                      metadata):
    """Use the pipeline template to generate Python code."""
    # All the Pipeline steps that do not have children
    leaf_steps = [x for x in nb_graph.nodes()
                  if nb_graph.out_degree(x) == 0]

    pipeline_code = template.render(
        lightweight_components=lightweight_components,
        step_names=step_names,
        step_prevs=pipeline_dependencies_tasks(nb_graph),
        leaf_steps=leaf_steps,
        **metadata
    )
    # fix code style using pep8 guidelines
    return autopep8.fix_code(pipeline_code)


def gen_kfp_code(nb_graph, nb_path, pipeline_parameters, metadata,
                 auto_snapshot):
    """Generate a Python KFP DSL executable starting from the nx graph.

    Takes a NetworkX workflow graph with the following properties

    - node property 'code' contains the source code
    - node property 'ins' lists the variables to be de-serialized
    - node property 'outs' lists the variables to be serialized

    and generated a standalone Python script in KFP DSL to deploy
    a KFP pipeline.

    Args:
        nb_graph (nx.DiGraph): Pipeline graph
        nb_path (str): path to the notebook
        pipeline_parameters (dict): pipeline parameters
        metadata (dict): metadata to be passed to the Jinja templates
        auto_snapshot (bool): True if pipeline runs auto snapshot at each
            pipeline step

    Returns (str): A Python executable script
    """
    # initialize templating environment
    template_env = _initialize_templating_env()

    # Convert volume annotations to a dictionary
    volumes = metadata.get('volumes')
    volume_parameters = get_volume_parameters(volumes)
    pipeline_parameters.update(volume_parameters)

    wd = metadata.get('abs_working_dir', None)
    # get 'marshal_path' and 'marshal_volume'
    metadata.update(get_marshal_data(wd=wd, volumes=volumes, nb_path=nb_path))
    # get 'function_args', 'pipeline_args' and 'pipeline_args_names'
    metadata.update(get_args(pipeline_parameters))
    # TODO: Have this automatically inside metadata before calling gen_kfp_code
    metadata.update({'auto_snapshot': auto_snapshot})

    # initialize the function template
    function_template = template_env.get_template('function_template.jinja2')
    # Order the pipeline topologically to cycle through the DAG
    step_names = list(nx.topological_sort(nb_graph))
    # List of lightweight components generated code
    lightweight_components = [
        generate_lightweight_component(function_template, step_name,
                                       nb_graph.nodes(data=True)[step_name],
                                       nb_path, metadata)
        for step_name in step_names
    ]

    pipeline_template = template_env.get_template('pipeline_template.jinja2')
    pipeline_code = generate_pipeline(pipeline_template, nb_graph, step_names,
                                      lightweight_components, metadata)
    return pipeline_code
