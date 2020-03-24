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

import ast
import pytest
from testfixtures import compare

from kale.static_analysis import ast as kale_ast


_numpy_snippet = '''
import os
import numpy as np
a = np.random.random((10, 10))
b = a.sum()
print(b)
'''

_numpy2_snippet = '''
import os
import numpy as np
b = a.sum()
print(b)
'''

_foos_snippet = '''
def _test(a):
    pass

def _test2(b, *args, **kwargs):
    var = b
'''

_class_snippet = '''
class test:
    def __init__(self, a):
        self.a = a

    def foo(self, b):
        self.a = b
'''

_ctx_mngr_snippet = '''
with my_context(param) as ctx:
    res = ctx.use()
'''

_wrong_code_snippet = '''
def fun()
    pass
'''


@pytest.mark.parametrize("code,target", [
    ('', []),
    (_numpy_snippet, ['a', 'b', 'np', 'os', 'print']),
    (_numpy2_snippet, ['a', 'b', 'np', 'os', 'print']),
    (_foos_snippet, ['_test', '_test2']),
    (_class_snippet, ['test']),
    (_ctx_mngr_snippet, ['my_context', 'param', 'res', 'ctx'])
])
def test_get_marshal_candidates(code, target):
    """Tests get_marshal_candidates function."""
    res = kale_ast.get_marshal_candidates(code)
    assert sorted(res) == sorted(target)


def test_get_marshal_candidates_exc():
    """Tests exception when passing a wrong code snippet."""
    with pytest.raises(SyntaxError):
        kale_ast.get_marshal_candidates(_wrong_code_snippet)


@pytest.mark.parametrize("code,target", [
    ('()', []),
    ('[]', []),
    ('(a,)', ['a']),
    ('[a,]', ['a']),
    ('(a,(b,))', ['a', 'b']),
    ('[a,[b,]]', ['a', 'b']),
])
def test_get_list_tuple_names(code, target):
    """Test list_tuple_names function."""
    tree = ast.parse(code)
    res = kale_ast.get_list_tuple_names(tree.body[0].value)
    assert sorted(res) == sorted(target)


@pytest.mark.parametrize("code,target", [
    ('', []),
    (_foos_snippet, ['_test', '_test2']),
    (_class_snippet, ['__init__', 'foo', 'test'])
])
def test_get_function_and_class_names(code, target):
    """Test get_function_and_class_names function."""
    res = kale_ast.get_function_and_class_names(code)
    assert sorted(res) == sorted(target)


@pytest.mark.parametrize("code,target", [
    ('', {}),
    ('a = "a"', {'a': (type('').__name__, "a")}),
    ('a = 3', {'a': (type(0).__name__, 3)}),
    ('a = 2.', {'a': (type(0.).__name__, 2.)}),
    ('a = True', {'a': (type(True).__name__, True)}),
])
def test_parse_assignments_expressions(code, target):
    """Test parse_assignments_expressions function."""
    res = kale_ast.parse_assignments_expressions(code)
    compare(res, target)


@pytest.mark.parametrize("code", [
    'a = None',
    'a + 1',
    'a, b = 3',
    'a = b = 3',
    'a = [2]',
    'a = b',
])
def test_parse_assignments_expressions_exc(code):
    """Test parse_assignments_expressions function."""
    with pytest.raises(ValueError):
        kale_ast.parse_assignments_expressions(code)


@pytest.mark.parametrize("code, target", [
    ('', {}),
    ('   ', {}),
    ('print(a)', {'a': 'a'}),
    ('print(a)\nprint(var)\nprint(test_var)', {'a': 'a',
                                               'var': 'var',
                                               'test-var': 'test_var'}),
])
def test_parse_metrics_print_statements(code, target):
    """Tests parse_metrics_print_statements function."""
    res = kale_ast.parse_metrics_print_statements(code)
    assert res == target


@pytest.mark.parametrize("code", [
    'print(foo())',
    'def',
    'variable',
    'print(var)\nname',
    '_variable'
])
def test_parse_metrics_print_statements_exc(code):
    """Tests a exception cases for parse_metrics_print_statements function."""
    with pytest.raises(ValueError):
        kale_ast.parse_metrics_print_statements(code)


def test_parse_functions():
    """Test that the body of the function is retrieved correctly."""
    code = '''
x = 5
def foo():
    print('hello')
    print(x)
    '''

    target = {"foo": "def foo():\n    print('hello')\n    print(x)\n"}
    assert kale_ast.parse_functions(code) == target


def test_get_calls():
    """Test that just function calls are detected."""
    code = '''
a.obj()
foo()
        '''
    assert kale_ast.get_function_calls(code) == {'foo'}

    code = '''
x = 5
def foo():
    print(x)
        '''
    assert kale_ast.get_function_calls(code) == {'print'}
