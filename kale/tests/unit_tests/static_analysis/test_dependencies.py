import pytest

from kale.static_analysis.dependencies import pyflakes_report


@pytest.mark.parametrize("code,target", [
    ('', []),
    ('a = b', ['b']),
    ('a = foo(b)', ['foo', 'b']),
    ('a = b\nfoo(b)', ['b', 'foo']),
    ('foo(b)', ['foo', 'b'])
])
def test_pyflakes_report(code, target):
    """Tests pyflakes_report function."""
    res = pyflakes_report(code)
    assert sorted(res) == sorted(target)
