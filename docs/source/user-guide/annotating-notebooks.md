# Annotating Notebooks

Kale turns cell tags into pipeline structure. You can set those tags two
ways:

1. **From the Kale JupyterLab extension** — point-and-click, recommended for
   interactive development.
2. **By editing notebook metadata directly** — useful for scripting, code
   review, and when you don't have JupyterLab running.

Both produce the same tags, so the resulting `.ipynb` looks identical either
way.

## Using the JupyterLab extension

After you run `make jupyter` (or start JupyterLab any other way with the
Kale extension installed), open a notebook and click the Kale icon in the
left sidebar. The Kale panel appears with a master toggle at the top.

When you enable Kale, two things happen:

1. Every notebook cell grows a Kale metadata row at the top showing its cell
   type (Imports, Functions, Step, ...), step name, and dependencies.
2. The side panel unlocks pipeline-level settings: pipeline name, experiment
   name, and description.

### Setting a cell's type

Click the cell type dropdown on the cell's Kale row. You'll see:

- **Imports** — tag the cell as `imports`.
- **Functions** — tag the cell as `functions`.
- **Pipeline Parameters** — tag the cell as `pipeline-parameters`.
- **Pipeline Metrics** — tag the cell as `pipeline-metrics`.
- **Step** — tag the cell as a pipeline step. When you pick this, you'll be
  prompted for the step name and given a dropdown of possible dependencies
  (other steps in the notebook).
- **Skip Cell** — tag the cell as `skip`.

### Setting step dependencies

For cells tagged as `Step`, the panel lets you pick zero or more previous
steps. Each choice becomes a `prev:<name>` tag. Kale validates the choices
so you can't create cycles.

### Pipeline-level settings

The side panel's pipeline settings form is mapped to fields on
{py:class}`kale.pipeline.PipelineConfig`. Changes are saved into the
notebook's top-level metadata under the `kubeflow_notebook` key, so they
travel with the notebook and show up on the next open.

### Submitting

The **Compile and Run** button invokes the Kale backend from the JupyterLab
extension, which compiles the pipeline with exactly the same code path as
`kale --nb ...` on the CLI, then uploads and runs it against the configured
KFP host.

## Editing metadata by hand

Each cell in a notebook is JSON. Kale tags live in `metadata.tags` as a list
of strings. A minimal step cell looks like this:

```json
{
  "cell_type": "code",
  "metadata": {
    "tags": ["step:load_data"]
  },
  "source": [
    "df = pd.read_csv('data.csv')\n"
  ]
}
```

A step with a dependency and a GPU request:

```json
{
  "cell_type": "code",
  "metadata": {
    "tags": [
      "step:train",
      "prev:load_data",
      "limit:nvidia.com/gpu:1",
      "image:pytorch/pytorch:2.0-cuda12"
    ]
  },
  "source": ["..."]
}
```

Pipeline-level Kale settings live on the notebook (not on a cell) under the
`metadata.kubeflow_notebook` key — these are the same fields the side panel
exposes.

## Organising a notebook for Kale

A notebook that compiles well with Kale usually follows this order:

1. **One `imports` cell** at the top with every `import` statement.
2. **One or more `functions` cells** below with pure function and class
   definitions.
3. **One `pipeline-parameters` cell** declaring tunable inputs.
4. **A sequence of `step` cells**, each doing one logical thing, with
   `prev:` tags describing the DAG.
5. **Optional `pipeline-metrics` cells** at the end of training steps to
   surface accuracy / loss / etc. in the KFP UI.
6. **`skip` cells** wherever you want exploratory code to live without
   affecting the pipeline.

See the [examples](https://github.com/kubeflow/kale/tree/main/examples) gallery for notebooks that follow this pattern.
