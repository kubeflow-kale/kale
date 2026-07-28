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

from kale import NotebookConfig


@pytest.mark.parametrize(
    "args",
    [
        (None, []),
        ("/users", [{"name": "test", "type": "pvc", "mount_point": "/root"}]),
        ("/user/kale/test", [{"name": "test", "type": "pvc", "mount_point": "/user/kale"}]),
        ("/user/kale/", [{"name": "test", "type": "pvc", "mount_point": "/user/kale/test"}]),
    ],
)
def test_get_marshal_data(dummy_nb_config, args):
    """Test that marshal_path is always the default /tmp/marshal regardless of volumes."""
    config = NotebookConfig(
        **{
            **dummy_nb_config,
            "abs_working_dir": args[0],
            "volumes": args[1],
            "notebook_path": "/user/kale/test/mynb.ipynb",
        }
    )
    assert config.marshal_path == "/tmp/marshal"


@pytest.mark.parametrize(
    "configs",
    [
        (
            {
                "katib_metadata": {
                    "parameters": ["a"],
                    "algorithm": {"dummy": "test"},
                    "objective": {"dummy": "test"},
                }
            }
        )
    ],
)
def test_nested_configs(dummy_nb_config, configs):
    """Test that nested Configs are parsed properly."""
    config = NotebookConfig(**{**dummy_nb_config, **configs})
    # add defaults
    res = {
        **configs["katib_metadata"],
        "maxFailedTrialCount": 3,
        "maxTrialCount": 12,
        "parallelTrialCount": 3,
    }
    assert config.katib_metadata.to_dict() == res
