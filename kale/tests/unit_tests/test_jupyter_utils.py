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
import pytest

from testfixtures import mock
from kale.utils import jupyter_utils as ju


def _output_display(data):
    # `data` must be a list
    return [{'output_type': 'display_data', 'data': data}]


@pytest.mark.parametrize("outputs,target", [
    ([], ""),
    # ---
    (_output_display({'image/png': "bytes"}),
     ju.image_html_template.format("", "bytes")),
    # ---
    (_output_display({'text/html': "bytes"}), "bytes"),
    # ---
    (_output_display({'text/plain': "bytes"}),
     ju.text_html_template.format("bytes")),
    # ---
    (_output_display({'application/javascript': "bytes"}),
     ju.javascript_html_template.format("bytes")),
])
def test_generate_html_output(outputs, target):
    """Tests html artifact generation from cell outputs."""
    assert target == ju.generate_html_output(outputs)


@mock.patch('kale.utils.jupyter_utils.pod_utils')
def test_update_uimetadata_not_exists(pod_utils, tmpdir):
    """Test the uimetadata file is created when it does not exists."""
    pod_utils.get_pod_name.return_value = 'test_pod'
    pod_utils.get_namespace.return_value = 'test_ns'
    pod_utils.get_workflow_name.return_value = 'test_wk'

    filepath = os.path.join(tmpdir, 'tmp_uimetadata.json')

    # update tmp file
    ju.update_uimetadata('test', uimetadata_path=filepath)

    # check file has been updated correctly
    updated = json.loads(open(filepath).read())
    target = {"outputs": [{
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/test_wk/test_pod/test.tgz'
    }]}
    assert updated == target


@mock.patch('kale.utils.jupyter_utils.pod_utils')
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
    ju.update_uimetadata('test', uimetadata_path=filepath)

    # check file has been updated correctly
    updated = json.loads(open(filepath).read())
    target = {"outputs": [{
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/test_wk/test_pod/test.tgz'
    }]}
    assert updated == target


@mock.patch('kale.utils.jupyter_utils.pod_utils')
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
    ju.update_uimetadata('test', uimetadata_path=filepath)

    # check file has been updated correctly
    updated = json.loads(open(filepath).read())
    target = {"outputs": [markdown, {
        'type': 'web-app',
        'storage': 'minio',
        'source': 'minio://mlpipeline/artifacts/test_wk/test_pod/test.tgz'
    }]}
    assert updated == target


@mock.patch('kale.utils.jupyter_utils.process_outputs', new=lambda x: x)
def test_run_code():
    """Test that Python code runs inside a jupyter kernel successfully."""
    # test standard code
    code = ("a = 3\nprint(a)", )
    ju.run_code(code)

    # test magic command
    code = ("%%time\nprint('Some dull code')", )
    ju.run_code(code)
