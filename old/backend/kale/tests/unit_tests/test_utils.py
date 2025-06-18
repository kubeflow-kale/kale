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
