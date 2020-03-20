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

import pytest
import networkx as nx

from kale.static_analysis import dependencies


@pytest.mark.parametrize("code,target", [
    ('', []),
    ('a = b', ['b']),
    ('a = foo(b)', ['foo', 'b']),
    ('a = b\nfoo(b)', ['b', 'foo']),
    ('foo(b)', ['foo', 'b'])
])
def test_pyflakes_report(code, target):
    """Tests pyflakes_report function."""
    res = dependencies.pyflakes_report(code)
    assert sorted(res) == sorted(target)


def test_detect_fns_free_variables():
    """Test the function returns the correct free variables."""
    source_code = '''
x = 5
def foo():
    print(math.sqrt(x))
    '''

    target = {"foo": ({"x", "math"}, {})}
    assert target == dependencies.detect_fns_free_variables(source_code)


def test_detect_fns_free_variables_with_imports():
    """Test the function returns the correct free variables."""
    imports_and_functions = """
import math
    """

    source_code = '''
x = 5
def foo():
    print(math.sqrt(x))
    '''

    target = {"foo": ({"x"}, {})}
    assert target == dependencies.detect_fns_free_variables(
        source_code,
        imports_and_functions
    )


def test_dependencies_detection_free_variable():
    """Test dependencies detection with free variables."""
    imports_and_functions = ""
    pipeline_parameters = {}

    g = nx.DiGraph()
    # NODES
    g.add_node("step1", ins=list(), outs=list(), source=['''
%s
x = 5
    ''' % imports_and_functions])
    g.add_node("step2", ins=list(), outs=list(), source=['''
%s
def foo():
   print(x)
    ''' % imports_and_functions])
    g.add_node("step3", ins=list(), outs=list(), source=['''
%s
foo()
    ''' % imports_and_functions])
    # EDGES
    g.add_edge("step1", "step2")
    g.add_edge("step2", "step3")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step1']['ins'] == []
    assert g.nodes(data=True)['step1']['outs'] == ['x']
    assert g.nodes(data=True)['step2']['ins'] == ['x']
    assert g.nodes(data=True)['step2']['outs'] == ['foo', 'x']
    assert g.nodes(data=True)['step3']['ins'] == ['foo', 'x']
    assert g.nodes(data=True)['step3']['outs'] == []


def test_dependencies_detection_inner_function():
    """Test dependencies detection with inner functions."""
    imports_and_functions = ""
    pipeline_parameters = {}

    g = nx.DiGraph()
    # NODES
    g.add_node("step1", ins=list(), outs=list(), source=['''
%s
x = 5
    ''' % imports_and_functions])
    g.add_node("step2", ins=list(), outs=list(), source=['''
%s
def foo():
    def bar(x):
        print(x)
    bar(5)
    ''' % imports_and_functions])
    g.add_node("step3", ins=list(), outs=list(), source=['''
%s
foo()
print(x)
    ''' % imports_and_functions])
    # EDGES
    g.add_edge("step1", "step2")
    g.add_edge("step2", "step3")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step1']['ins'] == []
    assert g.nodes(data=True)['step1']['outs'] == ['x']
    assert g.nodes(data=True)['step2']['ins'] == []
    assert g.nodes(data=True)['step2']['outs'] == ['foo']
    assert g.nodes(data=True)['step3']['ins'] == ['foo', 'x']
    assert g.nodes(data=True)['step3']['outs'] == []


def test_dependencies_detection_inner_function_free_variable():
    """Test dependencies detection with free variables and inner function."""
    imports_and_functions = ""
    pipeline_parameters = {}

    g = nx.DiGraph()
    # NODES
    g.add_node("step1", ins=list(), outs=list(), source=['''
%s
x = 5
    ''' % imports_and_functions])
    g.add_node("step2", ins=list(), outs=list(), source=['''
%s
def foo():
    def bar():
        print(x)
    ''' % imports_and_functions])
    g.add_node("step3", ins=list(), outs=list(), source=['''
%s
foo()
    ''' % imports_and_functions])
    # EDGES
    g.add_edge("step1", "step2")
    g.add_edge("step2", "step3")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step1']['ins'] == []
    assert g.nodes(data=True)['step1']['outs'] == ['x']
    assert g.nodes(data=True)['step2']['ins'] == ['x']
    assert g.nodes(data=True)['step2']['outs'] == ['foo', 'x']
    assert g.nodes(data=True)['step3']['ins'] == ['foo', 'x']
    assert g.nodes(data=True)['step3']['outs'] == []


def test_dependencies_detection_with_parameter():
    """Test dependencies detection with function with parameter."""
    imports_and_functions = ""
    pipeline_parameters = {}

    g = nx.DiGraph()
    # NODES
    g.add_node("step1", ins=list(), outs=list(), source=['''
%s
x = 5
    ''' % imports_and_functions])
    g.add_node("step2", ins=list(), outs=list(), source=['''
%s
def foo(x):
    def bar():
        print(x)
    ''' % imports_and_functions])
    g.add_node("step3", ins=list(), outs=list(), source=['''
%s
foo(5)
    ''' % imports_and_functions])
    # EDGES
    g.add_edge("step1", "step2")
    g.add_edge("step2", "step3")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step1']['ins'] == []
    assert g.nodes(data=True)['step1']['outs'] == []
    assert g.nodes(data=True)['step2']['ins'] == []
    assert g.nodes(data=True)['step2']['outs'] == ['foo']
    assert g.nodes(data=True)['step3']['ins'] == ['foo']
    assert g.nodes(data=True)['step3']['outs'] == []


