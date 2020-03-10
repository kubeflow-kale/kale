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

from .dispatchers import TypeDispatcher


__all__ = 'resource_save'


resource_save = TypeDispatcher('resource_save')


@resource_save.register('.*', priority=1)
def resource_all(o, path, *args, **kwargs):
    # save any type of object in a general way
    print("Saving general object: {}".format(path.split('/')[-1]))
    with open(path + ".dillpkl", "wb") as f:
        dill.dump(o, f)
