import copy
import pytest

from unittest import mock
from kale.utils import metadata_utils


@pytest.mark.parametrize("volumes,target", [
    ([], []),
    # ---
    ([{
        'name': 'v1',
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }],
     [{
         'name': 'v1',
         'annotations': {'a1': 'v1'},
         'size': '5',
         'type': 'pv',
         'mount_point': '/'
     }]),
    # ---
    ([{
        'name': 'v1',
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pvc',
        'mount_point': '/'
    }],
     [{
         'name': 'v1',
         'annotations': {'a1': 'v1'},
         'size': '5',
         'type': 'pvc',
         'mount_point': '/'
     }])
])
def test_validate_volumes_metadata(volumes, target):
    """Tests volumes validation method."""
    assert target == metadata_utils._validate_volumes_metadata(volumes)


@pytest.mark.parametrize("volumes,match", [
    ([{
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }], "Volume spec: missing name value"),
    ([{
        'name': 'v1',
        'annotations': [{'wronkey': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }], "Volume spec: volume annotations must be a "
        "list of {'key': k, 'value': v} dicts"),
    ([{
        'name': 'v1',
        'annotations': {'key': 'a1', 'value': 'v1'},
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }], "Volume spec: annotations must be a list"),
])
def test_convert_volume_annotations_exc(volumes, match):
    """Tests that volume spec errors are caught."""
    with pytest.raises(ValueError, match=match):
        metadata_utils._validate_volumes_metadata(volumes)


@pytest.mark.parametrize("metadata,target", [
    ({'pipeline_name': 'test',
      'experiment_name': 'test',
      'volumes': []},
     copy.deepcopy(metadata_utils.DEFAULT_METADATA)),
])
@mock.patch('kale.utils.metadata_utils.random_string')
def test_validate_metadata(random_string, metadata, target):
    """Tests metadata is parsed correctly."""
    random_string.return_value = 'rnd'
    # these are required fields that will always have to be present in the
    # metadata dict
    target.update({'pipeline_name': metadata['pipeline_name'] + '-rnd'})
    target.update({'experiment_name': metadata['experiment_name']})
    assert target == metadata_utils.validate_metadata(metadata)


def test_validate_metadata_missing_required():
    """Tests that required metadata keys are checked for."""
    with pytest.raises(ValueError, match=r"Key experiment_name not found.*"):
        metadata_utils.validate_metadata({})

    with pytest.raises(ValueError, match=r"Key pipeline_name not found.*"):
        metadata_utils.validate_metadata({'experiment_name': 'test'})
