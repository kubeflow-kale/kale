# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

import pytest

from kale import NotebookConfig


@pytest.mark.parametrize("args,target", [
    ((None, []), (True, '/marshal')),
    # ---
    (('/users', [{"name": "test", "type": "pvc", 'mount_point': '/root'}]),
     (True, '/marshal')),
    # ---
    (('/user/kale/test',
      [{"name": "test", "type": "pvc", 'mount_point': '/user/kale'}]),
     (False, '/user/kale/test/.mynb.ipynb.kale.marshal.dir')),
    # ---
    (('/user/kale/',
      [{"name": "test", "type": "pvc", 'mount_point': '/user/kale/test'}]),
     (True, '/marshal')),
])
def test_get_marshal_data(dummy_nb_config, args, target):
    """Test that marshal volume path is correctly computed."""
    config = NotebookConfig(**{**dummy_nb_config,
                               "abs_working_dir": args[0],
                               "volumes": args[1],
                               "notebook_path": "/user/kale/test/mynb.ipynb"})
    assert target[0] == config.marshal_volume
    assert target[1] == config.marshal_path


@pytest.mark.parametrize("configs", [
    ({"katib_metadata": {"parameters": ["a"],
                         "algorithm": {"dummy": "test"},
                         "objective": {"dummy": "test"}}})
])
def test_nested_configs(dummy_nb_config, configs):
    """Test that nested Configs are parsed properly."""
    config = NotebookConfig(**{**dummy_nb_config, **configs})
    # add defaults
    res = {**configs["katib_metadata"],
           "maxFailedTrialCount": 3,
           "maxTrialCount": 12,
           "parallelTrialCount": 3}
    assert config.katib_metadata.to_dict() == res
