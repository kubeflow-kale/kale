import difflib

def unidiff_output(expected, actual):
    """
    Helper function. Returns a string containing the unified diff of two multiline strings.
    """
    expected=expected.splitlines(1)
    actual=actual.splitlines(1)

    diff=difflib.unified_diff(expected, actual)

    return ''.join(diff)