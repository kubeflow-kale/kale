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

import json
import base64


def serialize(value):
    """Base64 encode an JSON-serializable object."""
    return base64.b64encode(json.dumps(value).encode("utf-8")).decode("utf-8")


def deserialize(value):
    """Decode a Bse64 string into a JSON object."""
    return json.loads(base64.b64decode(value).decode("utf-8"))
