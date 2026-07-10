# KEP-0812: Composable Kale Notebooks

|                     |                                                                  |
| ------------------- | ---------------------------------------------------------------- |
| **Authors**         | [ederign](https://github.com/ederign), collaborating with [StefanoFioravanzo](https://github.com/StefanoFioravanzo) and [Ya-shh](https://github.com/Ya-shh) |
| **Created**         | 2026-05-27                                                       |
| **Updated**         | 2026-06-25                                                       |
| **Status**          | Provisional                                                      |
| **Google Doc (draft)** | https://docs.google.com/document/d/1SBgVL91Z_2mz1R0WH2UXIX0V4WZECK2KvUl4LE016Cw/edit |
| **Relevant Issues** | https://github.com/kubeflow/kale/issues/812                      |
| **GSoC 2026**       | [Project #11: Composable Kale Notebooks](https://www.kubeflow.org/events/upcoming-events/gsoc-2026/#project-11-composable-kale-notebooks-with-visual-pipeline-editor) |

## Table of Contents

- [Summary](#summary)
- [Motivation](#motivation)
  - [Goals](#goals)
  - [Non-Goals](#non-goals)
- [User Stories](#user-stories)
- [Background: How Kale Works Today](#background-how-kale-works-today)
- [Proposal](#proposal)
  - [Architecture](#architecture)
  - [The `notebook` Cell Type](#the-notebook-cell-type)
  - [Boundary Variable Detection](#boundary-variable-detection)
  - [Compiled Output](#compiled-output)
- [Design Details](#design-details)
  - [Decision 1: Compilation Approach](#decision-1-compilation-approach)
  - [Decision 2: Notebook Interface Declaration](#decision-2-notebook-interface-declaration)
  - [Decision 3: Composition Definition Format](#decision-3-composition-definition-format)
  - [Decision 4: Output Marshaling](#decision-4-output-marshaling)
  - [Notes/Constraints/Caveats](#notesconstraintscaveats)
  - [Risks and Mitigations](#risks-and-mitigations)
  - [Test Plan](#test-plan)
- [Implementation Plan](#implementation-plan)
- [Migration](#migration)
- [Implementation History](#implementation-history)
- [Drawbacks](#drawbacks)
- [Alternatives Considered](#alternatives-considered)
- [Consequences](#consequences)
- [Open Questions](#open-questions)

## Summary

Extend Kale to support composition of multiple notebooks into a single Kubeflow Pipeline. A new `notebook` cell type lets users reference other notebooks as sub-pipelines directly inside their notebook, alongside regular `step:` cells. Each referenced notebook is compiled through the existing NotebookProcessor and Compiler, producing a KFP sub-pipeline (GraphComponent) with full cell-level visibility in the KFP UI. Boundary variables between notebooks and steps are detected automatically via the same AST/PyFlakes mechanism Kale uses for cell-to-cell dependencies.

This KEP is being developed as part of the [Google Summer of Code 2026](https://www.kubeflow.org/events/upcoming-events/gsoc-2026/#project-11-composable-kale-notebooks-with-visual-pipeline-editor) program under the Kubeflow organization.

## Motivation

Notebook workflows are commonly split across multiple files: one for data preprocessing, another for training, another for evaluation. Today, Kale only converts a single notebook into a pipeline. There is no way to compose multiple notebooks into a coordinated workflow without manually writing KFP pipeline code.

This forces users to either cram everything into one notebook (hurting modularity and reuse) or leave the notebook environment to wire things together (losing the notebook-native experience that Kale provides).

### Goals

1. Compose multiple notebooks into a single KFP pipeline with validated data flow
2. Preserve cell-level step visibility for each notebook in the KFP UI
3. Detect data flow between notebooks automatically — zero friction for the user
4. Allow mixing of regular `step:` cells and `notebook:` cells in the same notebook
5. Composed notebooks compile and run through the existing `kale --nb` CLI path — no separate command
6. Preserve compatibility with the existing single-notebook workflow
7. Keep the composition layer additive — the existing NotebookProcessor and Compiler are not modified

### Non-Goals

- Visual pipeline editor (future work using React Flow, depends on this KEP)
- Runtime notebook orchestration outside of KFP
- Changing the behavior of existing cell types or the single-notebook compilation path
- Supporting non-notebook components in the composition (e.g., container components, custom scripts)

---

## User Stories

### Story 1: Data Scientist Composes a Training Workflow

A data scientist has three notebooks — `preprocess.ipynb`, `train.ipynb`, and `evaluate.ipynb` — that they run manually in sequence. They create a `main.ipynb` with `notebook:` cells referencing each one:

```
┌─────────────────────────────────────────────────────────┐
│ [notebook:preprocess 📓]                                │
│  (references ./preprocess.ipynb)                        │
├─────────────────────────────────────────────────────────┤
│ [notebook:train 📓]                                     │
│  (references ./train.ipynb)                             │
├─────────────────────────────────────────────────────────┤
│ [notebook:evaluate 📓]                                  │
│  (references ./evaluate.ipynb)                          │
└─────────────────────────────────────────────────────────┘
```

Kale detects that `preprocess` produces `dataset`, `train` consumes it, `train` produces `model`, `evaluate` consumes it. One click on "Compile and Run" produces a single KFP pipeline with three sub-pipelines, each showing its internal cell-level steps.

### Story 2: Mixing Steps and Sub-Notebooks

An ML engineer has a reusable `train.ipynb` from a colleague. They want to add their own preprocessing and postprocessing code around it:

```
┌─────────────────────────────────────────────────────────┐
│ [imports]         import numpy as np                    │
├─────────────────────────────────────────────────────────┤
│ [step:preprocess ●●]                                    │
│  dataset = load_data("input.csv")                       │
│  features = extract_features(dataset)                   │
├─────────────────────────────────────────────────────────┤
│ [notebook:train 📓]                                     │
│  (references ./train.ipynb)                             │
├─────────────────────────────────────────────────────────┤
│ [step:evaluate ●●]                                      │
│  score = evaluate_model(model, test_data)               │
│  print(f"Accuracy: {score}")                            │
└─────────────────────────────────────────────────────────┘
```

Kale detects that `train.ipynb` uses `dataset` and `features` (defined by `step:preprocess`) and that it produces `model` and `test_data` (used by `step:evaluate`). The compiled pipeline has `preprocess_step` (a component), `train_pipeline` (a sub-pipeline with its own internal steps), and `evaluate_step` (a component). Data flows automatically between all three — variables cross the step/notebook boundary the same way they cross step/step boundaries.

---

## Background: How Kale Works Today

### Current Pipeline

```
Notebook (.ipynb with cell tags)
  --> NotebookProcessor (parse tags, build DAG, detect variable deps via PyFlakes)
  --> Pipeline (networkx DiGraph of Steps)
  --> Compiler (Jinja2 templates --> KFP v2 Python DSL script)
  --> kfp.compiler.Compiler() --> pipeline.yaml
```

### Key Components

| Component | File | Role |
|-----------|------|------|
| NotebookProcessor | `kale/processors/nbprocessor.py` | Parses cell tags, builds step DAG, detects data dependencies |
| Pipeline | `kale/pipeline.py` | networkx DiGraph holding Steps and PipelineConfig |
| Compiler | `kale/compiler.py` | Renders Jinja2 templates into KFP v2 DSL Python code |
| Config/Field | `kale/config/config.py` | Declarative configuration with typed fields and validators |
| CLI | `kale/cli.py` | `kale --nb notebook.ipynb [--upload_pipeline] [--run_pipeline]` |
| RPC | `kale/rpc/nb.py` | JSON-RPC endpoints for JupyterLab extension |
| Templates | `kale/templates/*.jinja2` | `nb_function_template.jinja2` (per-step component), `pipeline_template.jinja2` (orchestrator) |

### Cell Tag Language

Kale uses cell tags to define pipeline structure:

- `step:name` — defines a pipeline step
- `prev:name` — declares a step dependency
- `imports` — import statements prepended to all steps
- `functions` — function definitions prepended to all steps
- `pipeline-parameters` — variable assignments that become pipeline parameters
- `pipeline-metrics` — variables to log as KFP metrics
- `skip` — skip the cell entirely

### What Kale Generates

Each cell group tagged as a step becomes a `@kfp_dsl.component` (lightweight container component). A `@kfp_dsl.pipeline` function wires them together. Data passes between steps via a marshal directory using KFP artifacts.

### KFP SDK Version

Kale pins `kfp[kubernetes]>=2.16.0`.

---

## Proposal

### Architecture

The composition layer is additive. When NotebookProcessor encounters a `notebook:` cell, it recursively processes the referenced notebook and integrates it as a sub-pipeline node in the DAG. There is no special "composition notebook" — any Kale notebook can contain `notebook:` cells alongside `step:` cells.

```
Notebook (.ipynb with step: and notebook: cell tags)
  --> NotebookProcessor (parse tags, build DAG)
        |
        ├── step: cells → Steps (existing behavior, unchanged)
        |
        └── notebook: cells → NotebookProcessor (recursive, on referenced .ipynb)
                                --> Sub-pipeline (GraphComponent)
        |
  --> Composition Layer (match boundary variables across steps and sub-pipelines)
  --> Compiler (Jinja2 templates → KFP DSL with sub-pipelines)
  --> kfp.compiler.Compiler() → pipeline.yaml
```

### The `notebook` Cell Type

A new `notebook` cell type is added to Kale's tag language, following the same conventions as the existing `step` type:

- Tag format: `notebook:<name>` (analogous to `step:<name>`)
- The referenced notebook path is stored in cell metadata
- Ordering uses the same `prev:` mechanism as steps, though automatic inference handles most cases
- The cell body is empty for MVP — the metadata carries all the information

### Boundary Variable Detection

Data flow between notebooks and steps is inferred automatically using the same mechanism Kale uses for cell-to-cell dependencies, lifted one level:

1. For each notebook, scan all step code for **defined variables** (AST: top-level assignments) and **needed variables** (PyFlakes: undefined names)
2. If notebook/step B needs variable `X` and notebook/step A defines it, create a data edge A→B
3. Topologically sort the DAG. Raise an error on cycles.
4. For each boundary variable, identify which specific step within each notebook defines/consumes it. Wire KFP artifacts between those steps.

Name collisions (two notebooks defining the same variable) raise an error at compile time.

### Compiled Output

Each referenced notebook becomes a KFP sub-pipeline (`@dsl.pipeline`-decorated function / GraphComponent). Regular `step:` cells become `@dsl.component` functions as usual. A top-level `@dsl.pipeline` wires everything together, passing boundary variables as KFP artifacts between sub-pipelines and steps.

In the KFP UI, each sub-pipeline is expandable — the user sees both the notebook-level DAG and the cell-level steps inside each notebook.

---

## Design Details

This section documents the design decisions evaluated during the research phase. Each decision was prototyped and the chosen approach is marked.

### Decision 1: Compilation Approach

How does each notebook become a callable unit in the composed pipeline?

#### Option A: KFP `@dsl.notebook_component` — Rejected

Use KFP's built-in `@dsl.notebook_component` decorator. It embeds the entire notebook as a base64-compressed archive and executes it via nbclient at runtime.

| Consideration | Assessment |
|---------------|------------|
| Implementation effort | Low — KFP handles embedding, extraction, execution |
| KFP UI visibility | **Whole notebook = one opaque step. Loses cell-level debugging.** |
| Output handling | Manual — notebook must write to files, wrapper copies them |
| Parameter mechanism | Papermill (`parameters` cell tag) vs Kale (`pipeline-parameters` tag) — needs reconciliation |
| Dependencies | Relies on KFP notebook_component internals |

**Rejected because**: Each notebook appears as a single opaque box in the KFP UI. This loses cell-level step visibility, which is Kale's core value proposition. Also introduces Papermill dependency and the unsolved output extraction problem (Decision 4).

#### Option B: Kale-Compiled Sub-Pipelines (GraphComponent) — Chosen

Run each notebook through the existing NotebookProcessor and Compiler to produce cell-level steps, then wrap the result as a KFP GraphComponent (pipeline-as-component). The parent pipeline calls these sub-pipelines.

| Consideration | Assessment |
|---------------|------------|
| Implementation effort | High — requires composition compiler to produce callable sub-pipelines with typed return annotations |
| KFP UI visibility | **Full cell-level step visibility inside each sub-pipeline** |
| Output handling | Uses existing Kale marshal infrastructure |
| Boundary marshaling | Complex — boundary variables must map to specific cell-step input/output artifacts |
| Risk | GraphComponent return annotations with artifacts need validation against Kale's artifact types |

Key finding: `@dsl.pipeline` creates a `GraphComponent` (`kfp/dsl/graph_component.py`) which extends `BaseComponent`. A pipeline-decorated function CAN be called as a task inside another pipeline. The "Nested pipelines are not allowed" error (`pipeline_context.py:144`) only fires when entering a nested `Pipeline` context manager — not when calling a GraphComponent.

**Chosen because**: Preserves cell-level visibility in the KFP UI. Reuses 100% of existing Kale infrastructure (NotebookProcessor, Compiler, marshal system). Makes Decision 4 (output marshaling) a non-issue. The composition layer is purely additive. This approach was validated by Yash's GSoC POC, which successfully compiled multi-notebook compositions into KFP-valid pipeline YAML using this pattern.

**DSL file structure**: Rather than generating a single monolithic DSL file, each notebook should produce its own independent `.py` DSL file. The orchestrating DSL file imports the sub-notebook DSL files as dependencies. This mirrors the recursive nature of the processing — each notebook is an independent module that can be imported without circular references — and gives each notebook natural ownership of its own configuration (base image, cache, accelerators).

#### Option C: Kale-Owned Notebook-as-Component — Rejected

Generate a regular `@dsl.component` that embeds and executes the notebook using Kale's own marshal infrastructure for I/O (no Papermill).

| Consideration | Assessment |
|---------------|------------|
| Implementation effort | Medium — similar to Option A but Kale controls the execution template |
| KFP UI visibility | **Whole notebook = one opaque step** |
| Output handling | Uses Kale's marshal system — consistent with existing step data passing |
| Maintenance | More code to maintain, but more control |

**Rejected because**: Same fundamental problem as Option A — loses cell-level visibility.

---

### Decision 2: Notebook Interface Declaration

How does a notebook declare its inputs and outputs?

#### Option A: Cell Tags (`notebook-outputs`) — Deferred

Add a `notebook-outputs` cell tag alongside the existing `pipeline-parameters` tag. Users explicitly declare what the notebook produces.

| Consideration | Assessment |
|---------------|------------|
| Consistency | Follows existing Kale patterns |
| Friction | Requires users to maintain output declarations in sync with code |
| Use case | Necessary for "reusable component" story (Story 2 at scale) |

**Deferred to post-MVP**: Explicit declarations add friction without benefit when the composition is authored by the same person who wrote the notebooks. Needed later for the reusable-component story where different people author and compose notebooks. One possible follow-up is a `notebook-inputs` tag (paired with `notebook-outputs`) that would let sub-notebooks define stub values for local testing that the compiler replaces with upstream artifacts when composed, resolving the standalone vs. composable tension described in the caveats section.

#### Option B: Notebook Metadata — Deferred

Declare inputs/outputs in the `kubeflow_notebook` metadata JSON section.

**Deferred**: Same reasoning as Option A. Disconnected from code makes it harder to keep in sync.

#### Option C: Code-Level Helpers — Rejected

Use a Python API like `kale.declare_input("lr", float)` in code cells.

**Rejected because**: Breaks the Kale paradigm (cell tags, not code-level APIs). Requires either static analysis or execution to extract the interface.

#### Option D: Automatic Inference — Chosen

No declarations. Match variable names across notebooks using the same AST/PyFlakes mechanism Kale uses for cell-to-cell dependencies.

| Consideration | Assessment |
|---------------|------------|
| Friction | **Zero** — users write normal Kale notebooks, composition layer detects what flows between them |
| Consistency | Same approach Kale uses for cell-to-cell deps (PyFlakes undefined names + AST defined names), lifted one level |
| Limitation | Variable name collisions between notebooks create ambiguity — must raise error |
| Limitation | No typed contracts — variable types inferred from name heuristics |

**Chosen because**: Zero friction for MVP. Mirrors the existing Kale pattern. The name collision problem is solved by raising an error (not silently picking the first notebook). Explicit declarations (Option A) can be layered on later when the reusable-component story demands typed contracts. This approach was validated by Yash's GSoC POC, which successfully infers boundary variables across notebooks using AST/PyFlakes analysis.

---

### Decision 3: Composition Definition Format

How is the wiring between notebooks defined?

#### Option A: YAML Configuration File — Rejected for primary path

| Consideration | Assessment |
|---------------|------------|
| Simplicity | Easy to parse, validate, test |
| Version control | Diffable, reviewable |
| Separate file | Another artifact to maintain alongside notebooks |
| Kale philosophy | Breaks the "everything is in the notebook" paradigm |

**Rejected as primary path because**: Kale's strength is that everything is defined by cell tags and metadata inside the notebook. An external YAML file breaks this paradigm. YAML may be useful as a future escape hatch (e.g., when variable names differ between producer and consumer), but not as the primary composition format.

#### Option B: Composition Notebook with Code Helpers — Rejected

A special notebook whose cells use `kale.load()` and `kale.connect()` calls.

**Rejected because**: Mixes code-level APIs with Kale's tag-based system. The `kale.connect()` approach requires explicit wiring, adding friction that automatic inference eliminates.

#### Option C: Python Script — Rejected

A plain Python file with a programmatic API.

**Rejected because**: Leaves the notebook environment entirely. Doesn't integrate with Kale's CLI or JupyterLab extension.

#### Option D: Notebook Metadata via `notebook` Cell Type — Chosen

Composition is defined inside the parent notebook using a new `notebook` cell type. Users add `notebook:train` cells alongside their regular `step:` cells. The `.ipynb` file IS the composition format — Kale cell metadata is the serialization layer.

| Consideration | Assessment |
|---------------|------------|
| Kale philosophy | **Extends the existing cell tag system** — everything stays in the notebook |
| Mixing | `step:` and `notebook:` cells coexist freely in the same notebook |
| Serialization | Standard `.ipynb` metadata — diffable, version-controllable |
| UI | Natural fit: new entry in cell type dropdown, notebook path in metadata editor |
| Future | React Flow visual editor reads/writes the same cell metadata — the notebook is the source of truth |

**Chosen because**: This is the Kale way. Composition is defined by cell tags inside the notebook, just like pipeline structure. No external files, no new paradigms. The `.ipynb` format serves as the serialization layer for both the composition definition and the future React Flow visual editor.

---

### Decision 4: Output Marshaling

When a notebook is executed inside a KFP component, its output variables exist only in the notebook's kernel memory. They need to be extracted and made available as KFP artifacts for downstream notebooks.

#### Resolution: Non-Issue with Option B

By choosing Option B (sub-pipelines via GraphComponent) for compilation, this problem disappears:

- **Intra-notebook data flow**: Kale's existing marshal system handles variable passing between cell-level steps within each notebook. This is unchanged from the single-notebook path.
- **Inter-notebook data flow**: KFP artifact wiring handles variable passing between sub-pipelines. The composition compiler declares boundary variables as `Input[Type]`/`Output[Type]` on sub-pipeline function signatures, and KFP handles the rest.

There is no separate marshaling step. The composition compiler generates the type annotations and wiring; the existing infrastructure handles execution.

If Option A (`@dsl.notebook_component`) had been chosen, this would have been the hardest design problem — notebook kernel memory would need to be extracted post-execution. Option B makes it trivial.

---

### Notes/Constraints/Caveats

1. **Each notebook is atomic as a sub-pipeline.** If notebook A contains a `notebook:B` cell, and notebook B contains a `notebook:A` cell, that's a cycle and fails at compile time. If a user needs A to run before and after B, they must split it into `a_before.ipynb` and `a_after.ipynb`.

2. **`@dsl.pipeline` produces a callable GraphComponent.** A pipeline-decorated function can be called as a task inside another pipeline. The "Nested pipelines are not allowed" error only fires for nested context managers, not for calling a GraphComponent. Validated in the POC.

3. **Variable name collisions are an error.** When two notebooks/steps define the same variable name, the compiler must raise an error rather than silently picking one. Ambiguous data flow must be resolved by the user (rename the variable in one of the notebooks). Note: the current POC has a bug here — it uses `setdefault()` which silently keeps the first notebook and drops the second. This must be fixed to raise an explicit error.

4. **Type inference uses name heuristics.** KFP artifact types are inferred from variable names using Kale's existing type map (`model`→Model, `dataset`→Dataset, `metrics`→Metrics, etc.). Future work may add explicit type annotations.

5. **`notebook` cells break the code merge chain.** In Kale, untagged cells merge into the previous step. A `notebook:` cell is a reference to another notebook, not executable code — subsequent untagged cells must NOT be merged into it. This requires a new merge rule: the parser must reset the merge target so that following untagged cells belong to the next explicit `step:` cell, not to the notebook reference or to any previous step.

6. **Sub-notebooks cannot run standalone in v1.** Automatic inference detects a sub-notebook's inputs as undefined variables (via PyFlakes). If the sub-notebook defines those variables — even as stubs for testing — they are no longer undefined, inference stops detecting them as inputs, and upstream values silently never arrive. This means sub-notebooks used in a composition cannot also run independently. This is an accepted limitation of the zero-friction automatic inference approach (Decision 2, Option D). Post-MVP, explicit input/output declarations (see Decision 2, Option A) could resolve this by letting sub-notebooks define stub values that the compiler replaces with upstream artifacts when composed.

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Boundary variable detection produces false matches (common variable names) | Raise error on name collisions; users rename variables to disambiguate |
| GraphComponent return annotations with artifacts don't behave as expected | Validated in POC — NamedTuple return with typed artifacts works correctly |
| Recursive processing on deeply nested compositions causes performance issues | Limit nesting depth; in practice, compositions are shallow (2-3 levels) |
| AST analysis picks up variables inside function/class bodies as top-level definitions | Restrict analysis to top-level assignments only, matching Kale's existing approach |

### Test Plan

- **Unit Tests**: Topological sort, cycle detection, boundary variable detection, type inference, name collision errors
- **Edge Case Tests**: Diamond DAG, independent notebooks (no shared variables), multi-output sub-pipelines
- **Golden-File Tests**: Generated KFP DSL compared against expected output for known compositions
- **Integration Tests**: Full compose → compile cycle producing valid KFP pipeline YAML
- **E2E Tests** (stretch): Run composed pipeline on a real KFP cluster

---

## Implementation Plan

| Phase | Weeks | Feature | Description |
|-------|-------|---------|-------------|
| 1 | 1 | Bug fixes on top of Yash's research | Fix AST scope traversal, type heuristic, name collision handling, silent fallbacks |
| 2 | 2-3 | `notebook` cell type (backend) | Tag parsing, recursive notebook processing, boundary variable detection across mixed step/notebook nodes |
| 3 | 3-4 | Integration | Pipeline parameters support, read configuration from PipelineConfig instead of hard-coded values |
| 4 | 4-5 | Tests | Error cases, edge cases, golden files, KFP compilation validation |
| 5 | 5-6 | `notebook` cell type (frontend) | New cell type in JupyterLab extension with notebook path input |
| 6 | 6+ | Polish | Error messages, example notebooks, documentation |

The backend should be fully usable by the end of Phase 3.

---

## Migration

No migration needed. This is a purely additive feature:

- Existing single-notebook workflows are unaffected — `kale --nb notebook.ipynb` continues to work exactly as before
- The `notebook` cell type is new — existing notebooks have no `notebook:` tags, so the NotebookProcessor ignores the feature entirely
- No existing APIs are changed or deprecated

---

## Implementation History

- 2026-05-27: Initial KEP creation
- 2026-06-24: Yash delivered POC and research findings validating Option B (sub-pipelines) and Option D (automatic inference)
- 2026-06-25: Updated KEP with design decisions from POC evaluation. Chose Option B (sub-pipelines), Option D (automatic inference), Option D (notebook cell type). Documented rationale and alternatives.

---

## Drawbacks

- Adds complexity to Kale for a use case that power users could handle with manual KFP scripts
- Automatic variable inference is fragile — common variable names can cause unexpected collisions
- The `notebook` cell type adds a new concept to Kale's tag language that users must learn
- Recursive NotebookProcessor invocations add complexity to the processing pipeline

---

## Alternatives Considered

### Alternative 1: `@dsl.notebook_component` (Option A) as Primary Approach

Use KFP's built-in notebook component decorator. Each notebook becomes a single opaque step executed via nbclient/Papermill.

**Rejected because**:

- Each notebook appears as a single opaque box in the KFP UI — loses cell-level step visibility, which is Kale's core value proposition
- Introduces Papermill dependency and `parameters` tag that conflicts with Kale's `pipeline-parameters` tag
- Output extraction from notebook kernel memory is the hardest unsolved design problem (Decision 4)

### Alternative 2: YAML Configuration File as Primary Composition Format

Define notebook composition in a standalone YAML file with explicit connections.

**Rejected because**:

- Breaks Kale's "everything is in the notebook" paradigm
- Requires maintaining a separate file alongside the notebooks
- Adds friction: users must learn a new YAML schema and keep it in sync with notebooks
- May be useful as a future escape hatch for edge cases (variable name remapping), but not as the primary path

### Alternative 3: Explicit Interface Declarations (Cell Tags) as Requirement

Require every notebook to declare its outputs via a `notebook-outputs` cell tag before it can be composed.

**Rejected as MVP requirement because**:

- Adds friction to the most common use case (same author writes and composes the notebooks)
- The automatic inference approach mirrors how Kale already handles cell-to-cell dependencies — proven pattern
- Deferred to post-MVP: needed later for the reusable-component story where different people author and compose notebooks independently

---

## Consequences

### Positive

- Users can compose multi-notebook ML workflows without leaving the notebook environment
- Cell-level step visibility is preserved in the KFP UI — each sub-notebook is expandable
- Zero friction — no interface declarations needed for the common case
- The `.ipynb` file is the single source of truth for both individual pipelines and compositions
- Foundation for a future React Flow visual editor (same serialization format)

### Negative

- Automatic variable inference can produce surprising results with common variable names — users must rename to disambiguate
- Adds a new cell type concept that users need to learn
- Recursive NotebookProcessor invocations may slow down compilation for large compositions

### Neutral


---

## Open Questions

1. **Nesting depth**: Should compositions be nestable (a `notebook:` cell referencing a notebook that itself has `notebook:` cells)? If so, what is the maximum depth? The POC handles single-level composition only.

2. **Pipeline-level parameters**: How should `pipeline-parameters` cells flow through the composition? Should the parent notebook be able to override sub-notebook parameter defaults?

3. **React Flow integration**: The future visual editor will use React Flow to render the notebook's DAG. How does it discover the internal steps of referenced notebooks without running NotebookProcessor? Pre-compute and cache the interface, or run it on-demand?

4. **Fan-out connections**: Can one notebook output connect to multiple notebook/step inputs? The automatic inference supports this naturally (multiple consumers of the same variable), but it needs explicit testing.

5. **Relative vs absolute paths**: Should `notebook_path` in cell metadata be relative to the parent notebook's directory, relative to the workspace root, or absolute? Relative-to-parent is most portable.

6. **KFP terminology**: The KEP uses "sub-pipeline" as shorthand. The underlying KFP mechanism is a `@dsl.pipeline`-decorated function called as a task inside another pipeline, which creates a `GraphComponent`. We should clarify this mapping so users can find the relevant KFP documentation.

7. **Configuration inheritance**: When a sub-notebook has no configuration (base image, cache, accelerators), should it inherit settings from the parent notebook's PipelineConfig, or use defaults? Should sub-notebooks support the same configuration options as steps?
