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

# Import all backends so that they register themselves to the Dispatcher
from .backends import *
from .backend import get_dispatcher, set_data_dir, get_data_dir

save = get_dispatcher().save
load = get_dispatcher().load
get_path = get_dispatcher().get_path
get_backend = get_dispatcher().get_backend
get_backends = get_dispatcher().get_backends
get_backend_by_name = get_dispatcher().get_backend_by_name

from .decorator import Marshaller

# External code shouldn't care about the Dispatcher instance
del get_dispatcher

from kale.common import logutils
logutils.get_or_create_logger(module=__name__, name="marshalling")
del logutils
