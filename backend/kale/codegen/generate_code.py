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
import re
import autopep8

import networkx as nx

from kale.common import graphutils
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


def get_args(parameters):
    """Generate parameters lists to be passed to templates.

    The generated lists will be passed to the rendering template.

    Args:
        parameters (dict): pipeline parameters as
        {<name>:(<type>,<value>)}

    Returns (dict): a dict composed of:
        - 'parameters_names': parameters names as list
        - 'parameters_types': parameters types as list
        - 'parameters_values': parameters default values as list
    """
    sorted_parameters = dict(sorted(parameters.items()))
    parameters_names = list(sorted_parameters.keys())
    parameters_types = [arg[0] for arg in sorted_parameters.values()]
    parameters_values = [arg[1] for arg in sorted_parameters.values()]

    return {
        'parameters_names': parameters_names,
        'parameters_types': parameters_types,
        'parameters_values': parameters_values
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
    step_source_raw = step_data.get('source', [])

    def _encode_source(s):
        # Encode line by line a multiline string
        return "\n".join([line.encode("unicode_escape").decode("utf-8")
                          for line in s.splitlines()])

    # Since the code will be wrapped in triple quotes inside the template,
    # we need to escape triple quotes as they will not be escaped by
    # encode("unicode_escape").
    step_source = [re.sub(r"'''", "\\'\\'\\'", _encode_source(s))
                   for s in step_source_raw]

    step_marshal_in = step_data.get('ins', [])
    step_marshal_out = step_data.get('outs', [])
    step_parameters = get_args(step_data.get('parameters', {}))

    fn_code = template.render(
        step_name=step_name,
        function_body=step_source,
        in_variables=step_marshal_in,
        out_variables=step_marshal_out,
        parameters=step_parameters,
        nb_path=nb_path,
        # step_parameters overrides the parameters fields of metadata
        **{**metadata, **step_parameters}
    )
    # fix code style using pep8 guidelines
    return autopep8.fix_code(fn_code)


def generate_pipeline(template, nb_graph, step_names, lightweight_components,
                      metadata):
    """Use the pipeline template to generate Python code."""
    # All the Pipeline steps that do not have children
    leaf_steps = graphutils.get_leaf_nodes(nb_graph)

    # create a dict with step names and their parameters
    all_step_parameters = {step: sorted(nb_graph.nodes(data=True)[step]
                                        .get('parameters', {}).keys())
                           for step in step_names}

    pipeline_code = template.render(
        nb_graph=nb_graph,
        lightweight_components=lightweight_components,
        step_names=step_names,
        step_prevs=pipeline_dependencies_tasks(nb_graph),
        leaf_steps=leaf_steps,
        all_step_parameters=all_step_parameters,
        **metadata
    )
    # fix code style using pep8 guidelines
    return autopep8.fix_code(pipeline_code)


def gen_kfp_code(nb_graph, nb_path, pipeline_parameters, metadata):
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