def test_dependencies_detection_with_globals():
    """Test dependencies detection with inner function and globals."""
    imports_and_functions = "import math"
    pipeline_parameters = {}

    g = nx.DiGraph()
    # NODES
    g.add_node("step1", ins=list(), outs=list(), source=['''
%s
x = 5
    ''' % imports_and_functions])
    g.add_node("step2", ins=list(), outs=list(), source=['''
%s
def foo(x):
    def bar():
        math.sqrt(x)
    bar()
    ''' % imports_and_functions])
    g.add_node("step3", ins=list(), outs=list(), source=['''
%s
foo(5)
    ''' % imports_and_functions])
    # EDGES
    g.add_edge("step1", "step2")
    g.add_edge("step2", "step3")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step1']['ins'] == []
    assert g.nodes(data=True)['step1']['outs'] == []
    assert g.nodes(data=True)['step2']['ins'] == []
    assert g.nodes(data=True)['step2']['outs'] == ['foo']
    assert g.nodes(data=True)['step3']['ins'] == ['foo']
    assert g.nodes(data=True)['step3']['outs'] == []


def test_dependencies_detection_with_pipeline_parameters():
    """Test dependencies are detected with pipeline parameters and globals."""
    imports_and_functions = "import math"
    pipeline_parameters = {"y": (5, 'int')}

    g = nx.DiGraph()
    # NODES
    g.add_node("step1", ins=list(), outs=list(), source=['''
%s
x = 5
    ''' % imports_and_functions])
    g.add_node("step2", ins=list(), outs=list(), source=['''
%s
def foo(x):
    def bar():
        math.sqrt(x + y)
    bar()
    ''' % imports_and_functions])
    g.add_node("step3", ins=list(), outs=list(), source=['''
%s
foo(5)
    ''' % imports_and_functions])
    # EDGES
    g.add_edge("step1", "step2")
    g.add_edge("step2", "step3")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step1']['ins'] == []
    assert g.nodes(data=True)['step1']['outs'] == []
    assert g.nodes(data=True)['step2']['ins'] == []
    assert g.nodes(data=True)['step2']['outs'] == ['foo']
    assert g.nodes(data=True)['step2']['parameters'] == {"y": (5, 'int')}
    assert g.nodes(data=True)['step3']['ins'] == ['foo']
    assert g.nodes(data=True)['step3']['outs'] == []
    assert g.nodes(data=True)['step3']['parameters'] == {"y": (5, 'int')}


def test_dependencies_detection_with_try_except():
    """Test dependencies are detected with functions inside try."""
    imports_and_functions = ""
    pipeline_parameters = {}

    g = nx.DiGraph()
    # NODES
    g.add_node("step1", ins=list(), outs=list(), source=['''
%s
x = 5
y = 6
    ''' % imports_and_functions])
    g.add_node("step2", ins=list(), outs=list(), source=['''
%s
try:
    def foo():
        print(x)
    def bar():
        print(y)
except:
    pass
    ''' % imports_and_functions])
    g.add_node("step3", ins=list(), outs=list(), source=['''
%s
foo()
bar()
    ''' % imports_and_functions])
    # EDGES
    g.add_edge("step1", "step2")
    g.add_edge("step2", "step3")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step1']['ins'] == []
    assert g.nodes(data=True)['step1']['outs'] == ['x', 'y']
    assert g.nodes(data=True)['step2']['ins'] == ['x', 'y']
    assert g.nodes(data=True)['step2']['outs'] == ['bar', 'foo', 'x', 'y']
    assert g.nodes(data=True)['step3']['ins'] == ['bar', 'foo', 'x', 'y']
    assert g.nodes(data=True)['step3']['outs'] == []


def test_dependencies_detection_recursive():
    """Test dependencies are detected even with a chain of functions calls."""
    imports_and_functions = ""
    pipeline_parameters = {}

    g = nx.DiGraph()
    # NODES
    g.add_node("step1", ins=list(), outs=list(), source=['''
%s
x = 5
    ''' % imports_and_functions])
    g.add_node("step2", ins=list(), outs=list(), source=['''
%s
def foo():
    print(x)
def bar():
    foo()
    ''' % imports_and_functions])
    g.add_node("step3", ins=list(), outs=list(), source=['''
%s
bar()
    ''' % imports_and_functions])
    # EDGES
    g.add_edge("step1", "step2")
    g.add_edge("step2", "step3")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step1']['ins'] == []
    assert g.nodes(data=True)['step1']['outs'] == ['x']
    assert g.nodes(data=True)['step2']['ins'] == ['x']
    assert g.nodes(data=True)['step2']['outs'] == ['bar', 'foo', 'x']
    assert g.nodes(data=True)['step3']['ins'] == ['bar', 'foo', 'x']
    assert g.nodes(data=True)['step3']['outs'] == []


