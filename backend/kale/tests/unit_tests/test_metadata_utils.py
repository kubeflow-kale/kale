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

import copy
import pytest

from unittest import mock
from kale.common import metadatautils


@pytest.mark.parametrize("volumes,target", [
    ([], []),
    # ---
    ([{
        'name': 'v',
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }], [{
        'name': 'v',
        'annotations': {'a1': 'v1'},
        'size': '5',
        'type': 'pv',
        'mount_point': '/'
    }]),
    # ---
    ([{
        'name': 'v',
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pvc',
        'mount_point': '/'
    }], [{
        'name': 'v',
        'annotations': {'a1': 'v1'},
        'size': '5',
        'type': 'pvc',
        'mount_point': '/'
    }])
])
def test_validate_volumes_metadata(volumes, target):
    """Tests volumes validation method."""
    assert target == metadatautils._parse_volumes_metadata(volumes)


@pytest.mark.parametrize("volumes,match", [
    ([{
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }], "Volume spec: missing name value"),
    ([{
        'name': 'v',
        'annotations': [{'wronkey': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }], "Volume spec: volume annotations must be a "
        "list of {'key': k, 'value': v} dicts"),
    ([{
        'name': 'v',
        'annotations': {'key': 'a1', 'value': 'v1'},
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }], "Volume spec: annotations must be a list"),
])
def test_convert_volume_annotations_exc(volumes, match):
    """Tests that volume spec errors are caught."""
    with pytest.raises(ValueError, match=match):
        metadatautils._parse_volumes_metadata(volumes)


@pytest.mark.parametrize("metadata,target", [
    ({'pipeline_name': 'test',
      'experiment_name': 'test',
      'volumes': []},
     copy.deepcopy(metadatautils.DEFAULT_METADATA)),
])
@mock.patch('kale.common.metadatautils.random_string')
def test_validate_metadata(random_string, metadata, target):
    """Tests metadata is parsed correctly."""
    random_string.return_value = 'rnd'
    # these are required fields that will always have to be present in the
    # metadata dict
    target.update({'pipeline_name': metadata['pipeline_name'] + '-rnd'})
    target.update({'experiment_name': metadata['experiment_name']})
    assert target == metadatautils.parse_metadata(metadata)


def test_validate_metadata_missing_required():
    """Tests that required metadata keys are checked for."""
    with pytest.raises(ValueError, match=r"Key experiment_name not found.*"):
        metadatautils.parse_metadata({})

    with pytest.raises(ValueError, match=r"Key pipeline_name not found.*"):
        metadatautils.parse_metadata({'experiment_name': 'test'})
