import pytest

from kale.utils.metadata_utils import _validate_volumes_metadata


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
    """Tests that volumes are correctly converted from list into dict

    """
    assert target == _validate_volumes_metadata(volumes)


@pytest.mark.parametrize("volumes", [
    {
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }
])
def test_convert_volume_annotations_exc(volumes):
    """Tests that volumes are correctly converted from list into dict

    """
    with pytest.raises(ValueError):
        _validate_volumes_metadata(volumes)
