# Kale Architecture

This document provides a high-level overview of Kale's architecture for contributors and users who want to understand how the system works.

## Overview

Kale (Kubeflow Automated pipeLines Engine) converts Jupyter notebooks into Kubeflow Pipelines. It consists of two main components:

1. **Backend** (`backend/kale/`) - Python package that processes notebooks and generates KFP pipelines
2. **JupyterLab Extension** (`labextension/`) - TypeScript/React UI for annotating notebooks and deploying pipelines

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           User's JupyterLab                                 │
│  ┌──────────────────────────────────┐    ┌───────────────────────────────┐  │
│  │        Jupyter Notebook          │    │     Kale Extension Panel      │  │
│  │  ┌────────────────────────────┐  │    │  ┌─────────────────────────┐  │  │
│  │  │ # imports                  │  │    │  │ Pipeline Name: [____]   │  │  │
│  │  │ import pandas as pd       │  │    │  │ Experiment:    [____]   │  │  │
│  │  └────────────────────────────┘  │    │  │                         │  │  │
│  │  ┌────────────────────────────┐  │    │  │ Steps:                  │  │  │
│  │  │ # step:load_data          │  │◄───┼──┤  ☑ load_data            │  │  │
│  │  │ df = pd.read_csv(...)     │  │    │  │  ☑ preprocess           │  │  │
│  │  └────────────────────────────┘  │    │  │  ☑ train_model          │  │  │
│  │  ┌────────────────────────────┐  │    │  │                         │  │  │
│  │  │ # step:preprocess         │  │    │  │ [Compile & Run]         │  │  │
│  │  │ # prev:load_data          │  │    │  └─────────────────────────┘  │  │
│  │  │ df = df.dropna()          │  │    │                               │  │
│  │  └────────────────────────────┘  │    └───────────────────────────────┘  │
│  └──────────────────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ RPC (via Jupyter Kernel)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Kale Backend                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ NotebookProcessor│───►│    Pipeline     │───►│      Compiler          │  │
│  │                 │    │                 │    │                         │  │
│  │ • Parse cells   │    │ • Steps DAG     │    │ • Jinja2 templates     │  │
│  │ • Extract tags  │    │ • Dependencies  │    │ • KFP DSL generation   │  │
│  │ • Detect deps   │    │ • Configuration │    │ • packages_to_install  │  │
│  └─────────────────┘    └─────────────────┘    └───────────┬─────────────┘  │
└───────────────────────────────────────────────────────────┬─────────────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Generated KFP Pipeline                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  @kfp_dsl.component(base_image='python:3.12', ...)                     │ │
│  │  def load_data(...):                                                   │ │
│  │      ...                                                               │ │
│  │                                                                        │ │
│  │  @kfp_dsl.pipeline(name='my-pipeline')                                 │ │
│  │  def auto_generated_pipeline():                                        │ │
│  │      load_data_task = load_data()                                      │ │
│  │      preprocess_task = preprocess(load_data_task.outputs[...])         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ kfp.compiler.Compiler()
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Kubeflow Pipelines                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │  Pipeline YAML  │───►│   KFP Server    │───►│   Kubernetes Cluster   │  │
│  │  (.yaml)        │    │                 │    │                         │  │
│  └─────────────────┘    └─────────────────┘    │  ┌───┐ ┌───┐ ┌───┐     │  │
│                                                │  │Pod│►│Pod│►│Pod│     │  │
│                                                │  └───┘ └───┘ └───┘     │  │
│                                                └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Notebook Annotation

Users annotate notebook cells with special tags (comments) that define the pipeline structure:

```python
# imports
import pandas as pd
import numpy as np
```

```python
# step:load_data
df = pd.read_csv('data.csv')
```

```python
# step:preprocess
# prev:load_data
df = df.dropna()
processed_data = df.values
```

### 2. Notebook Processing (`NotebookProcessor`)

The `NotebookProcessor` reads the notebook and:

1. **Parses cell tags** - Identifies imports, functions, steps, dependencies
2. **Extracts code** - Collects source code for each step
3. **Detects dependencies** - Uses PyFlakes + AST analysis to find variables passed between steps
4. **Builds Pipeline object** - Creates a DAG of steps with their configurations

