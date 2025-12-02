# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

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
