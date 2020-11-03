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

import __main__

import os
import re
import sys
import json
import errno
import random
import string
import urllib
import shutil
import logging

from typing import Dict, Any

log = logging.getLogger(__name__)


def get_main_source_path():
    """Get the absolute path to the program entrypoint source."""
    return os.path.abspath(__main__.__file__)


def random_string(size=5, chars=string.ascii_lowercase + string.digits):
    """Generate random string."""
    return "".join(random.choice(chars) for _ in range(size))


def abs_working_dir(path):
    """Get absolute path to parent dir."""
    return os.path.dirname(os.path.abspath(path))


def rm_r(path, ignore_missing=True, silent=False):
    """Remove a file or directory.

    Similar to rm -r. If the path does not exist and ignore_missing is False,
    OSError is raised, otherwise it is ignored.
    If silent is True, nothing is raised.
    """
    def onerror(function, path, excinfo):
        # Function to handle ENOENT in shutil.rmtree()
        e = excinfo[1]
        if (ignore_missing and isinstance(e, OSError)
                and e.errno == errno.ENOENT):
            return
        raise e

    log.info("Removing path `%s'", path)

    try:
        if os.path.isfile(path) or os.path.islink(path):
            os.remove(path)
        elif os.path.isdir(path):
            shutil.rmtree(path, onerror=onerror)
        elif os.path.exists(path) and not silent:
            raise RuntimeError("Failed to remove path `%s': Path exists but is"
                               " not a file nor a directory" % path)
        else:
            # The path does not exists, raise the appropriate exception and let
            # the exception handler handle it (i.e., check ignore_missing etc.)
            raise OSError(errno.ENOENT, "No such file or directory", path)
    except OSError as e:
        if silent:
            log.debug("Path `%s' does not exist, skipping removing it", path)
            return
        if (not ignore_missing) or (e.errno != errno.ENOENT):
            log.error("Failed to remove path `%s' (errno: %s): %s",
                      path, e.errno, e)
            raise


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


def read_json_from_file(path: str) -> Dict:
    """Read a file that contains a JSON object and return it as dictionary."""
    try:
        return json.loads(open(path, 'r').read())
    except json.JSONDecodeError:
        log.exception("Failed to parse json file %s", path)
        raise


def ensure_or_create_dir(filepath: str):
    """Ensure the dir of a file exists and isdir, or create it.

    Raises:
        RuntimeError: if dirname of filepath exists and is not a directory
    """
    dirname = os.path.dirname(filepath)
    if not os.path.exists(dirname):
        os.makedirs(dirname)
    elif not os.path.isdir(dirname):
        raise RuntimeError("'%s' is not a directory" % dirname)


def clean_dir(path: str):
    """If path exists, remove and then create empty dir."""
    if os.path.exists(path):
        shutil.rmtree(path)
    os.makedirs(path)


def shorten_long_string(obj: Any, chars: int = 75):
    """Shorten the string representation of the input object."""
    str_input = str(obj)
    return str_input[:chars] + " ..... " + str_input[len(str_input) - chars:]


def dedent(text: str):
    """Remove longest common prefix consisting of whitespaces.

    Args:
        text: Multiline string
    """
    matches = re.findall(r"(?m)^\s+", text)
    if len(matches) < len(text.splitlines()):
        return text
    return re.sub(r"(?m)^.{%d}" % min(map(len, matches)), "", text)
