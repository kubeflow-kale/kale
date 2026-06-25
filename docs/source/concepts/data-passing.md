# Data Passing & Marshalling

One of Kale's main jobs is making multi-step pipelines work as a single
notebook. You write code across many cells, Kale figures out which variables
need to move between the resulting pipeline steps, and emits the right
serialization calls for each object type.

This page explains how that works.

## Detecting data dependencies

When you write this in a notebook:

```python
# tag: step:load
df = pd.read_csv("data.csv")

# tags: step:train, prev:load
model = train(df)

# tags: step:evaluate, prev:train
score = model.score(df)
```

Kale needs to know that:

- `df` must be saved at the end of `load` and loaded at the start of `train`
  and `evaluate`.
- `model` must be saved at the end of `train` and loaded at the start of
  `evaluate`.

It discovers this by static AST analysis via
{py:func}`kale.common.astutils.get_marshal_candidates`. For each cell, Kale
walks the AST looking for:

- Names assigned at the top level of the cell (these are candidates for
  **outputs**).
- Names read but not assigned (these are candidates for **inputs**).
- Names that come from `imports` / `functions` cells (those are shared
  across all steps, so they're not treated as data).

The result is a set of variables each step consumes and produces. Kale then
intersects these sets across the dependency graph: if step `B` depends on
`A` and reads `df`, and `A` assigns `df`, then `df` becomes an artifact
flowing from `A` to `B`.

## The marshalling system

Once Kale knows _what_ to pass, it still needs to decide _how_ to serialize
it. Pickling everything with `dill` works for many Python objects, but
breaks down for:

- Objects that hold native resources (TensorFlow session graphs, open files,
  database cursors).
- Large objects that have a more efficient native format (numpy arrays,
  parquet-able DataFrames).
- ML framework models, which have their own `save` / `load` contracts.

Kale solves this with a small, extensible dispatcher system in
{py:mod}`kale.marshal`.

### `MarshalBackend` and the `Dispatcher`

Every supported type has a dedicated backend class that implements:

- `save(obj, path)` — how to write this object to disk.
- `load(path)` — how to read it back.
- `object_type_pattern` — a regex matched against
  `type(obj).__module__ + "." + type(obj).__qualname__` so the dispatcher
  knows when to use this backend.

At marshal time, the {py:class}`kale.marshal.backend.Dispatcher` inspects
the object's type, picks the first backend whose pattern matches, and falls
back to a generic `dill` backend if none does.

### Built-in backends

| Backend                  | Library       | File extension | Matches                                       |
| ------------------------ | ------------- | -------------- | --------------------------------------------- |
| `FunctionBackend`        | (builtin)     | `.pyfn`        | Python `function` objects                     |
| `SKLearnBackend`         | scikit-learn  | `.joblib`      | `sklearn.*` classes                           |
| `NumpyBackend`           | numpy         | `.npy`         | `numpy.*`                                     |
| `PandasBackend`          | pandas        | `.pdpkl`       | `pandas.*(DataFrame|Series)`                  |
| `XGBoostModelBackend`    | xgboost       | `.json`        | `xgboost.core.Booster`                        |
| `XGBoostDMatrixBackend`  | xgboost       | `.dmatrix`     | `xgboost.core.DMatrix`                        |
| `PyTorchBackend`         | pytorch       | `.pt`          | `torch.nn.modules.module.Module` (and subclasses) |
| `KerasBackend`           | keras         | `.keras`       | `keras.*`                                     |
| `TensorflowKerasBackend` | tensorflow    | `.tfkeras`     | `tensorflow.python.keras.*`                   |
| `DillBackend` (fallback) | dill          | `.dillpkl`     | Any object no other backend matches           |

### Extending the dispatcher

You can add a new backend by subclassing
{py:class}`kale.marshal.backend.MarshalBackend` and registering it with the
`@register_backend` decorator. Your backend declares an
`object_type_pattern` and implements `save` / `load`. Kale will pick it up
automatically at compile time and inject the right calls into the generated
DSL.

This is the recommended way to support new libraries: open an issue or a PR
with a new backend rather than forcing your objects through `dill`.

## Common pitfalls

The marshalling model is powerful, but it is still **static** — Kale can
only see what the AST shows. These are the patterns that trip people up.

### Aliasing

```python
# step:A
model1 = model2 = SomeModel()

# step:B (prev: A)
model2.add_layer(SomeLayer())

# step:C (prev: B)
print(model1)
```

Kale saves `model1` and `model2` separately at the end of `A`, so mutating
`model2` in `B` has no effect on what `C` sees. **Solution**: don't alias
across steps — give each variable a single name and pass it explicitly.

### Mutating global state

```python
# imports
import warnings

# step:A
warnings.simplefilter("ignore")
warnings.warn("A", DeprecationWarning)

# step:B (prev: A)
warnings.warn("B", DeprecationWarning)
```

Step `B` runs in a fresh container, so `warnings.simplefilter("ignore")`
never happens there. **Solution**: configure global state in the `imports`
or `functions` cell, once, so every step gets the same configuration.

### Non-serializable objects

```python
# step:A
f = open("log.txt", "a")

# step:B (prev: A)
f.write("hello")
```

Kale tries to pickle `f` at the end of `A` and fails — open file handles
can't be serialized. **Solution**: rebuild the resource at the start of each
step that needs it, typically via a helper in a `functions` cell:

```python
# functions
def get_log_file():
    return open("log.txt", "a")

# step:A
with get_log_file() as f:
    f.write("A")

# step:B (prev: A)
with get_log_file() as f:
    f.write("B")
```

### Star imports

```python
# imports
from mymodule import *

# step:A
result = myfoo()
```

Kale can't see inside `mymodule`, so it doesn't know that `myfoo` comes from
there. It may try to marshal `myfoo` as an input to `A` and crash.
**Solution**: use explicit imports (`from mymodule import myfoo`). Star
imports should be avoided in Kale notebooks.

See [Troubleshooting](../user-guide/troubleshooting.md) for the wider list of runtime
issues and how to diagnose them.
