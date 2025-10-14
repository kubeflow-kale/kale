# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

from kale.common import utils


def test_comment_magic_commands():
    """Test the magic common properly comments a multiline code block."""
    code = '''
%%a magic cell command
some code
%matplotlib inline
%consecutive command
some other code
some other code
%another command
some other code
    '''

    target = '''
#%%a magic cell command
some code
#%matplotlib inline
#%consecutive command
some other code
some other code
#%another command
some other code
    '''
    assert utils.comment_magic_commands(code) == target.strip()


def test_dedent_no_op():
    """Test that text is not dedented when not needed."""
    text = (
        "Line1\n"
        "  Line2\n"
    )

    assert text == utils.dedent(text)


def test_dedent():
    """Text that text is properly dedented."""
    text = (
        "  Line1\n"
        "    Line2\n"
    )

    target = (
        "Line1\n"
        "  Line2\n"
    )

    assert utils.dedent(text) == target
