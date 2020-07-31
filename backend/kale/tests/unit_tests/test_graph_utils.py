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
