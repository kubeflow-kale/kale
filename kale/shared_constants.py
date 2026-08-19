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

"""Constants shared between the backend and the JupyterLab frontend.

The values live in ``shared_constants.json``, next to this module. The frontend
imports that same file (see ``labextension/src/lib/sharedConstants.ts``), so the
two sides cannot drift apart. Add or change a value in the JSON file, never by
introducing a second copy here or in the frontend.
"""

import json
import pathlib

SHARED_CONSTANTS_PATH = pathlib.Path(__file__).parent / "shared_constants.json"

with open(SHARED_CONSTANTS_PATH) as f:
    SHARED_CONSTANTS = json.load(f)

# RPC error codes and the plain-language explanation the frontend shows for each
# of them, so users read what went wrong instead of only a numeric code.
RPC_ERROR_CODES: dict[str, int] = SHARED_CONSTANTS["rpc"]["error_codes"]
RPC_ERROR_EXPLANATIONS: dict[str, str] = SHARED_CONSTANTS["rpc"]["error_explanations"]

# Cell tags: the reserved names a cell can be tagged with, the prefixes of the
# parameterized tags, and the pattern a step name must match.
RESERVED_CELL_NAMES: list[str] = SHARED_CONSTANTS["cells"]["reserved_names"]
CELL_TAG_PREFIXES: dict[str, str] = SHARED_CONSTANTS["cells"]["tag_prefixes"]
STEP_NAME_PATTERN: str = SHARED_CONSTANTS["cells"]["step_name_pattern"]
TAG_ENABLED_VALUE: str = SHARED_CONSTANTS["cells"]["tag_enabled_value"]
TAG_DISABLED_VALUE: str = SHARED_CONSTANTS["cells"]["tag_disabled_value"]

# Key under which Kale stores its configuration in the notebook's metadata.
NB_METADATA_KEY: str = SHARED_CONSTANTS["notebook"]["metadata_key"]

DEFAULT_BASE_IMAGE: str = SHARED_CONSTANTS["pipeline"]["default_base_image"]
