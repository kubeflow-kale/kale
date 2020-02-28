from kale.utils import utils


def test_comment_magic_commands():
    """Test the magic utils properly comments a multiline code block."""
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
