import os
import re
import random
import string


def random_string(size=5, chars=string.ascii_lowercase + string.digits):
    """Generate random string."""
    return "".join(random.choice(chars) for _ in range(size))


def get_abs_working_dir(path):
    """Get absolute path to parent dir."""
    return os.path.dirname(os.path.abspath(path))


def remove_ansi_color_sequences(text):
    """Remove ANSI color sequences from text."""
    ansi_color_escape = re.compile(r'\x1B\[[0-9;]*m')
    return ansi_color_escape.sub('', text)
