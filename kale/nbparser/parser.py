import re
import copy

import networkx as nx

_TAGS_LANGUAGE = [r'^imports$',
                  r'^functions$',
                  r'^pipeline-parameters$',
                  r'^skip$',
                  # Extension may end up with 'block:' as a tag.  We handle
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

    # `block_names` is a list because a notebook cell might be assigned to more
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

        if t == "skip":
            parsed_tags['step_names'] = ['skip']
            return parsed_tags

        if t == "pipeline-parameters":
            parsed_tags['step_names'] = ['pipeline-parameters']
            return parsed_tags

        # `imports` and `functions` are special tags that make a code cell
        # belong to every Pipeline step Specifically:
        #  - imports: the code of the corresponding cell(s) will be prepended
        #             to every Pipeline step
        #  - functions: same as imports, but the corresponding code is placed
        #               **after** `imports`
        if t in ['imports', 'functions']:
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
    """
    Created a NetworkX graph based on the input notebook's tags
    Cell's source code are embedded into the graph as node attributes
    """
    # output graph
    nb_graph = nx.DiGraph()

    # Used in case there some consecutive code block of the same pipeline block
    # and only the first block is tagged with the block name
    current_block = None
    # if the current block is either imports or functions
    current_block_global = False
    # if the current block is pipeline-parameters
    current_block_pipeline_parameters = False

    # TODO: Add flag to know when the previous cell references multiple block names
    #   In this way, if the next block has no block_name tag, kale can throuw an error
    #   and say that in this case a block_name must be specified (cannot know which one of the previous
    #   to use for merge)
    multiple_parent_blocks = False

    # All the code blocks that are to be pre-prended to every light-weight function (imports, functions, ...)
    # are merged together in this variable and then pre-pended.
    global_block = ""

    # all the variables that will become pipeline parameters
    pipeline_parameters = ""

    # iterate over the notebook cells, from first to last
    for c in notebook.cells:
        # parse only source code cells
        if c.cell_type != "code":
            continue

        tags = parse_metadata(c.metadata)
        if tags is None:
            continue

        # this cell defines pipeline parameters
        if 'pipeline-parameters' in tags['block_names']:
            pipeline_parameters += '\n' + c.source
            current_block_pipeline_parameters = True
            current_block_global = False
            continue

        # This cell is to be appended to every code block
        if 'global' in tags['block_names']:
            global_block += '\n' + c.source
            current_block_global = True
            current_block_pipeline_parameters = False
            continue

        # check that the previous block already exists in the graph if the prev tag is used
        for p in tags['previous_blocks']:
            if p not in nb_graph.nodes:
                raise ValueError(
                    f"Block `{p}` does not exist. It was defined as previous block of `{tags['block_names']}`")

        # if the block was not tagged with a name,
        # add the source code to the block defined by the previous(es) cell(s)
        if len(tags['block_names']) == 0:
            if current_block_global:
                global_block += '\n' + c.source
            elif current_block_pipeline_parameters:
                pipeline_parameters += '\n' + c.source
            else:
                assert current_block is not None
                merge_code(nb_graph, current_block, c.source)
        else:
            current_block_global = False
            current_block_pipeline_parameters = False
            # TODO: Taking by default first block name tag. Need specific behavior
            current_block = tags['block_names'][0]
            for block_name in tags['block_names']:
                # add node to DAG, adding tags and source code of notebook cell
                if block_name not in nb_graph.nodes:
                    _tags = copy.deepcopy(tags)
                    _tags.block_name = block_name
                    nb_graph.add_node(block_name, tags=_tags, source=c.source,
                                      ins=set(), outs=set())
                    if tags['previous_blocks']:
                        for block in tags['previous_blocks']:
                            nb_graph.add_edge(block, block_name)
                else:
                    merge_code(nb_graph, block_name, c.source)

    # Prepend all global code blocks before every other one
    if global_block != "":
        for block in nb_graph:
            block_data = nb_graph.nodes(data=True)[block]
            nx.set_node_attributes(nb_graph, {block: {
                'source': global_block + '\n\n' + block_data['source']}})

    return nb_graph, pipeline_parameters
