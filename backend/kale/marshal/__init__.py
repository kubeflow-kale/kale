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

from .resource_save import resource_save
from .resource_load import resource_load

from .backends import *



# TODO:
#  - I have switched from parents to ancestors because some blocks might need variables that have been
#  initialized in ancient blocks. Check if this approach is consistent with many scenarios and does not
#  lead to problems.
# 	- One problem is when a block *uses* a variable from a previous block and its children does too.
# 	In this case the middle block will serialize the variable as well, and this is useless as it was not modified.
# 	Is there a way to understand if the variable was changed?
# 		-  Checking for assignment is not enough, the variable could be passed to a
# 		method and changed there by reference > Is this really true?
# 		-  Think if checking for variables assignment is enough
# 		-  Check if there are existing tools that can give me this information
# 	-  Disable data saving in a *leaf* block. In this case there is no subsequent
# 	block so any data saving is to be left out to the developer.