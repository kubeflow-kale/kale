import sys
# sys.path.insert(0, 'D:\Projects\kale\kale\backend')
# print(sys.path)
# sys.path.remove('D:\\Projects\\kale')
print(sys.path)
from kale.processors import NotebookProcessor
import kale
print(kale.__file__)
print("Kale package initialized with NotebookProcessor:", NotebookProcessor)