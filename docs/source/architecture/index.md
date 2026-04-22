# Architecture

This page is a map of the Kale codebase — what the major components are,
how they fit together, and what each directory contains. It is aimed at
contributors who want to navigate the repo with confidence.

## The components

Kale has no server, no operator, and nothing Kale-specific to deploy on
Kubernetes. Kale has three main components:

1. **The `kale` Python library** — the `kale/` package in this repo. All
   the "work" Kale does (parsing notebooks, analyzing dependencies,
   generating KFP v2 DSL, calling the KFP SDK) happens in regular Python
   function calls inside this library.
2. **The `kale` CLI** — a thin wrapper in `kale/cli.py` around the library.
   `kale --nb notebook.ipynb` is basically `import kale; kale.compile(...)`
   with argument parsing on top.
3. **The Kale JupyterLab extension** — the `labextension/` package, a
   JupyterLab 4 extension written in TypeScript and React. It runs in the
   user's browser and provides the Kale side panel and the per-cell
   metadata editors.

The interesting question is how the browser-side extension ends up invoking
functions from a Python library, since one is JavaScript and the other is
Python. The short answer: the extension starts its own Python kernel inside
the Jupyter server and calls Kale functions in it over JSON-RPC. The rest
of this section unpacks what that actually means.

## How the extension talks to the library

### Where the Jupyter server actually runs

When you use JupyterLab there are always _two_ things running, and it's
worth being explicit about which is where:

- A **web frontend** — HTML/CSS/JavaScript served to your browser. Every
  JupyterLab extension (including Kale) executes here, in the browser.
- A **Jupyter server** — a Python process that serves notebooks from disk,
  spawns and manages kernels, and exposes all of that over HTTP/WebSocket.

Where those two live depends on how you launched JupyterLab. If you run
`jupyter lab` on your laptop, both are local and your browser talks to
`localhost`. But if you're using JupyterLab from a Kubeflow Notebook, your
browser is still on your laptop while the Jupyter server is running in a
**Pod inside your Kubernetes cluster** — you only reach it through your
browser the same way you'd reach any web application. The Jupyter server
always lives next to the files and the kernels it manages, **not** next to
your browser.

This matters for Kale because everything the `kale` library does — reading
notebooks off disk, running static analysis, submitting pipelines to KFP —
has to happen where the Jupyter server is, not where your browser is.

### A Kale-managed kernel

When the Kale side panel is activated in JupyterLab, the extension asks
the Jupyter server to start a new Python kernel. This kernel is **not**
the one attached to any notebook you've opened; it's owned by the extension
itself and invisible in the JupyterLab kernels sidebar. Think of it as a
hidden Python REPL that Kale uses as its workhorse, with the `kale` library
already imported.

Because it's a normal Jupyter kernel, it runs exactly where all kernels
run: inside the Jupyter server. When Jupyter is local, the kernel is local.
When Jupyter is in a Kubeflow Notebook Pod, the kernel is in that same
Pod, alongside the user's notebook kernels.

### JSON-RPC over the kernel channel

With that kernel running, the extension needs a way to call specific
functions in it. It uses JSON-RPC: the extension sends a message naming a
function (e.g. `nb.compile_notebook`) and its arguments, the kernel runs
the corresponding Python function, and the result comes back the same way.
All of the message passing happens over standard Jupyter kernel comms — no
extra ports, no extra services, no HTTP server that Kale has to host.

Inside the kernel, the call routes through `kale/rpc/` (the dispatcher and
endpoint modules) into the rest of the Kale library: notebook parsing,
dependency analysis, DSL compilation, and finally the KFP SDK calls that
upload and run the pipeline.

A nice consequence of this design is that when the Jupyter server lives
inside a Kubeflow Notebook Pod, the Kale kernel is _already inside the cluster_.
It can reach the in-cluster Kubeflow Pipelines API directly,
using the Pod's service account — no port-forwards, no VPN, no extra
credentials. Kale "just works" in a Kubeflow installation because the
Python that calls the KFP SDK is already a cluster citizen.

### Diagram

```
  Browser (your laptop)
  ┌──────────────────────────────┐
  │ JupyterLab UI                │
  │   Kale labextension (TS/React)│
  └──────────────┬───────────────┘
                 │  WebSocket / HTTP
                 │
  ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─  (local ⇄ network boundary)
                 │
  Jupyter server (laptop OR Pod in cluster)
  ┌──────────────▼───────────────┐
  │ Jupyter server               │
  │                              │
  │  ┌────────────────────────┐  │
  │  │ Kale-managed kernel    │  │
  │  │   └─ import kale       │  │
  │  │       └─ kale.rpc/*    │  │
  │  │           └─ library   │  │──┐
  │  └────────────────────────┘  │  │ KFP SDK
  │                              │  │
  │  (user notebook kernels)     │  │
  └──────────────────────────────┘  │
                                    ▼
                          Kubeflow Pipelines API
                          (in the same cluster when
                           Jupyter runs in a KF Notebook)
```

## Python library layout

The Python package lives at `kale/`. The interesting modules are:

### Core pipeline model

- `pipeline.py` — defines {py:class}`kale.pipeline.Pipeline` (a
  `networkx.DiGraph` of steps) along with the configuration classes
  {py:class}`~kale.pipeline.PipelineConfig`, `VolumeConfig`, and
  `KatibConfig`.