### 3. Pipeline Compilation (`Compiler`)

The `Compiler` takes the `Pipeline` object and:

1. **Generates lightweight components** - Each step becomes a `@kfp_dsl.component`
2. **Resolves package dependencies** - Parses imports to build `packages_to_install`
3. **Renders templates** - Uses Jinja2 to generate the final Python script
4. **Produces KFP DSL** - Outputs a standalone Python file with the pipeline definition

### 4. Pipeline Execution

The generated script is:

1. **Compiled to YAML** - `kfp.compiler.Compiler()` produces pipeline.yaml
2. **Uploaded to KFP** - Sent to the Kubeflow Pipelines server
3. **Executed on Kubernetes** - Each step runs as a container in a pod

## Backend Components

### Directory Structure

```
backend/kale/
├── __init__.py          # Package exports
├── cli.py               # Command-line interface
├── compiler.py          # Pipeline → KFP DSL conversion
├── pipeline.py          # Pipeline and configuration classes
├── step.py              # Step and StepConfig classes
├── config/              # Configuration system
│   ├── config.py        # Base Config class with Field system
│   └── validators.py    # Field validators
├── processors/
│   ├── baseprocessor.py # Base class for processors
│   └── nbprocessor.py   # Notebook processing logic
├── common/              # Shared utilities
│   ├── astutils.py      # AST parsing for dependency detection
│   ├── flakeutils.py    # PyFlakes integration
│   ├── graphutils.py    # DAG operations
│   ├── kfputils.py      # KFP client utilities
│   └── ...
├── marshal/             # Data serialization between steps
│   ├── backend.py       # Marshal backend
│   └── backends.py      # Type-specific backends (sklearn, numpy, etc.)
├── rpc/                 # RPC handlers for JupyterLab extension
│   ├── nb.py            # Notebook operations
│   ├── kfp.py           # KFP operations
│   └── ...
└── templates/           # Jinja2 templates for code generation
    ├── new_nb_function_template.jinja2
    └── new_pipeline_template.jinja2
```

### Key Classes

#### `NotebookProcessor` (`processors/nbprocessor.py`)

Converts a Jupyter notebook into a `Pipeline` object.

```python
processor = NotebookProcessor(
    nb_path='my_notebook.ipynb',
    config=NotebookConfig(...)
)
pipeline = processor.run()
```

Key responsibilities:
- Parse notebook cells and extract tags
- Detect variable dependencies between steps using PyFlakes/AST
- Build the step dependency graph
- Merge imports and functions into each step

#### `Pipeline` (`pipeline.py`)

Represents the pipeline DAG and configuration.

```python
class Pipeline:
    steps: List[Step]           # Pipeline steps
    config: PipelineConfig      # Pipeline configuration
    processor: BaseProcessor    # Reference to the processor

    def get_step(name) -> Step
    def get_ordered_ancestors(step_name) -> List[str]
```

#### `Step` (`step.py`)

Represents a single pipeline step.

```python
class Step:
    name: str                   # Step name (from tag)
    source: List[str]           # Source code lines
    ins: Set[str]               # Input variables (from previous steps)
    outs: Set[str]              # Output variables (to next steps)
    config: StepConfig          # Step configuration
```

#### `Compiler` (`compiler.py`)

Converts a `Pipeline` into executable KFP DSL code.

```python
compiler = Compiler(pipeline, imports_and_functions)
dsl_path = compiler.compile()  # Returns path to generated .py file
compiler.run()                 # Compile, upload, and run
```

### Dependency Detection

Kale uses a combination of PyFlakes and AST analysis to detect variable dependencies:

1. **PyFlakes** identifies undefined names in each step's code
2. **AST analysis** finds all names defined in ancestor steps
3. **Matching** connects undefined names to their definitions

```
Step A: defines `df`, `model`
Step B: uses `df` (undefined) → detected as input from A
Step C: uses `model` (undefined) → detected as input from A
```

## JupyterLab Extension

### Directory Structure

