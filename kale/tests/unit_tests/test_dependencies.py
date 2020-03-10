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

from kale.static_analysis.dependencies import pyflakes_report


@pytest.mark.parametrize("code,target", [
    ('', []),
    ('a = b', ['b']),
    ('a = foo(b)', ['foo', 'b']),
    ('a = b\nfoo(b)', ['b', 'foo']),
    ('foo(b)', ['foo', 'b'])
])
def test_pyflakes_report(code, target):
    """Tests pyflakes_report function."""
    res = pyflakes_report(code)
    assert sorted(res) == sorted(target)
