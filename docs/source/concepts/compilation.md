# Pipeline Compilation

This page describes what actually happens when you run `kale --nb
my_notebook.ipynb`, step by step, so you can read the generated code,
debug problems, and extend Kale.

## Stage-by-stage

### 1. NotebookProcessor

{py:class}`kale.processors.NotebookProcessor` is the entry point. Given a
notebook path and (optionally) a dictionary of metadata overrides, it:

1. Reads the `.ipynb` via `nbformat`.
2. Extracts the Kale-specific notebook metadata (pipeline name, image,
   experiment, volumes, ...).
3. Walks every cell and classifies it by its Kale tag.
4. Builds a {py:class}`kale.pipeline.Pipeline` — internally a
   `networkx.DiGraph` — where each node is a {py:class}`kale.step.Step`
   carrying its source code, dependencies, inputs and outputs.

The processor returns the `Pipeline` object along with the combined string
of `imports` + `functions` code, ready to be pasted into every generated
component.

### 2. Dependency analysis

{py:func}`kale.common.astutils.get_marshal_candidates` runs over every step
to resolve data dependencies: names that are assigned in one step and read in
another must be saved and loaded at runtime. The output is a set of "marshal
candidates" per step that the compiler later turns into `marshal.save` /
`marshal.load` calls.

### 3. Compiler

Once the `Pipeline` object is ready, {py:class}`kale.compiler.Compiler` turns
it into a single Python file in three passes:

#### generate_lightweight_component

For each `Step`, the compiler renders
`kale/templates/nb_function_template.jinja2` to produce a
`@kfp_dsl.component` function. The template:

- Starts with the shared `imports_and_functions` block so the step can use
  the same modules and helpers as the notebook.
- Emits `marshal.load("<var>")` calls for each input the step consumes.
- Pastes the original cell source code verbatim — Kale does not rewrite
  your code, it just decorates it.
- Emits `marshal.save("<var>", <var>)` calls for each output the step
  produces.
- Adds a `packages_to_install=[...]` list built from the `imports` cell via
  {py:func}`kale.compiler.Compiler._get_package_list_from_imports`, which
  walks the imports AST and resolves module names to pip package names.

#### generate_pipeline

Next, the compiler renders
`kale/templates/pipeline_template.jinja2` to generate the top-level
`@kfp_dsl.pipeline` function. This template:

- Declares the pipeline parameters from the `pipeline-parameters` cell.
- Instantiates each component in dependency order.
- Threads parameters into the tasks that need them.
- Wires task dependencies using KFP's `.after(...)` and input/output
  references so KFP builds the same DAG Kale has in memory.

#### generate_dsl

The compiler concatenates:

- A header with imports for the KFP SDK and Kale marshal helpers.
- All component functions from the previous pass.
- The pipeline function from the previous pass.
- A `__main__` block that invokes `kfp.compiler.Compiler().compile()` so the
  generated file can be executed directly.

The final text is formatted with `autopep8` and written to
`.kale/<pipeline_name>.kale.py`. **This file is plain KFP v2 DSL** — no
Kale-specific runtime, just standard Kubeflow Pipelines code.

### 4. Submission (optional)

If you pass `--run_pipeline` (or the equivalent extension setting),
{py:func}`kale.common.kfputils.compile_pipeline` invokes the KFP SDK
compiler to turn the DSL into YAML IR, then uploads the pipeline and
starts a run via the KFP REST API.

## The `.kale/` directory

After a compile, you'll find the generated files in a `.kale/` directory
created in the current working directory (not necessarily the same directory
as the notebook):

```
.kale/
├── my_notebook.kale.py    # generated KFP v2 DSL
└── my_notebook.yaml       # KFP YAML IR (if submission was triggered)
```

Inspecting this file is the fastest way to debug a misbehaving pipeline.
You can:

- Read the `packages_to_install` list for each component to catch missing
  imports.
- Read the `marshal.load(...)` / `marshal.save(...)` calls to confirm Kale
  detected the right data dependencies.
- Run the file directly (`python .kale/my_notebook.kale.py`) to reproduce
  KFP compilation errors locally.

## Package detection from imports

Kale pulls its `packages_to_install` lists out of your `imports` cell by
walking the AST. For a line like `import pandas as pd`, it records `pandas`
as a dependency of every step. For `from sklearn.ensemble import
RandomForestClassifier`, it records `scikit-learn` (Kale knows about some
module-name → pip-name mappings).

This is why **all imports must live in `imports` cells**: any module used
from a `step` cell but imported elsewhere will be missed, and the
`@kfp_dsl.component` will not declare it in `packages_to_install`, causing
a `ModuleNotFoundError` at runtime.

## Templates to read

If you want to go deeper, these two files are the source of truth for the
generated code:

- `kale/templates/nb_function_template.jinja2` — per-step component
- `kale/templates/pipeline_template.jinja2` — pipeline wrapper

They're ~170 lines of Jinja combined, and they are the clearest way to
learn exactly what Kale emits.
