import re

import networkx as nx

_TAGS_LANGUAGE = [r'^imports$',
                  r'^functions$',
                  r'^pipeline-parameters$',
                  r'^skip$',
                  # Extension may end up with 'block:' as a tag. We handle
                  # that as if it was empty.
                  r'^block:([_a-z]([_a-z0-9]*)?)?$',
                  r'^prev:[_a-z]([_a-z0-9]*)?$']


def parse_metadata(metadata):
    """Parse a notebook's cell's metadata field.

    The Kale UI writes Kale specific tags inside the 'tags' field, as a list
    of string tags. Supported tags are defined by _TAGS_LANGUAGE.

    Args:
        metadata (dict): a dictionary containing a notebook's cell's metadata

    Returns (dict): parsed tags based on Kale tagging language

    """
    parsed_tags = dict()

    # `step_names` is a list because a notebook cell might be assigned to more
    # than one Pipeline step.
    parsed_tags['step_names'] = list()
    parsed_tags['prev_steps'] = list()

    # the notebook cell was not tagged
    if 'tags' not in metadata or len(metadata['tags']) == 0:
        return parsed_tags

    for t in metadata['tags']:
        if not isinstance(t, str):
            raise ValueError("Tags must be string. Found tag %s of type %s"
                             % (t, type(t)))
        # Check that the tag is defined by the Kale tagging language
        if any(re.match(_t, t) for _t in _TAGS_LANGUAGE) is False:
            raise ValueError(f"Unrecognized tag: {t}")

        # Special tags have a specific effect on the cell they belong to.
        # Specifically:
        #  - skip: ignore the notebook cell
        #  - pipeline-parameters: use the cell to populate Pipeline
        #       parameters. The cell must contain only assignment expressions
        #  - imports: the code of the corresponding cell(s) will be prepended
        #       to every Pipeline step
        #  - functions: same as imports, but the corresponding code is placed
        #       **after** `imports`
        special_tags = ['skip', 'pipeline-parameters', 'imports', 'functions']
        if t in special_tags:
            parsed_tags['step_names'] = [t]
            return parsed_tags

        # now only `block` and `prev` tags remain to be parsed.
        tag_name, value = t.split(':')
        # name of the future Pipeline step
        if tag_name == "block" and value:
            parsed_tags['step_names'].append(value)
        # name(s) of the father Pipeline step(s)
        if tag_name == "prev":
            parsed_tags['prev_steps'].append(value)
    return parsed_tags


def merge_code(nb_graph, dst, code):
    """Add a new code block to an existing graph node.

    Note: Updates inplace the input graph.

    Args:
        nb_graph (nx.DiGraph): Pipeline graph
        dst (str): Name id of the destination node
        code (str): Python source code to be appended to dst node
    """
    source_code = nb_graph.nodes(data=True)[dst]['source']
    # update pipeline block source code
    nx.set_node_attributes(nb_graph, {dst: {'source': source_code + [code]}})


def parse_notebook(notebook):
    """Creates a NetworkX graph based on the input notebook's tags.

    Cell's source code are embedded into the graph as node attributes.

    Args:
        notebook: nbformat's notebook object
    """
    # output graph
    nb_graph = nx.DiGraph()

    # will be assigned at the end of each for loop
    prev_step_name = None

    # All the code cells that have to be pre-pended to every pipeline step
    # (i.e., imports and functions) are merged here
    imports_block = list()
    functions_block = list()

    # Variables that will become pipeline parameters
    pipeline_parameters = list()

    # iterate over the notebook cells, from first to last
    for c in notebook.cells:
        # parse only source code cells
        if c.cell_type != "code":
            continue

        tags = parse_metadata(c.metadata)

        if len(tags['step_names']) > 1:
            raise NotImplementedError("Kale does not yet support multiple "
                                      "step names in a single notebook cell. "
                                      "One notebook cell was found with %s "
                                      "step names" % tags['step_names'])

        step_name = tags['step_names'][0] \
            if 0 < len(tags['step_names']) \
            else None

        if step_name == 'skip':
            # when the cell is skipped, don't store `skip` as the previous
            # active cell
            continue
        if step_name == 'pipeline-parameters':
            pipeline_parameters.append(c.source)
            prev_step_name = step_name
            continue
        if step_name == 'imports':
            imports_block.append(c.source)
            prev_step_name = step_name
            continue
        if step_name == 'functions':
            functions_block.append(c.source)
            prev_step_name = step_name
            continue

        # if none of the above apply, then we are parsing a code cell with
        # a block names and (possibly) some dependencies

        # check existence of prev steps. They must already exist in the graph
        for prev in tags['prev_steps']:
            if prev not in nb_graph.nodes:
                raise ValueError("Block %s does not exist. "
                                 "It was defined as previous block of %s"
                                 % (prev, tags['step_names']))

        # if the cell was not tagged with a step name,
        # add the code to the previous cell
        if not step_name:
            if prev_step_name == 'imports':
                imports_block.append(c.source)
            if prev_step_name == 'functions':
                functions_block.append(c.source)
            if prev_step_name == 'pipeline-parameters':
                pipeline_parameters.append(c.source)
            # current_block might be None in case the first cells of the
            # notebooks have not been tagged.
            if prev_step_name:
                # this notebook cell will be merged to a previous one that
                # specified a step name
                merge_code(nb_graph, prev_step_name, c.source)
        else:
            # add node to DAG, adding tags and source code of notebook cell
            if step_name not in nb_graph.nodes:
                nb_graph.add_node(step_name, source=[c.source],
                                  ins=set(), outs=set())
                for _prev_step in tags['prev_steps']:
                    nb_graph.add_edge(_prev_step, step_name)
            else:
                merge_code(nb_graph, step_name, c.source)

        prev_step_name = step_name

    # Prepend any `imports` and `functions` cells to every Pipeline step
    for step in nb_graph:
        step_source = nb_graph.nodes(data=True)[step]['source']
        step_source = imports_block + functions_block + step_source
        nx.set_node_attributes(nb_graph, {step: {'source': step_source}})

    # merge together pipeline parameters
    pipeline_parameters = '\n'.join(pipeline_parameters)

    # make the nodes' code a single multiline string
    # NOTICE: this is temporary, waiting for the artifacts-viz-feature
    for step in nb_graph:
        step_source = nb_graph.nodes(data=True)[step]['source']
        nx.set_node_attributes(nb_graph,
                               {step: {'source': '\n'.join(step_source)}})

    return nb_graph, pipeline_parameters