def test_dependencies_detection_recursive_different_steps():
    """Test dependencies are detected even with a chain of functions calls."""
    imports_and_functions = ""
    pipeline_parameters = {}

    g = nx.DiGraph()
    # NODES
    g.add_node("step1", ins=list(), outs=list(), source=['''
%s
x = 5
def foo():
    print(x)
    ''' % imports_and_functions])
    g.add_node("step2", ins=list(), outs=list(), source=['''
%s
def bar():
    foo()
    ''' % imports_and_functions])
    g.add_node("step3", ins=list(), outs=list(), source=['''
%s
bar()
    ''' % imports_and_functions])
    # EDGES
    g.add_edge("step1", "step2")
    g.add_edge("step2", "step3")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step1']['ins'] == []
    assert g.nodes(data=True)['step1']['outs'] == ['foo', 'x']
    assert g.nodes(data=True)['step2']['ins'] == ['foo', 'x']
    assert g.nodes(data=True)['step2']['outs'] == ['bar', 'foo', 'x']
    assert g.nodes(data=True)['step3']['ins'] == ['bar', 'foo', 'x']
    assert g.nodes(data=True)['step3']['outs'] == []


def test_dependencies_detection_recursive_different_steps_triple():
    """Test dependencies are detected even with a long chain of fns calls."""
    imports_and_functions = ""
    pipeline_parameters = {}

    g = nx.DiGraph()
    # NODES
    g.add_node("step0", ins=list(), outs=list(), source=['''
    %s
x = 5
def init():
    print(x)
        ''' % imports_and_functions])
    g.add_node("step1", ins=list(), outs=list(), source=['''
%s
def foo():
    init()
    ''' % imports_and_functions])
    g.add_node("step2", ins=list(), outs=list(), source=['''
%s
def bar():
    foo()
    ''' % imports_and_functions])
    g.add_node("step3", ins=list(), outs=list(), source=['''
%s
bar()
    ''' % imports_and_functions])
    # EDGES
    g.add_edge("step0", "step1")
    g.add_edge("step1", "step2")
    g.add_edge("step2", "step3")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step0']['ins'] == []
    assert g.nodes(data=True)['step0']['outs'] == ['init', 'x']
    assert g.nodes(data=True)['step1']['ins'] == ['init', 'x']
    assert g.nodes(data=True)['step1']['outs'] == ['foo', 'init', 'x']
    assert g.nodes(data=True)['step2']['ins'] == ['foo', 'init', 'x']
    assert g.nodes(data=True)['step2']['outs'] == ['bar', 'foo', 'init', 'x']
    assert g.nodes(data=True)['step3']['ins'] == ['bar', 'foo', 'init', 'x']
    assert g.nodes(data=True)['step3']['outs'] == []


def test_dependencies_detection_recursive_different_steps_branch():
    """Test dependencies when fns are passed from multiple branches."""
    imports_and_functions = ""
    pipeline_parameters = {}

    g = nx.DiGraph()
    # NODES
    g.add_node("step0", ins=list(), outs=list(), source=['''
    %s
x = 5
y = 6
        ''' % imports_and_functions])
    g.add_node("stepL", ins=list(), outs=list(), source=['''
%s
def foo():
    print(x)
    ''' % imports_and_functions])
    g.add_node("stepR", ins=list(), outs=list(), source=['''
%s
def bar():
    print(y)
    ''' % imports_and_functions])
    g.add_node("stepM", ins=list(), outs=list(), source=['''
%s
def result():
    foo()
    bar()
    ''' % imports_and_functions])
    g.add_node("stepF", ins=list(), outs=list(), source=['''
%s
result()
        ''' % imports_and_functions])
    # EDGES
    g.add_edge("step0", "stepL")
    g.add_edge("step0", "stepR")
    g.add_edge("stepL", "stepM")
    g.add_edge("stepR", "stepM")
    g.add_edge("stepM", "stepF")

    dependencies.dependencies_detection(g, pipeline_parameters,
                                        imports_and_functions)
    assert g.nodes(data=True)['step0']['ins'] == []
    assert g.nodes(data=True)['step0']['outs'] == ['x', 'y']
    assert g.nodes(data=True)['stepL']['ins'] == ['x']
    assert g.nodes(data=True)['stepL']['outs'] == ['foo', 'x']
    assert g.nodes(data=True)['stepR']['ins'] == ['y']
    assert g.nodes(data=True)['stepR']['outs'] == ['bar', 'y']
    assert g.nodes(data=True)['stepM']['ins'] == ['bar', 'foo', 'x', 'y']
    assert (g.nodes(data=True)['stepM']['outs']
            == ['bar', 'foo', 'result', 'x', 'y'])
    assert (g.nodes(data=True)['stepF']['ins']
            == ['bar', 'foo', 'result', 'x', 'y'])
    assert g.nodes(data=True)['stepF']['outs'] == []