```
labextension/
├── src/
│   ├── index.ts              # Plugin registration
│   ├── widget.tsx            # Main plugin activation
│   ├── components/           # React components
│   │   ├── DeployButton.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── widgets/
│   │   ├── LeftPanel.tsx     # Main sidebar panel
│   │   └── cell-metadata/    # Cell tag editors
│   └── lib/
│       ├── RPCUtils.tsx      # Kernel RPC communication
│       ├── NotebookUtils.tsx # Notebook manipulation
│       └── TagsUtils.ts      # Cell tag parsing
├── style/                    # CSS styles
└── jupyter-config/           # Server extension config
```

### Communication Flow

The extension communicates with the backend via Jupyter kernel RPC:

```
Extension (TypeScript)          Kernel (Python)
       │                              │
       │──── executeRpc() ───────────►│
       │     "nb.compile_notebook"    │
       │                              │
       │                              │ NotebookProcessor
       │                              │ Compiler
       │                              │
       │◄──── result ─────────────────│
       │      {pipeline_path: ...}    │
```

## Cell Tag Language

Kale uses special comments to annotate notebook cells:

| Tag | Description | Example |
|-----|-------------|---------|
| `# imports` | Mark cell as imports (prepended to all steps) | `# imports` |
| `# functions` | Mark cell as functions (prepended to all steps) | `# functions` |
| `# skip` | Skip this cell entirely | `# skip` |
| `# step:name` | Define a pipeline step | `# step:train_model` |
| `# prev:name` | Declare dependency on another step | `# prev:load_data` |
| `# pipeline-parameters` | Define pipeline input parameters | `# pipeline-parameters` |
| `# pipeline-metrics` | Define pipeline output metrics | `# pipeline-metrics` |
| `# annotation:key:value` | Add Kubernetes pod annotation | `# annotation:team:ml` |
| `# label:key:value` | Add Kubernetes pod label | `# label:env:prod` |
| `# limit:resource:value` | Set resource limit | `# limit:nvidia.com/gpu:1` |

## KFP v2 Integration

Kale generates KFP v2-compatible pipelines using:

- **Lightweight Python components** via `@kfp_dsl.component` decorator
- **Native artifacts** (`Input`, `Output`, `Dataset`, `Model`, etc.)
- **Modern compiler** (`kfp.compiler.Compiler`)

### Generated Component Example

```python
@kfp_dsl.component(
    base_image='python:3.12',
    packages_to_install=['pandas', 'numpy', 'kubeflow-kale', 'kfp>=2.0.0'],
)
def load_data(
    load_data_html_report: Output[HTML],
    data_output_artifact: Output[Dataset],
):
    # User's notebook code here
    df = pd.read_csv('data.csv')

    # Kale marshal: save outputs for next steps
    from kale.marshal import Marshaller
    _kale_marshaller = Marshaller()
    _kale_marshaller.save(df, data_output_artifact.path, 'data')
```

## Configuration System

Kale uses a typed configuration system with validation:

```python
class PipelineConfig(Config):
    pipeline_name = Field(type=str, required=True)
    experiment_name = Field(type=str, default="Default")
    docker_image = Field(type=str, default="python:3.12")
    volumes = Field(type=list, default=[])
    # ...

class StepConfig(Config):
    labels = Field(type=dict, default={})
    annotations = Field(type=dict, default={})
    limits = Field(type=dict, default={})
    retry_count = Field(type=int, default=0)
    timeout = Field(type=int)
```

## Marshal System

The marshal system handles data passing between pipeline steps:

1. **Output**: At the end of each step, variables are serialized to artifacts
2. **Input**: At the start of each step, artifacts are deserialized to variables

```python
# End of step A
_kale_marshaller.save(df, artifact_path, 'df')

# Start of step B
df = _kale_marshaller.load(artifact_path, 'df')
```

Type-specific backends handle different data types:
- `PandasBackend` - DataFrames, Series
- `NumpyBackend` - Arrays
- `SKLearnBackend` - Scikit-learn models
- `PyTorchBackend` - PyTorch models
- `PickleBackend` - Generic Python objects (fallback)

## Development Workflow

```bash
# Setup development environment
make dev

# Run JupyterLab with live reload
make jupyter

# Run tests
make test-backend
make test-labextension

# Build for release
make build
```

See [CONTRIBUTE.md](../CONTRIBUTE.md) for detailed development instructions.