- `step.py` — defines {py:class}`kale.step.Step` and
  {py:class}`~kale.step.StepConfig`, plus the `PipelineParam` and
  `Artifact` named tuples used across the backend.

### Notebook processing

- `processors/nbprocessor.py` — {py:class}`kale.processors.NotebookProcessor`
  reads an `.ipynb`, parses tags, resolves data dependencies, and returns
  a ready-to-compile `Pipeline`.

### Compilation

- `compiler.py` — {py:class}`kale.compiler.Compiler` renders the
  templates in `kale/templates/` to produce KFP v2 DSL.
- `templates/nb_function_template.jinja2` — per-step component template.
- `templates/pipeline_template.jinja2` — pipeline wrapper template.

### Marshalling

- `marshal/backend.py` — {py:class}`~kale.marshal.backend.Dispatcher` and
  {py:class}`~kale.marshal.backend.MarshalBackend` base class.
- `marshal/backends.py` — nine concrete backends for numpy, pandas,
  sklearn, XGBoost, PyTorch, Keras, TensorFlow, functions, and a `dill`
  fallback.
- `marshal/decorator.py` — the `@marshal` decorator used by the marshal
  entrypoint.

### Static analysis

- `common/astutils.py` — AST helpers for detecting marshal candidates,
  parsing metrics print statements, and resolving imports.
- `common/flakeutils.py` — PyFlakes integration.

### KFP and Kubernetes integration

- `common/kfputils.py` — compile DSL, upload pipelines, create runs via
  the KFP SDK.
- `common/k8sutils.py`, `common/podutils.py` — K8s API helpers used by
  volume management and the in-pod runtime.
- `common/katibutils.py` — Katib hyperparameter tuning helpers (legacy,
  under re-evaluation for v2).

### Configuration framework

- `config/config.py` — a small Pydantic-inspired validation framework used
  by all the `*Config` classes in `pipeline.py` and `step.py`.
- `config/validators.py` — validators for Kubernetes names, image refs,
  and other common field types.

### CLI

- `cli.py` — implements the `kale` entry point declared in `pyproject.toml`,
  which compiles and optionally runs notebooks against KFP.

### RPC layer

These modules are what the Kale-managed kernel executes when the
labextension calls into it over JSON-RPC (see [](#how-the-extension-talks-to-the-library)).

- `rpc/nb.py` — notebook compilation RPC endpoints.
- `rpc/kfp.py` — KFP operations (upload, run, list experiments).
- `rpc/katib.py` — Katib operations.
- `rpc/run.py` — the JSON-RPC dispatcher.
- `rpc/errors.py` — error types (`RPCNotFoundError`, etc.).

## JupyterLab extension layout

The JupyterLab extension lives at `labextension/`. It's a standard
JupyterLab 4 extension built with TypeScript and React, and it runs in
the user's browser.

Key source files:

- `src/index.ts` — extension activation.
- `src/widget.tsx` — the main Kale left sidebar widget.
- `src/widgets/LeftPanel.tsx` — top-level panel with the master toggle,
  pipeline settings form, and Deploy button.
- `src/widgets/cell-metadata/CellMetadataEditor.tsx` — per-cell Kale row
  (cell type dropdown, step name, dependency picker).
- `src/widgets/deploys-progress/` — progress notifications for running
  deploys.
- `src/lib/RPCUtils.tsx` — JSON-RPC client that talks to the
  Kale-managed Python kernel.
- `src/lib/CellUtils.ts`, `TagsUtils.ts`, `NotebookUtils.tsx` — helpers for
  manipulating notebook metadata.
- `schema/kale-settings.json` — JupyterLab settings schema for any
  user-facing preferences.

The extension manages the lifecycle of its dedicated Python kernel (the
"Kale-managed kernel" from the previous section) and dispatches every UI
action through `RPCUtils` as a JSON-RPC call into that kernel. There is no
other server or network hop in between — the Jupyter kernel *is* the
execution environment for the Kale library.

## Data flow end-to-end

Putting all the pieces together, here's what happens when you click
**Compile and Run** in the Kale side panel on a notebook called
`my_notebook.ipynb`:

```
JupyterLab UI (React, in the browser)
     │ RPCUtils.post("nb.compile_notebook", {path})
     ▼
Kale-managed kernel (Python, in the Jupyter server)
     │ kale/rpc/nb.compile_notebook()
     ▼
NotebookProcessor           ── parse tags, build Pipeline DAG
     │
     ▼
Compiler                    ── render Jinja templates, autopep8
     │
     ▼
.kale/my_notebook.kale.py   ── plain KFP v2 DSL
     │
     ▼
kfp.compiler.Compiler       ── compile DSL → YAML IR
     │
     ▼
KFP REST API                ── upload pipeline, create run
     │
     ▼
Kubeflow Pipelines          ── schedule step pods
     │
     ▼
Step pod                    ── load inputs, run user code, save outputs
```

The generated DSL is a normal KFP v2 pipeline — no runtime dependency on
Kale beyond the marshalling helper that lives inside each component. This
means a Kale-produced pipeline keeps running even if Kale is uninstalled,
and it can be inspected, edited, or re-uploaded by anyone with the KFP
SDK.
