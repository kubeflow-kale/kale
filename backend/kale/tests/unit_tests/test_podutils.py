# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

import pytest
from testfixtures import mock

from kubernetes.client.models import V1Volume

from kale.common import podutils


_list_volumes_return_value = [("/mount/path", V1Volume(name="vol1"), "5Gi"),
                              ("/mount/path/other", V1Volume(name="vol2"),
                               "5Gi"),
                              ("/other", V1Volume(name="vol3"), "5Gi")]


@pytest.mark.parametrize("path,ret",
                         [("/mount/path/item", _list_volumes_return_value[0]),
                          ("/mount/path/other/item",
                           _list_volumes_return_value[1]),
                          ("/other/item", _list_volumes_return_value[2])])
@mock.patch("kale.common.podutils.list_volumes")
@mock.patch("kale.common.podutils.os")
def test_get_volume_containing_path(os, list_volumes, path, ret):
    """Test successful execution of get_volume_containing_path()."""
    os.path.exists.return_value = True
    list_volumes.return_value = _list_volumes_return_value
    assert podutils.get_volume_containing_path(path) == ret


@pytest.mark.parametrize("path", ["not/abs/path", "/non/existing/path"])
def test_get_volume_containing_path_value_error(path):
    """Test get_volume_containing_path() with bad input."""
    with pytest.raises(ValueError):
        podutils.get_volume_containing_path(path)


@pytest.mark.parametrize("path", ["/mount/item", "/some/path"])
@mock.patch("kale.common.podutils.list_volumes")
@mock.patch("kale.common.podutils.os")
def test_get_volume_containing_path_runtime_error(os, list_volumes, path):
    """Test get_volume_containing_path() with no backing volume."""
    os.path.isabs.return_value = True
    os.path.exists.return_value = True
    list_volumes.return_value = _list_volumes_return_value
    with pytest.raises(RuntimeError):
        podutils.get_volume_containing_path(path)
