# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from kale.rpc import errors


def test_code_values_match_shared_json():
    """`Code` must stay in sync with error_codes.json.

    The frontend imports that same file directly (see
    labextension/src/lib/RPCUtils.tsx) to build its own RPC_CALL_STATUS
    enum, so a mismatch here means the two sides have drifted.
    """
    assert {code.name: code.value for code in errors.Code} == errors._ERROR_CODES
