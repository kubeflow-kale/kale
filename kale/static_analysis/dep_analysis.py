import networkx as nx

from static_analysis.inspector import CodeInspector
from static_analysis.linter import CodeInspectorLinter


# Code blocks that are injected at the beginning of each pipelines block
__GLOBAL_BLOCKS = ['imports', 'functions']
# Variables that inserted at the beginning of pipeline blocks by templates
__HARDCODED_VARIABLES = ['_input_data_folder']


def in_variables_detection(nb_graph):
    """

    Returns:

    """
    code_inspector = CodeInspectorLinter()
    # Go through pipeline DAG and parse variable names
    # Start first with __GLOBAL_BLOCKS: code blocks that are injected in every pipeline block
    block_names = nb_graph.nodes()
    for block in block_names:
        if block in __GLOBAL_BLOCKS:
            continue

        _code_blocks = list()
        for g in __GLOBAL_BLOCKS:
            if g in nb_graph.nodes:
                _code_blocks.append(nb_graph.nodes(data=True)[g]['source'])
        _code_blocks.append(nb_graph.nodes(data=True)[block]['source'])
        complete_block = '\n'.join(_code_blocks)
        ins = code_inspector.inspect_code(code=complete_block)

        # remove from the list the variables that will be injected by template code
        ins.difference_update(set(__HARDCODED_VARIABLES))
        nx.set_node_attributes(nb_graph, {block: {'ins': ins}})


def out_variable_detection(nb_graph):
    """
    Create the `outs` set of variables to be written at the end of each block.
    To get the `outs` of each block, the function uses the topological order of
    the graph and cycles through all the ancestors of each node.
    Since we know what are the `ins` of the current block, we can get the blocks were
    those `ins` where created. If an ancestor matches the `ins` entry, then it will have
    a matching `outs`.
    """
    for block_name in reversed(list(nx.topological_sort(nb_graph))):
        # global blocks are injected at the beginning of every code block
        if block_name in __GLOBAL_BLOCKS:
            continue
        ins = nb_graph.nodes(data=True)[block_name]['ins']
        # TODO: assume for now that we are just passing data from father to children.
        #   In case we wanted to use deeper dependencies, use nx.ancestors()
        for _a in nb_graph.predecessors(block_name):
            father_data = nb_graph.nodes(data=True)[_a]
            # Intersect the missing names of this father child with all
            # the father's names. The intersection is the list of variables
            # that the father need to serialize
            outs = ins.intersection(father_data['all_names'])
            # include previous `outs` in case this father has multiple children steps
            outs.update(father_data['outs'])
            # add to father the new `outs` variables
            nx.set_node_attributes(nb_graph, {_a: {'outs': outs}})

    # now merge the user defined (using tags) `out` variables
    for block_name in nb_graph.nodes:
        block_data = nb_graph.nodes(data=True)[block_name]
        if 'out' in block_data:
            outs = block_data['outs']
            outs.update(block_data['tags']['out'])
            nx.set_node_attributes(nb_graph, {block_name: {'outs': outs}})


def variables_dependencies_detection(nb_graph):
    """

    Args:
        nb_graph:

    Returns: NetworkX DiGraph
                The input graph with additional tags

    """
    # First get all the names of each code block
    inspector = CodeInspector()
    for block in nb_graph:
        block_data = nb_graph.nodes(data=True)[block]
        all_names = inspector.get_all_names(block_data['source'])
        nx.set_node_attributes(nb_graph, {block: {'all_names': all_names}})

    # get all the missing names in each block
    in_variables_detection(nb_graph)
    out_variable_detection(nb_graph)

    return nb_graph
