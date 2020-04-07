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
from kale.utils import kfp_utils


@mock.patch('kale.utils.kfp_utils.pod_utils')
def test_update_uimetadata_not_exists(pod_utils, tmpdir):
    """Test the uimetadata file is created when it does not exists."""
    pod_utils.get_pod_name.return_value = 'test_pod'
    pod_utils.get_namespace.return_value = 'test_ns'
    pod_utils.get_workflow_name.return_value = 'test_wk'

    filepath = os.path.join(tmpdir, 'tmp_uimetadata.json')

    # update tmp file
    kfp_utils.update_uimetadata('test', uimetadata_path=filepath)

    # check file has been updated correctly
    updated = json.loads(open(filepath).read())
    target = {"outputs": [{
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/test_wk/test_pod/test.tgz'
    }]}
    assert updated == target


@mock.patch('kale.utils.kfp_utils.pod_utils')
def test_update_uimetadata_from_empty(pod_utils, tmpdir):
    """Test that the uimetadata file is updated inplace correctly."""
    pod_utils.get_pod_name.return_value = 'test_pod'
    pod_utils.get_namespace.return_value = 'test_ns'
    pod_utils.get_workflow_name.return_value = 'test_wk'

    # create base tmp file
    base = {"outputs": []}
    filepath = os.path.join(tmpdir, 'tmp_uimetadata.json')
    json.dump(base, open(filepath, 'w'))

    # update tmp file
    kfp_utils.update_uimetadata('test', uimetadata_path=filepath)

    # check file has been updated correctly
    updated = json.loads(open(filepath).read())
    target = {"outputs": [{
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/test_wk/test_pod/test.tgz'
    }]}
    assert updated == target


@mock.patch('kale.utils.kfp_utils.pod_utils')
def test_update_uimetadata_from_not_empty(pod_utils, tmpdir):
    """Test that the uimetadata file is updated inplace correctly."""
    pod_utils.get_pod_name.return_value = 'test_pod'
    pod_utils.get_namespace.return_value = 'test_ns'
    pod_utils.get_workflow_name.return_value = 'test_wk'

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
    kfp_utils.update_uimetadata('test', uimetadata_path=filepath)

    # check file has been updated correctly
    updated = json.loads(open(filepath).read())
    target = {"outputs": [markdown, {
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/test_wk/test_pod/test.tgz'
    }]}
    assert updated == target
