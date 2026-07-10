# KEP-0607: Built-in Kale Example Notebooks in the Launcher

|                     |                                                                  |
| ------------------- | ---------------------------------------------------------------- |
| **Authors**         | [ederign](https://github.com/ederign) |
| **Created**         | 2026-06-27                                                       |
| **Relevant Issues** | https://github.com/kubeflow/kale/issues/607                      |

## Table of Contents

- [Summary](#summary)
- [Motivation](#motivation)
  - [Goals](#goals)
  - [Non-Goals](#non-goals)
- [User Stories](#user-stories)
- [Proposal](#proposal)
  - [Architecture](#architecture)
  - [API](#api)
- [Design Details](#design-details)
  - [Catalog YAML Schema](#catalog-yaml-schema)
  - [Directory Layout](#directory-layout)
  - [Packaging and Installation](#packaging-and-installation)
  - [Discovery and Priority](#discovery-and-priority)
  - [Materialization](#materialization)
  - [Frontend Components](#frontend-components)

  - [Notes/Constraints/Caveats](#notesconstraintscaveats)
  - [Risks and Mitigations](#risks-and-mitigations)
  - [Test Plan](#test-plan)
- [Implementation Plan](#implementation-plan)
- [Migration](#migration)
- [Implementation History](#implementation-history)
- [Drawbacks](#drawbacks)
- [Alternatives Considered](#alternatives-considered)
- [Consequences](#consequences)

## Summary

A **Sample Notebook Catalog** — a browsable card grid of curated Kale examples accessible directly from the JupyterLab Launcher. Users click a sample, it gets copied into their workspace, and the notebook opens ready to use. The catalog is **filesystem-driven**, using **Jupyter's standard data directories** for discovery. No external services, registries, or CRDs are required.

## Motivation

Kale has no in-product onboarding. New users who install Kale see an empty deployment panel and have no guidance on how to get started with Kale. They must:

1. Search the Kale repository for example notebooks
2. Manually download or clone them
3. Figure out which notebook to start with
4. Place the notebook somewhere JupyterLab can access it

This creates friction for new users and makes it harder to demonstrate Kale's capabilities. A built-in sample catalog provides immediate discoverability and a one-click path from "just installed Kale" to "running my first pipeline."

For organizations using Kale, the catalog also serves as a way to distribute team-specific pipeline templates to all notebook servers without requiring users to know where to find them.

### Goals

1. Provide a browsable catalog of curated Kale examples inside JupyterLab
2. Make examples discoverable from the Launcher (home screen) and the Kale sidebar empty state
3. One-click materialization: click a card, notebook opens in the file browser
4. Handle conflicts when a sample was already materialized (open existing, recreate, or cancel)
5. Support filtering by tags (e.g. `ml`, `genai`, `starter`)
6. Use Jupyter's standard data directories for discovery — no external services
7. Allow organizations to add custom examples by placing files in any Jupyter data directory
8. Refactor existing code examples from Kale into this new catalog structure

### Non-Goals (Future Work)

- Remote/Git-based sample repositories (fetching examples from remote Git repos at runtime)
- Remote catalog resolvers or registries
- Synchronization mechanisms between catalog and workspace
- Editing or running notebooks directly from the catalog dialog

---

## User Stories

### Story 1: New User Discovers Kale Examples from the Launcher

A data scientist installs Kale and opens JupyterLab. A **"Kale Examples"** tile appears in the Launcher under the "Other" category. They click it, see a card grid with three examples, and click "Candies Sharing" to get started. The notebook is copied into `~/kale-samples/candies-sharing/` and opens automatically.

### Story 2: User Finds Examples from the Sidebar Empty State

A user opens a notebook that doesn't have Kale enabled. The Kale sidebar shows its empty state with a new "Browse examples" link. Clicking it opens the same examples dialog.

### Story 3: User Re-opens a Previously Loaded Example

A user clicks "Titanic ML Dataset" but has already loaded it before. A conflict dialog appears with three options:
- **Open Existing** — opens the previously copied notebook
- **Recreate** — deletes the old copy and creates a fresh one
- **Cancel**

### Story 4: Platform Admin Distributes Team-Specific Examples

A Kubeflow admin creates a custom catalog YAML and sample notebooks, then adds them to the Docker image at `/usr/local/share/jupyter/kale/catalog/` and `/usr/local/share/jupyter/kale/samples/`. All notebook servers in the cluster see the team-specific examples alongside the built-in ones.

### Story 5: User Filters by Tag

A user opens the examples dialog and sees tag filter chips at the top: "All", "starter", "ml", "classification", "genai", "rag". They click "genai" to see only the RAG Pipeline example.

---

## Proposal

### Architecture

The catalog is a three-layer system:

```
┌─────────────────────────────────────────────────────────┐
│  JupyterLab Frontend                                    │
│  ┌─────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │ Launcher    │  │ ExamplesDialog│  │ Conflict      │  │
│  │ Tile        │──│ (card grid)   │──│ Dialog        │  │
│  └─────────────┘  └──────┬────────┘  └───────────────┘  │
│                          │ RPC                          │
├──────────────────────────┼──────────────────────────────┤
│  Kale Backend            │                              │
│  ┌───────────────────────┴───────────────────────────┐  │
│  │ kale.rpc.nb                                       │  │
│  │  list_examples()  check_sample_exists()           │  │
│  │  load_example(sample_id, recreate?)               │  │
│  └───────────────────────┬───────────────────────────┘  │
│  ┌───────────────────────┴───────────────────────────┐  │
│  │ kale.examples_catalog                             │  │
│  │  loader.py    → discover, validate, resolve       │  │
│  │  materializer.py → copy, provenance, conflict     │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │ filesystem                   │
├──────────────────────────┼──────────────────────────────┤
│  Jupyter Data Dirs       │                              │
│  ┌───────────────────────┴───────────────────────────┐  │
│  │ <data_dir>/kale/catalog/*.yaml  (definitions)     │  │
│  │ <data_dir>/kale/samples/<name>/ (notebook files)  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### API

#### RPC Endpoints (added to `kale.rpc.nb`)

| Endpoint | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `nb.list_examples` | — | `[{id, title, description, tags, difficulty}]` | Lists all catalog entries |
| `nb.check_sample_exists` | `sample_id`, `server_root?` | `{exists: bool}` | Checks if sample is already materialized |
| `nb.load_example` | `sample_id`, `server_root?`, `recreate?` | `{notebook_path: string}` | Materializes sample, returns path to open |

#### Python API (`kale.examples_catalog`)

| Function | Module | Description |
|----------|--------|-------------|
| `discover_examples(data_dirs?)` | `loader.py` | Scan Jupyter data dirs, parse YAML, return merged entries |
| `validate_entry(entry, data_dir)` | `loader.py` | Validate a single catalog entry against schema and filesystem |
| `resolve_sample_dir(sample_id, data_dirs?)` | `loader.py` | Find the sample directory for a given id across data dirs |
| `materialize(sample_id, server_root?, ...)` | `materializer.py` | Copy sample to workspace, return notebook path |
| `recreate(sample_id, server_root?, ...)` | `materializer.py` | Delete existing + materialize fresh |
| `check_existing(sample_id, server_root?)` | `materializer.py` | Check if materialized copy exists |

---

## Design Details

### Catalog YAML Schema

Catalog files use `kind: ExamplesCatalog` and list one or more items:

```yaml
apiVersion: kale.kubeflow.org/v2alpha1
kind: ExamplesCatalog

items:
  - id: my-sample              # Unique identifier (required)
    title: "My Sample"         # Display title (required)
    description: "What it does" # Short description (required)
    tags: [ml, starter]        # Filter tags (optional, default: [])
    difficulty: beginner       # beginner | intermediate | advanced (optional)
    assets:
      source: "my-sample"     # Directory name under samples/ (required)
    entrypoint:
      notebook: "main.ipynb"  # Notebook to open after materialization (required)
```

#### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique identifier across all catalogs. Used as materialization directory name. |
| `title` | yes | Human-readable title shown on the card. |
| `description` | yes | Short description shown below the title (2-line clamp in the UI). |
| `tags` | no | List of strings for filtering in the UI. |
| `difficulty` | no | One of `beginner`, `intermediate`, `advanced`. Shown as a colored chip. |
| `assets.source` | yes | Name of the directory under `kale/samples/` containing the sample files. Must not contain `..` or absolute paths. |
| `entrypoint.notebook` | yes | Relative path to the notebook to open. Must exist in the source directory. Must not contain `..` or absolute paths. |

#### Validation Rules

- `id`, `title`, `description`, `assets.source`, and `entrypoint.notebook` are required.
- `id` must not contain path separators (`/`, `\`) or `..`, as it is used as the materialization directory name.
- `assets.source` and `entrypoint.notebook` are validated against path traversal (`..`) and absolute paths, but may contain forward slashes for subdirectory paths.
- The sample directory `<data_dir>/kale/samples/<assets.source>/` must exist.
- `difficulty` must be one of the three accepted values if provided.
- Files with `kind` other than `ExamplesCatalog` are skipped with a warning.
- Invalid entries are skipped with a warning; valid entries in the same file still load.

### Directory Layout

```
examples/
├── catalog/                  # Catalog YAML definitions
│   ├── getting-started.yaml  # Candies Sharing + Titanic ML
│   └── genai.yaml            # RAG Pipeline
├── base/                     # Sample: Candies Sharing
│   └── candies_sharing.ipynb
├── titanic-ml-dataset/       # Sample: Titanic ML Dataset
│   └── titanic_dataset_ml.ipynb
├── rag-pipeline/             # Sample: RAG Pipeline
│   └── rag_pipeline.ipynb
└── ...                       # Other examples (not yet in catalog)
```

Each sample lives in its own directory under `examples/`. The `catalog/` subdirectory contains YAML files that register samples as catalog entries.

### Packaging and Installation

The built-in catalog and sample files are installed into Jupyter data directories through three mechanisms depending on context:

**1. Wheel install (`pip install`).** Kale's `pyproject.toml` uses `[tool.hatch.build.targets.wheel.shared-data]` — the same mechanism that installs the JupyterLab extension. Each sample directory is mapped explicitly:

```toml
[tool.hatch.build.targets.wheel.shared-data]
"examples/catalog" = "share/jupyter/kale/catalog"
"examples/base" = "share/jupyter/kale/samples/base"
"examples/titanic-ml-dataset" = "share/jupyter/kale/samples/titanic-ml-dataset"
# ... one entry per sample directory
```

Each new sample must be added here explicitly — the wheel build does not support globs.

**2. Development (`make dev`).** The Makefile symlinks catalog and sample directories into the first Jupyter data directory (via `jupyter_core.paths.jupyter_path()[0]`), using globs so new samples are picked up automatically without editing the Makefile.

**3. Container images.** The Dockerfile `COPY`s the `examples/` directory and installs catalog YAML and sample directories into `/opt/conda/share/jupyter/kale/`, also using globs.

### Discovery and Priority

The loader scans all directories returned by `jupyter_core.paths.jupyter_path()`, typically:

```
~/.local/share/jupyter/       # per-user (highest priority)
/usr/local/share/jupyter/     # system-wide
/usr/share/jupyter/           # system-wide (lowest priority)
```

Within each data directory, the loader looks for `kale/catalog/*.yaml` files and `kale/samples/<name>/` directories. YAML files are processed in alphabetical order; if two files in the same directory define entries with the same `id`, the alphabetically later file wins.

When the same `id` appears in multiple Jupyter data directories, **earlier directories in the `jupyter_path()` list take precedence** (per-user overrides system-wide). This allows user-level overrides of system-level examples.

### Materialization

When a user clicks a sample card:

1. The frontend calls `nb.check_sample_exists` to check if the sample was already materialized
2. If it exists, a **conflict dialog** is shown (Open Existing / Recreate / Cancel)
3. If it doesn't exist (or user chose Recreate), the frontend calls `nb.load_example`
4. The backend copies the sample directory to `<server_root>/kale-samples/<sample_id>/` using `shutil.copytree`
5. A `.kale-sample.json` provenance file is written with the sample id, source path, and timestamp
6. The backend returns the notebook path relative to `server_root`
7. The frontend opens the notebook via `docManager.openOrReveal(path)`

The materialization directory name defaults to `kale-samples` and can be overridden with the `KALE_MATERIALIZATION_DIR` environment variable. When `server_root` is not provided, the materialization base directory defaults to the user's home directory (`~`).

Materialization is **idempotent**: if the destination directory already exists, `copytree` is skipped (only the provenance stamp is updated). To get a fresh copy, the user must choose "Recreate" in the conflict dialog.

### Frontend Components

#### Launcher Integration

A JupyterLab command `kale:open-examples` is registered during plugin activation. If the `ILauncher` token is available (optional dependency), a launcher tile is added under the "Other" category with the Kale icon.

The `ExamplesDialog` is rendered via a `ReactWidget` attached to `document.body` as an MUI portal overlay. A module-level callback bridges the JupyterLab command to the React component's open state.

#### ExamplesDialog

A full-width MUI Dialog (`maxWidth="md"`, `height: 40vh`) containing:

- **Tag filter chips** at the top — "All" + one chip per unique tag across all entries. Clicking a tag filters the grid; clicking again (or "All") resets. Filters reset on dialog reopen.
- **Card grid** — responsive 2-column grid (`xs: 12, sm: 6`). Each card shows title, description (2-line clamp via CSS), difficulty badge (colored: green/orange/red), and tag chips.
- **Loading state** — centered `CircularProgress` while fetching the catalog.
- **Error state** — inline error message when catalog loading or materialization fails.
- **Empty state** — "No sample notebooks found." when the catalog is empty or filters match nothing.

#### ExampleCard

An MUI `Card` with `CardActionArea` showing:
- Title (`subtitle1`, `fontWeight: 600`)
- Description (2-line clamp via `-webkit-line-clamp`)
- Difficulty chip (colored background: beginner=green, intermediate=orange, advanced=red)
- Tag chips (outlined, small)
- Loading overlay with `CircularProgress` when the card is being materialized

All colors use JupyterLab CSS tokens (`--jp-success-color1`, `--jp-warn-color1`, `--jp-error-color1`, `--jp-border-color2`, etc.) for theme compatibility.

#### Conflict Dialog

A simple MUI Dialog with three buttons:
- **Cancel** — dismisses both dialogs
- **Open Existing** — calls `load_example` without recreating (skips `copytree`, updates provenance stamp, opens existing notebook)
- **Recreate** — deletes the existing copy and creates a fresh one

#### Sidebar Empty State Link

The `KaleEmptyState` component accepts an optional `onOpenExamples` callback. When provided, a "Browse examples" link is rendered at the bottom of the empty state. The `LeftPanel` passes a callback that executes the `kale:open-examples` command.

### Notes/Constraints/Caveats

1. **PyYAML dependency.** The catalog loader requires `pyyaml>=6.0`, added as a new runtime dependency.

2. **Materialization directory.** Samples are copied to `<server_root>/kale-samples/<sample_id>/`, not into the Jupyter data directory. This ensures they appear in the file browser and are writable by the user.

3. **Path traversal protection.** Both the loader and materializer validate that `assets.source`, `entrypoint.notebook`, and `sample_id` do not contain `..` or absolute path components.

4. **Provenance tracking.** Each materialized sample gets a `.kale-sample.json` file recording the source and timestamp. This enables future features like "update available" detection.

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Users modify materialized samples, then "Recreate" loses their work | Conflict dialog gives the choice; "Recreate" is clearly destructive |
| Catalog YAML schema changes break existing deployments | Loader skips files with unrecognized `kind` |
| Custom examples in system data dirs are overwritten by pip upgrades | User-level data dir has higher priority; document the override mechanism |

### Test Plan

- **Unit Tests (loader)**: Single example, empty dir, invalid YAML, missing required fields, missing sample dir, merge across files, merge across data dirs, priority ordering, path traversal rejection, wrong `kind` skipped, invalid difficulty
- **Unit Tests (materializer)**: Copy all files, provenance stamp, relative path return, sample not found, path traversal rejection, idempotent materialize, recreate replaces existing, server_root support, directory structure preservation
- **Unit Tests (RPC)**: `list_examples` response shape, `load_example` not found, `check_sample_exists` true/false
- **Integration**: End-to-end from YAML files on disk through RPC to materialized output

---

## Implementation Plan

| Phase | Feature | Description |
|-------|---------|-------------|
| 1 | Catalog YAML schema and loader | Define `ExamplesCatalog` kind, implement `discover_examples()` with validation, multi-dir merge, and priority |
| 2 | Materializer | Implement `materialize()`, `recreate()`, `check_existing()` with path safety, provenance, and server_root support |
| 3 | RPC endpoints | Add `list_examples`, `check_sample_exists`, `load_example` to `kale.rpc.nb` |
| 4 | Frontend: ExamplesDialog + ExampleCard | Card grid, tag filtering, loading/error/empty states |
| 5 | Frontend: Launcher + sidebar integration | Launcher tile via `ILauncher`, sidebar link via `KaleEmptyState` |
| 6 | Frontend: Conflict dialog | Detect existing materialization, offer Open Existing / Recreate / Cancel |
| 7 | Packaging | `pyproject.toml` shared-data, Makefile symlinks, Dockerfile COPY |
| 8 | Initial examples | Candies Sharing, Titanic ML Dataset, RAG Pipeline |
| 9 | Tests | Unit tests for loader, materializer, and RPC; validation edge cases |

---

## Migration

No migration needed. This is a purely additive feature:

- Existing Kale installations are unaffected — no APIs are changed or deprecated
- The feature activates when catalog YAML files are present in any Jupyter data directory
- Without catalog files, the launcher tile appears but shows "No sample notebooks found"

---

## Implementation History

- 2026-06-27: Initial KEP creation (reverse-engineered from implementation on `notebook-catalog` branch)

---

## Drawbacks

- Adds PyYAML as a runtime dependency (though it's already a transitive dependency of many Jupyter packages)
- Each new example directory must be added to `pyproject.toml` shared-data manually — the Makefile and Dockerfile use dynamic globs, but the wheel build does not
- The examples ship inside the Python wheel, increasing package size

---

## Alternatives Considered

### Alternative 1: Remote Catalog Service

Fetch example metadata from a remote API or registry (e.g., a GitHub API call to list examples from the repo).

**Rejected because**:
- Adds network dependency — fails in air-gapped environments common in enterprise Kubeflow deployments
- Requires authentication for private repos
- Adds latency to the dialog open flow
- Filesystem-driven approach is simpler and works everywhere

### Alternative 2: Git Clone for Materialization

Instead of copying files from the Jupyter data directory, clone a Git repository (or sparse checkout) into the workspace.

**Rejected because**:
- Requires Git to be installed in the notebook server image
- Network dependency for materialization
- More complex error handling (auth, network failures, large repos)
- Unnecessary for curated, versioned examples that ship with the package

### Alternative 3: Notebook Gallery as a Separate JupyterLab Extension

Build the catalog as a standalone JupyterLab extension, separate from Kale.

**Rejected because**:
- Loses integration with Kale's sidebar empty state
- Separate install/update lifecycle adds friction
- The catalog is Kale-specific (examples use Kale cell tags) — not a general-purpose gallery

### Alternative 4: Examples Bundled as Notebook Metadata

Store example metadata (title, description, tags) inside each notebook's `kubeflow_notebook` metadata section, then scan notebooks directly.

**Rejected because**:
- Requires scanning and parsing every `.ipynb` file in the samples directories — slower than YAML
- Mixes catalog metadata with notebook content
- Harder to override or customize per-deployment (would need to edit notebooks)

---

## Consequences

### Positive

- New users have a one-click path from installation to running their first pipeline
- Organizations can distribute team-specific examples by adding files to any Jupyter data directory
- The catalog serves as living documentation of Kale's capabilities
- Filesystem-driven design works in air-gapped and enterprise environments

### Negative

- Package size increases with each example added to the wheel
- Three places must be kept in sync when adding examples (pyproject.toml, Makefile symlinks, Dockerfile COPY)
- Materialized samples are disconnected from the source — no automatic updates when examples change

### Neutral

- The catalog is read-only — users cannot contribute examples back through the UI
- Examples are snapshots, not live-updating — users must recreate to pick up changes
