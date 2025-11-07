# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

import networkx as nx

from kale.common import graphutils


def test_get_ordered_ancestors():
    """Test that the ancestors are retrieved in the expected order."""
    g = nx.DiGraph()
    # Layer 1
    g.add_edge("A", "B")
    # Layer 2
    g.add_edge("B", "C")
    g.add_edge("B", "D")
    g.add_edge("B", "E")
    # Layer 3
    g.add_edge("C", "R")
    g.add_edge("D", "R")
    g.add_edge("E", "R")

    ancs = ["B", "A"]
    assert graphutils.get_ordered_ancestors(g, "E") == ancs

    ancs = ["B", "A"]
    assert graphutils.get_ordered_ancestors(g, "C") == ancs

    ancs = ["C", "D", "E", "B", "A"]
    assert graphutils.get_ordered_ancestors(g, "R") == ancs
