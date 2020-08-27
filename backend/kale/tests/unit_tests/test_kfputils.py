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
import json

from testfixtures import mock
from kale.common import kfputils


@mock.patch('kale.common.kfputils.podutils')
def test_update_uimetadata_not_exists(podutils, tmpdir):
    """Test the uimetadata file is created when it does not exists."""
    podutils.get_pod_name.return_value = 'test_pod'
    podutils.get_namespace.return_value = 'test_ns'
    podutils.get_workflow_name.return_value = 'test_wk'

    filepath = os.path.join(tmpdir, 'tmp_uimetadata.json')

    # update tmp file
    kfputils.update_uimetadata('test', uimetadata_path=filepath)

    # check file has been updated correctly
    updated = json.loads(open(filepath).read())
    target = {"outputs": [{
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/test_wk/test_pod/test.tgz'
    }]}
    assert updated == target


@mock.patch('kale.common.kfputils.podutils')
def test_update_uimetadata_from_empty(podutils, tmpdir):
    """Test that the uimetadata file is updated inplace correctly."""
    podutils.get_pod_name.return_value = 'test_pod'
    podutils.get_namespace.return_value = 'test_ns'
    podutils.get_workflow_name.return_value = 'test_wk'

    # create base tmp file
    base = {"outputs": []}
    filepath = os.path.join(tmpdir, 'tmp_uimetadata.json')
    json.dump(base, open(filepath, 'w'))

    # update tmp file
    kfputils.update_uimetadata('test', uimetadata_path=filepath)

    # check file has been updated correctly
    updated = json.loads(open(filepath).read())
    target = {"outputs": [{
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/test_wk/test_pod/test.tgz'
    }]}
    assert updated == target


@mock.patch('kale.common.kfputils.podutils')
def test_update_uimetadata_from_not_empty(podutils, tmpdir):
    """Test that the uimetadata file is updated inplace correctly."""
    podutils.get_pod_name.return_value = 'test_pod'
    podutils.get_namespace.return_value = 'test_ns'
    podutils.get_workflow_name.return_value = 'test_wk'

    # create base tmp file
    markdown = {
        'type': 'markdown',
        'storage': 'inline',
        'source': '#Some markdown'
    }
    base = {"outputs": [markdown]}
    filepath = os.path.join(tmpdir, 'tmp_uimetadata.json')
    json.dump(base, open(filepath, 'w'))

    # update tmp file
    kfputils.update_uimetadata('test', uimetadata_path=filepath)

    # check file has been updated correctly
    updated = json.loads(open(filepath).read())
    target = {"outputs": [markdown, {
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/test_wk/test_pod/test.tgz'
    }]}
    assert updated == target
