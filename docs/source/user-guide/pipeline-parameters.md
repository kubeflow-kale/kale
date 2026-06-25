# Pipeline Parameters

Pipeline parameters let you change a pipeline's behavior at submission time
without recompiling. In Kale, they come from a dedicated cell type:

```python
# tag: pipeline-parameters
learning_rate = 0.01
batch_size = 128
num_epochs = 10
model_name = "rf"
use_gpu = False
```

Everything you assign in this cell becomes a top-level KFP pipeline
parameter of the matching type.

## Supported types

Kale infers the parameter type from the Python literal you assign. Supported
types:

| Python literal     | KFP parameter type |
| ------------------ | ------------------ |
| `int` (e.g. `10`)  | `int`              |
| `float` (e.g. `0.01`) | `float`         |
| `str` (e.g. `"rf"`) | `str`              |
| `bool` (e.g. `True`) | `bool`            |

Anything else — lists, dicts, NumPy scalars, objects — will either fail at
compile time or fall back to string encoding. Stick to the four basic types
unless you know what you're doing.

## How parameters are used in steps

Once a parameter is declared, you can use it in any step cell as if it were
a local variable:

```python
# tags: step:train, prev:load
model = train(df, lr=learning_rate, epochs=num_epochs)
```

Kale wires `learning_rate` and `num_epochs` into the `train` component's
inputs automatically, using KFP's pipeline-parameter plumbing.

## Multiple parameter cells

You can have more than one `pipeline-parameters` cell. Kale concatenates
them in notebook order, so the **last definition of a parameter wins**.
This is sometimes convenient for overriding defaults near where they are
used, but it can also make notebooks hard to read — prefer a single
parameters cell.

## Overriding parameters at submission time

When you click **Compile and Run** (or pass `--run_pipeline` on the CLI),
Kale submits a pipeline run with default parameter values. To override
them:

- **In the KFP UI**: after the pipeline is uploaded, start a new run from
  the Pipelines tab. The KFP UI will prompt you for each parameter.
- **Via the KFP SDK**: load the compiled YAML IR and call
  `client.run_pipeline(..., params={...})`. This is the recommended way to
  kick off runs programmatically.

## Viewing parameters in the KFP UI

Every run page shows the parameter values it was started with, so you can
correlate pipeline outputs with the inputs that produced them. Use this in
combination with `pipeline-metrics` cells to build lightweight experiment
tracking without needing a separate tracking service.

## Defaults vs. placeholders

The value you assign in the `pipeline-parameters` cell is the **default**.
It's the value used when no override is provided at submission time. So:

```python
# tag: pipeline-parameters
batch_size = 128   # sensible default
```

reads naturally as "pipeline parameter `batch_size` with default 128", and
you can still override it on a per-run basis.
