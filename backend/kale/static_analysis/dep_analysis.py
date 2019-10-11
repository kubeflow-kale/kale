import networkx as nx

from kale.static_analysis.inspector import CodeInspector
from kale.static_analysis.linter import CodeInspectorLinter


def in_variables_detection(nb_graph: nx.DiGraph, ignore_symbols: set = None):
    code_inspector = CodeInspectorLinter()
    # Go through pipeline DAG and parse variable names
    # Start first with __GLOBAL_BLOCKS: code blocks that are injected in every pipeline block
    block_names = nb_graph.nodes()
    for block in block_names:
        source_code = nb_graph.nodes(data=True)[block]['source']
        ins = code_inspector.inspect_code(code=source_code)

        if ignore_symbols:
            ins.difference_update(set(ignore_symbols))
        nx.set_node_attributes(nb_graph, {block: {'ins': ins}})


def out_variable_detection(nb_graph: nx.DiGraph, ignore_symbols: set = None):
    """
    Create the `outs` set of variables to be written at the end of each block.
    To get the `outs` of each block, the function uses the topological order of
    the graph and cycles through all the ancestors of each node.
    Since we know what are the `ins` of the current block, we can get the blocks were
    those `ins` where created. If an ancestor matches the `ins` entry, then it will have
    a matching `outs`.
    """
    for block_name in reversed(list(nx.topological_sort(nb_graph))):
        ins = nb_graph.nodes(data=True)[block_name]['ins']
        # for _a in nb_graph.predecessors(block_name):
        for _a in nx.ancestors(nb_graph, block_name):
            father_data = nb_graph.nodes(data=True)[_a]
            # Intersect the missing names of this father child with all
            # the father's names. The intersection is the list of variables
            # that the father need to serialize
            outs = ins.intersection(father_data['all_names'])
            # include previous `outs` in case this father has multiple children steps
            outs.update(father_data['outs'])
            # remove symbols to ignore
            if ignore_symbols:
                ins.difference_update(set(ignore_symbols))
            # add to father the new `outs` variables
            nx.set_node_attributes(nb_graph, {_a: {'outs': outs}})

    # now merge the user defined (using tags) `out` variables
    for block_name in nb_graph.nodes:
        block_data = nb_graph.nodes(data=True)[block_name]
        if 'out' in block_data:
            outs = block_data['outs']
            outs.update(block_data['tags']['out'])
            nx.set_node_attributes(nb_graph, {block_name: {'outs': outs}})


def variables_dependencies_detection(nb_graph: nx.DiGraph, ignore_symbols: set = None):
    # First get all the names of each code block
    inspector = CodeInspector()
    for block in nb_graph:
        block_data = nb_graph.nodes(data=True)[block]
        all_names = inspector.get_all_names(block_data['source'])
        nx.set_node_attributes(nb_graph, {block: {'all_names': all_names}})

    # get all the missing names in each block
    in_variables_detection(nb_graph, ignore_symbols)
    out_variable_detection(nb_graph, ignore_symbols)

    return nb_graph


def pipeline_parameters_detection(parameters_code_block):
    inspector = CodeInspector()
    return inspector.parse_variables_block(parameters_code_block)
