#  Copyright 2020 The Kale Authors
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

import networkx as nx


def get_ordered_ancestors(g: nx.DiGraph, node):
    """Get a list of ancestors ordered by DAG layers.

    The default NetworkX ancestors function computes all the ancestors of a
    node by returning all the nodes that have a path to it. The problem is
    that there is not guarantee in the ordering of the result.

    Example graph G:

              +---+
              | A |
              +---+
                |
                v
    +---+     +---+     +---+
    | C | <-- | B | --> | D |
    +---+     +---+     +---+
      |         |         |
      |         v         |
      |       +---+       |
      |       | E |       |
      |       +---+       |
      |         |         |
      |         v         |
      |       +---+       |
      +-----> | R | <-----+
              +---+

    Running G.ancestors('R') will return a set with the correct ancestors,
    but they are not ordered by DAG Layer. Since Kale needs to analyze the
    nodes in reverse execution order, we need to compute the ancestors
    as ['C', 'E', 'D', 'B', 'A'], where ['C', 'E', 'D'] is the first ancestor
    layer, ['B'] the second and ['A'] the third.

    This all comes down to performing a reversed breadth-first search, avoiding
    duplicates in the resulting list of ancestors.

    Args:
         g (nx.DiGraph): A DAG representing a pipeline
         node (str): The name of the node for which to compute the ancestors

    Returns (list): A list of ancestors, ordered by DAG layers.
    """
    # list of ancestors, unique and ordered by layers
    ancs = list()
    # used as queue
    q = [node]

    while q:
        cur = q.pop(0)
        # sort ancestors for a deterministic result
        preds = sorted(list(g.predecessors(cur)))
        for p in preds:
            if p not in ancs:
                ancs.append(p)
                q.append(p)
    return ancs


def get_leaf_nodes(g: nx.DiGraph):
    """Get the list of leaf nodes of a DAG.

    A node is considered a leaf when its in-degree is > 0 and its out-degree
    is 0.

    Args:
        g (nx.DiGraph): A DAG representing a pipeline

    Returns (list): A list of leaf nodes.
    """
    return [x for x in g.nodes() if g.out_degree(x) == 0]
