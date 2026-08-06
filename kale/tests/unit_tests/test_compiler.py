# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import pytest

from kale.compiler import Compiler


def _get_env_var_name_filter():
    """Return the to_kale_env_var_name Jinja2 filter from the Compiler env."""
    compiler = Compiler.__new__(Compiler)
    compiler.templating_env = None
    env = compiler._get_templating_env()
    return env.filters["to_kale_env_var_name"]


@pytest.mark.parametrize(
    "pvc_name,expected",
    [
        ("raw-data", "KALE_VOLUME_RAW_DATA"),
        ("my.pvc", "KALE_VOLUME_MY_PVC"),
        ("data123", "KALE_VOLUME_DATA123"),
        ("UPPER", "KALE_VOLUME_UPPER"),
        ("a-b_c.d/e", "KALE_VOLUME_A_B_C_D_E"),
        ("single", "KALE_VOLUME_SINGLE"),
    ],
)
def test_to_kale_env_var_name(pvc_name, expected):
    """to_kale_env_var_name converts PVC names to KALE_VOLUME_<NAME> env var names."""
    fn = _get_env_var_name_filter()
    assert fn(pvc_name) == expected
