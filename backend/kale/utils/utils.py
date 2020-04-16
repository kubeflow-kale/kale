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
