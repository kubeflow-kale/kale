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

import pytest

from kale import Pipeline
from kale.static_analysis.ast import PipelineParam
from kale.config import NotebookConfig


@pytest.mark.parametrize("volumes,target", [
    ([], ({})),
    # ---
    ([{
        "name": "test-volume",
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }], ({})),
    # ---
    ([{
        'name': 'test-volume',
        'type': 'pvc',
        'mount_point': '/'
    }], {'vol_': PipelineParam('str', 'test-volume')}),
    # ---
    ([{
        'name': 'test-volume',
        'type': 'pvc',
        'mount_point': '/root'
    }], {'vol_root': PipelineParam('str', 'test-volume')}),
    # ---
    ([{
        'name': 'test-volume',
        'type': 'pvc',
        'mount_point': '/root/user/'
    }], {'vol_root_user': PipelineParam('str', 'test-volume')}),
    # ---
    ([{
        'name': 'test-volume',
        'type': 'new_pvc',
        'mount_point': '/',
    }], {}),
    # ---
    ([{
        'name': 'test-volume',
        'type': 'new_pvc',
        'mount_point': '/root',
        'annotations': [{"key": "rok/origin", "value": "url"}]
    }], {'rok_test_volume_url': PipelineParam('str', 'url')}),
])
def test_set_volume_pipeline_parameters(dummy_nb_config, volumes, target):
    """Tests that volumes are correctly converted from list into dict."""
    pipeline = Pipeline(NotebookConfig(**dummy_nb_config, volumes=volumes))
    pipeline.set_volume_pipeline_parameters()
    assert target == pipeline.pipeline_parameters


@pytest.mark.parametrize("volumes", [
    ([{
        "name": "test-volume",
        "mount_point": "/",
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'unknown'
    }])
])
def test_get_volumes_parameters_exc(dummy_nb_config, volumes):
    """Tests that volumes are correctly converted from list into dict."""
    with pytest.raises(ValueError,
                       match="VolumeTypeValidator:"
                             " Value unknown is not allowed"):
        pipeline = Pipeline(NotebookConfig(**dummy_nb_config, volumes=volumes))
        pipeline.set_volume_pipeline_parameters()


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
