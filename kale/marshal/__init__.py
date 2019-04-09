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