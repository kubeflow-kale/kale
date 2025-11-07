# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

from .config import Config, Field

from kale.common import logutils
logutils.get_or_create_logger(module=__name__, name="config")
del logutils
