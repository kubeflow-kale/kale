#  Copyright 2019-2020 The Kale Authors
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

import dill
import logging

from .dispatchers import PatternDispatcher


__all__ = 'resource_load'


log = logging.getLogger(__name__)
resource_load = PatternDispatcher('resource_load')


@resource_load.register('.*', priority=1)
def resource_all(uri, *args, **kwargs):
    """Load any object with dill."""
    log.info("Loading general object: %s", uri)
    return dill.load(open(uri, "rb"))


@resource_load.register('.+::.+', priority=15)
def resource_split(uri, *args, **kwargs):
    """Load resource when name has ::."""
    uri, other = uri.rsplit('::', 1)
    return resource_load(uri, other, *args, **kwargs)
