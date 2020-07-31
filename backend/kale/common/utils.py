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

import os
import re
import sys
import random
import string
import urllib


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


def comment_magic_commands(code):
    """Comment the magic commands in a code block."""
    magic_pattern = re.compile(r'^(\s*%%?.*)$', re.MULTILINE)
    return re.sub(magic_pattern, r'#\1', code.strip())


def encode_url_component(component: str):
    """Encode a value so it can safely be used as a URL component."""
    return urllib.parse.quote(component, safe="")


def sanitize_k8s_name(name):
    """Sanitize a string to conform to Kubernetes naming conventions."""
    name = re.sub("-+", "-", re.sub("[^-0-9a-z]+", "-", name.lower()))
    return name.lstrip("-").rstrip("-")


def is_ipython() -> bool:
    """Returns whether the code is running in a ipython kernel."""
    try:
        import IPython
        ipy = IPython.get_ipython()
        if ipy is None:
            return False
    except ImportError:
        return False
    return True


def graceful_exit(exit_code):
    """Exit the program gracefully.

    Running the function `sys.exit()` raises a special exception `SystemExit`
    that is not caught by the python REPL, making it exit the program.
    IPython's REPL, instead, does catch `SystemExit`. It displays the message
    and then goes back to the REPL.

    Code that could either run in an IPython kernel (because the Kale pipeline
    was produced from a notebook) or in a standard Python process, needs to
    handle the exit process seamlessly, regardless of where it's running.

    In case the code is running inside an IPython kernel, this function raises
    a `KaleGracefulExit` exception. This exception is expected to ke captured
    inside the `kale.common.jputils.capture_streams` function.
    """
    if is_ipython():
        from kale.common.jputils import KaleGracefulExit
        raise KaleGracefulExit
    else:
        sys.exit(exit_code)
