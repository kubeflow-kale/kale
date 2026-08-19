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

from kale import shared_constants
from kale.rpc import errors


def test_code_values_match_shared_json():
    """`Code` must stay in sync with shared_constants.json.

    The frontend imports that same file directly (see
    labextension/src/lib/sharedConstants.ts) to build its own RPC_CALL_STATUS
    enum, so a mismatch here means the two sides have drifted.
    """
    assert {code.name: code.value for code in errors.Code} == shared_constants.RPC_ERROR_CODES


def test_every_error_code_has_a_human_explanation():
    """Every failure the user can hit must be explainable in plain language.

    `OK` is not a failure, so it needs no explanation.
    """
    explained = set(shared_constants.RPC_ERROR_EXPLANATIONS)
    assert explained == {code.name for code in errors.Code} - {"OK"}
    assert all(text.strip() for text in shared_constants.RPC_ERROR_EXPLANATIONS.values())
