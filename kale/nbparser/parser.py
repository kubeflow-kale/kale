import os
import re
import copy
import tempfile

import nbformat as nb
import networkx as nx

from graphviz import Source


class _dotdict(dict):
    """
    dot.notation access to dictionary attributes
    """
    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__


def _copy_tags(tags):
    new_tags = _dotdict()
    for k, v in tags.items():
        if type(v) == list and len(v) == 0:
            new_tags[k] = list()
        else:
            new_tags[k] = copy.deepcopy(tags[k])
    return new_tags


def _k8s_validate_name(n):
    """

    Args:
        n:

    Returns:

    """
    if re.match(r'^[a-z0-9]*$', n) is None:
        raise ValueError(f"Wrong name {n}: label must only consist of lower case alphanumeric characters")


def plot_pipeline(graph, dot_path=None):
    """
    Dump the graph to a dot file and visualize it using Graphviz

    Args:
        graph: NetworkX graph instance
        dot_path: Path to .dot file location

    """
    rm_path = False
    if dot_path is None:
        # crete temp dir to store the .dot file
        dot_path = tempfile.mkstemp()
        rm_path = True

    nx.drawing.nx_pydot.write_dot(graph, dot_path)
    s = Source.from_file(dot_path)
    s.view()

    if rm_path:
        os.remove(dot_path)


# TODO: Need to better generalize the tagging language
def parse_metadata(metadata: dict):
    """

    Args:
        metadata:

    Returns:

    """
    parsed_tags = _dotdict()

    # block_names is a list because a cell block might be assigned to more
    # than one pipeline block. It can happen with DL DataLoaders that are assigned to a specific device
    # and are used for multiple models
    parsed_tags['block_names'] = list()
    parsed_tags['previous_blocks'] = list()
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
            _k8s_validate_name(elems[1])
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


def merge_code(nb_graph, dst, tags, code):
    """

    Args:
        graph: nx.DiGraph
                The graph defined by the notebook's tags
        dst: string
                Name id of the destination node
        tags: dict
                Parsed tags related to input code
        code: string
                Python source code to be appended to dst node

    Returns:
        A graph with `code` merged into one of the original graph nodes
    """
    # add code to existing block
    source_code = nb_graph.nodes(data=True)[dst]['source']
    existing_tags = nb_graph.nodes(data=True)[dst]['tags']
    # use `set` operation to make unique list
    if len(tags['in']) > 0:
        existing_tags['in'].extend(tags['in'])
        existing_tags['in'] = list(set(existing_tags['in']))
    if len(tags['out']) > 0:
        existing_tags['out'].extend(tags['out'])
        existing_tags['out'] = list(set(existing_tags['out']))
    source_code += "\n" + code
    # update pipeline block source code
    nx.set_node_attributes(nb_graph, {dst: {'source': source_code,
                                            'tags': existing_tags,
                                            'ins': set(),
                                            'outs': set()}})
    return nb_graph


def parse_notebook(nb_path, nb_format_version):
    """
    Created a NetworkX graph based on the input notebook's tags
    Cell's source code are embedded into the graph as node attributes

    Args:
        nb_path:
        nb_format_version:

    Returns: NetworkX DiGraph
                NetworkX directed graph representing the pipeline defined by the notebook tags

    """
    # Read source JupyterNotebook

    source_nb = nb.read(nb_path.__str__(), as_version=nb_format_version)
    # output graph
    nb_graph = nx.DiGraph()

    # Used in case there some consecutive code block of the same pipeline block
    # and only the first block is tagged with the block name
    current_block = None
    # TODO: Add flag to know when the previous cell references multiple block names
    #   In this way, if the next block has no block_name tag, kale can throuw an error
    #   and say that in this case a block_name must be specified (cannot know which one of the previous
    #   to use for merge)
    multiple_parent_blocks = False

    # iterate over the notebook cells, from first to last
    for c in source_nb.cells:
        # parse only source code cells
        if c.cell_type != "code":
            continue

        tags = parse_metadata(c.metadata)
        if tags is None:
            continue

        # check that the previous block already exist in the graph
        for p in tags.previous_blocks:
            if p not in nb_graph.nodes:
                raise ValueError(
                    f"Block `{p}` does not exist. It was defined as previous block of `{tags.block_names}`")

        # if the block was not tagged with a name,
        # add the source code to the block defined by the previous(es) cell(s)
        if len(tags.block_names) == 0:
            assert current_block is not None
            nb_graph = merge_code(nb_graph, current_block, tags, c.source)
        else:
            # TODO: Taking by default first block name tag. Need specific behavior
            current_block = tags.block_names[0]
            for block_name in tags.block_names:
                # add node to DAG, adding tags and source code of notebook cell
                if block_name not in nb_graph.nodes:
                    _tags = _copy_tags(tags)
                    _tags.block_name = block_name
                    nb_graph.add_node(block_name, tags=_tags, source=c.source, ins=set(), outs=set())
                    if tags.previous_blocks:
                        for block in tags.previous_blocks:
                            nb_graph.add_edge(block, block_name)
                else:
                    nb_graph = merge_code(nb_graph, block_name, tags, c.source)

    # TODO: Prepend the global code blocks before every other block
    return nb_graph
