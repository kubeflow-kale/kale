import pytest

from static_analysis.inspector import  CodeInspector


def __open_snippet(snippet_path):
    return open(snippet_path, 'r').read()


@pytest.mark.parametrize("snippet,target", [

])
def test_register_global_names(snippet, target):
    pass


@pytest.mark.parametrize("snippet,global_snippet,target", [
    ('numpy_example.py', None, (set(), {'a', 'b', 'np', 'os'})),
    ('numpy_example_2.py', None, ({'a'}, {'b', 'np', 'os'})),
    ('all_names.py', None, (
    {'rilevazioni', 'date', 'np'}, {'a', 'os', 'tqdm', 'k', 'data', 'j', 'test_function', 'i', 'b',
                                    'my_var', 'tests_class', 'pbar'})),
    ('all_names.py', 'global_1.py', (
    {'rilevazioni', 'date'}, {'a', 'os', 'tqdm', 'k', 'data', 'j', 'test_function', 'i', 'b', 'my_var',
                              'tests_class', 'pbar'})),

])
def test_inspect_code(snippet, global_snippet, target):
    inspector = CodeInspector()

    code = __open_snippet('code_snippets/' + snippet)

    if global_snippet is not None:
        global_code = __open_snippet('code_snippets/' + global_snippet)
        inspector.register_global_names(global_code)
    res = inspector.inspect_code(code)
    assert res == target


def test_inspect_notebook(notebook, target):
    """
    Test the output of the inspector from a complete notebook.
    Args:
        notebook:
        target:

    Returns:

    """
