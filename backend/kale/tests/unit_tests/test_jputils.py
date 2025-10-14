# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

import pytest

from testfixtures import mock

from kale.common import jputils as ju


def _output_display(data):
    # `data` must be a list
    return [{'output_type': 'display_data', 'data': data}]


@pytest.mark.parametrize("outputs,target", [
    ([], ""),
    # ---
    (_output_display({'image/png': "bytes"}),
     ju.IMAGE_HTML_TEMPLATE.format("", "bytes")),
    # ---
    (_output_display({'text/html': "bytes"}), "bytes"),
    # ---
    (_output_display({'text/plain': "bytes"}),
     ju.TEXT_HTML_TEMPLATE.format("bytes")),
    # ---
    (_output_display({'application/javascript': "bytes"}),
     ju.JAVASCRIPT_HTML_TEMPLATE.format("bytes")),
])
def test_generate_html_output(outputs, target):
    """Tests html artifact generation from cell outputs."""
    assert target == ju.generate_html_output(outputs)


@mock.patch('kale.common.jputils.process_outputs', new=lambda x: x)
def test_run_code():
    """Test that Python code runs inside a jupyter kernel successfully."""
    # test standard code
    code = ("a = 3\nprint(a)", )
    ju.run_code(code)

    # test magic command
    code = ("%%time\nprint('Some dull code')", )
    ju.run_code(code)
