## Architecture

`core.py` contains the `Kale` class, main entry-point of the application. The function `run` does the conversion from jupyter notebook to kfp pipeline by calling all the other sub-modules.

Kale was developed with a modular design. There are 4 main modules, each with a specific functionality.

#### 1. nbparser

This module both defines the Kale's Jupyter tagging language and provides the machinery to convert a tagged notebook to a NetworkX graph representing the resulting KFP pipeline. The main function is `parse_notebook()`, which takes as input a tagged notebook and returns the graph. The pipeline steps Python code is contained inside a special attributed of the graph's nodes.

#### 2. static_analysis

The purpose of this module is to detect the data dependencies between the code snippets in the execution graph. This is achieved by running PyFlakes that is able to detect all the potential missing variables errors, plus some custom routines that iterate over the AST. `dep_analysis.variables_dependencies_detection()` is the main function called by Kale to start the static analysis process.

#### 3. marshal

Marshal is a module that implements two dispater classes. `PatternDispatcher` can register functions based a regex pattern, and then call one of these functions based on a user provided string. `TypeDispatcher` can register functions based on a pattern as well, but dispatches a function based on the *type* of the input objects instead of a string.

Example:

```python
from kale.marshal import resource_save, resource_load

# register functions to load and save numpy objects
@resource_load.register('.*\.npy')  # match anything ending in '.npy'
def resource_numpy_load(uri, **kwargs):
    return np.load(uri)

@resource_save.register('numpy\..*')  # match anything starting with 'numpy'
def resource_numpy_save(obj, path, **kwargs):
    return np.save(path+".npy", obj)
    
a = np.random.random((10,10))
resource_save(a, 'marshal_dir/')
b = resource_load('marshal_dir/a.npy')  # a == b
```

Common backends to support multiple data types are registered in `marshal/backends.py`. The idea is to provide backends for the most used data types and have a common fallback to standard `dill` serialization in case the data type is not recognized.

**NB:** The code in this module is not used directly by Kale during the conversion process from notebook to pipeline, but is instead injected at the beginning and at the end of each generated pipeline step to serialize and de-serialize objects that need to be passed between pipeline steps. Have a look at `templates/function_template.txt` and at the generated python script (e.g. `kfp_numpy_example.kfp.py`).

#### 4. codegen

This module provides a single function `gen_kfp_code` that exploits the Jinja2 templating engine to generate a fully functional python script. The templates used are under the `templates/` folder.
