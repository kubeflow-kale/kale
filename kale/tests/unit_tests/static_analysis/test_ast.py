import ast
import pytest
from testfixtures import compare

from kale.static_analysis.ast import get_all_names, get_list_tuple_names, \
    get_function_and_class_names, parse_assignments_expressions


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
    (_foos_snippet, ['_test', '_test2', 'var', 'b']),
    (_class_snippet, ['test', '__init__', 'self', 'a', 'foo', 'b']),
    (_ctx_mngr_snippet, ['my_context', 'param', 'res', 'ctx'])
])
def test_get_all_names(code, target):
    """Tests get_all_names function."""
    res = get_all_names(code)
    assert sorted(res) == sorted(target)


def test_get_all_names_exc():
    """Tests exception when passing a wrong code snippet to get_all_names."""
    with pytest.raises(SyntaxError):
        get_all_names(_wrong_code_snippet)


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
    res = get_list_tuple_names(tree.body[0].value)
    assert sorted(res) == sorted(target)


@pytest.mark.parametrize("code,target", [
    ('', []),
    (_foos_snippet, ['_test', '_test2']),
    (_class_snippet, ['__init__', 'foo', 'test'])
])
def test_get_function_and_class_names(code, target):
    """Test get_function_and_class_names function."""
    res = get_function_and_class_names(code)
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
    res = parse_assignments_expressions(code)
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
        parse_assignments_expressions(code)
