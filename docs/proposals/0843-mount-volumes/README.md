# KEP-0843: Mount PersistentVolumeClaims in Pipeline Steps

|                     |                                                    |
| ------------------- | -------------------------------------------------- |
| **Authors**         | [ada333](https://github.com/ada333)                |
| **Created**         | 2026-07-20                                         |
| **Status**          | Provisional                                        |
| **Relevant Issues** | https://github.com/kubeflow/kale/issues/843  https://github.com/kubeflow/kale/issues/856      |

## Table of Contents

- [Summary](#summary)
- [Motivation](#motivation)
  - [Goals](#goals)
  - [Non-Goals](#non-goals)
- [User Stories](#user-stories)
- [Background: How Kale Handles Data Today](#background-how-kale-handles-data-today)
- [Proposal](#proposal)
  - [Architecture](#architecture)
- [Design Details](#design-details)
  - [Frontend — Left Panel](#frontend--left-panel)
  - [Backend — Compiler](#backend--compiler)
  - [Backend — RPC](#backend--rpc)
  - [CLI](#cli)
  - [Notes/Constraints/Caveats](#notesconstraintscaveats)
  - [Risks and Mitigations](#risks-and-mitigations)
  - [Test Plan](#test-plan)
  - [Graduation Criteria](#graduation-criteria)
- [Implementation Plan](#implementation-plan)
- [Migration](#migration)
- [Implementation History](#implementation-history)
- [Drawbacks](#drawbacks)
- [Alternatives Considered](#alternatives-considered)
- [Consequences](#consequences)

---

## Summary

Add support for mounting Kubernetes PersistentVolumeClaims (PVCs) into Kale
pipeline step Pods via notebook metadata and the JupyterLab extension UI. Users
will be able to configure 0–N volumes per pipeline in the Left Panel sidebar.
The Kale compiler will add a `kfp.kubernetes.mount_pvc(...)` call for every
volume in notebook metadata on every pipeline step.

---

## Motivation

When running AI/ML workloads, large datasets and model artifacts are often
stored on high-performance storage exposed in Kubernetes as PVCs. Kale's
current KFP v2 code path (introduced in 2.x) does not support mounting PVCs
into pipeline step Pods. Users are forced to either:

1. Hand-edit the generated DSL to add `kubernetes.mount_pvc(...)` for every
   step after compilation, or
2. Route large data through Kale marshal + the KFP artifact store, which is
   inefficient for files that are already on a mounted filesystem.

Beyond inefficiency, pickle-based marshal has hard failure modes that a shared
PVC would avoid entirely:

- **Large datasets and models** — serializing and deserializing gigabyte-scale
  objects between steps is slow and often runs out of memory or artifact store
  quota.
- **Non-serializable Python objects** — database connections, file handles, and
  certain framework objects (e.g. some model classes) cannot be pickled at all;
  passing them via a shared path sidesteps the problem.
- **Ephemeral shared state** — scratch space written by one step and consumed
  by the next (e.g. a temporary data store or checkpoint directory) has no
  natural representation as a KFP artifact.

Kale 1.x had a volumes feature using KFP v1 APIs (`VolumeOp`, `PipelineVolume`,
`add_pvolumes`). All of those APIs were removed in KFP v2. This KEP revives the
volumes feature using the current `kfp-kubernetes` extension library.

### Goals

1. Let users configure 0–N volumes (PVC name + mount path) per pipeline in the
   JupyterLab Left Panel sidebar.
2. Persist that configuration in notebook metadata.
3. Have the Kale compiler emit `kubernetes.mount_pvc(...)` for every step in
   the generated KFP v2 pipeline.
4. Optionally pre-fill volumes from the PVCs already mounted on the running
   notebook Pod ("use this notebook's volumes").
5. Show a combobox of available PVCs in the namespace (with suggestions from the
   cluster) alongside free-text input, always accessible regardless of API availability.

### Non-Goals

- Per-step volume selection — all steps receive the same set of volumes in v1.
- Automatically ordering parallel steps that share files on a PVC.
- Creating new PVCs from the Kale UI (`new_pvc`, `VolumeOp`) — mount existing
  PVCs only.
- Using PVCs as the Kale marshal transport — marshal continues to use KFP
  artifacts.
- Making PVC existence a hard compiler requirement — offline/CI compile must
  still work.

---

## User Stories

### Story 1: Notebook volume available in pipeline

A user creates a notebook in Kubeflow and mounts a PVC named `my-data` at
`/data` via the Kubeflow UI. Code in the notebook reads from `/data` fine.
When they compile a Kale pipeline, the step Pods do not have `/data` mounted
and the pipeline fails.

With this feature, the user clicks "Use notebook volumes" in the Volumes panel.
Kale calls the existing `nb.list_volumes` RPC, detects that `my-data` is
mounted at `/data`, and pre-populates a volume entry. All pipeline steps then
get `my-data` mounted at `/data`.

### Story 2: Mount an arbitrary PVC

A user knows their training data lives on PVC `training-data`. Their notebook
does not have it mounted. They open the Volumes panel, click "Add Volume",
select `training-data` from the PVC dropdown (or type it manually), set mount
path `/data`, and compile. All pipeline steps get `training-data` mounted at
`/data`.

### Story 3: Multiple volumes on all steps

A user needs datasets at `/data` (PVC `datasets`) and wants to write model
checkpoints to `/models` (PVC `model-store`). They add two volume entries. Both
PVCs are mounted at both paths on every step.

```python
# Inside a pipeline step — just normal file I/O, no Kale API needed
df = pd.read_csv("/data/train.csv")       # reads from datasets PVC
model.save("/models/checkpoint.pt")       # writes to model-store PVC
```

---

## Background: How Kale Handles Data Today

### Two data paths

Today Kale has one mechanism for moving data between pipeline steps. This KEP
introduces a second. They serve different purposes:

| Mechanism | For what | How data moves |
|-----------|----------|----------------|
| **Kale marshal + KFP artifacts** (existing) | Python variables between steps (`ins`/`outs`) | serialize → object store → deserialize |
| **PVC mounts (this KEP)** | Files on a shared filesystem (`/data/...`) | mounted volume; code uses paths directly |

These two paths are complementary, not competing. Once this KEP is implemented,
a step can simultaneously read `/data/train.csv` from a PVC and pass a
processed `DataFrame` to the next step via Kale's normal marshal mechanism.

### Why PVCs?

The KFP artifact store round-trip (serialize → upload → download → deserialize)
is negligible for small objects but expensive for large datasets, model
checkpoints, or files that are already on disk in the right format. A PVC mount
avoids that cost entirely: step B opens the same file step A wrote, with no
intermediate copy.

### Kale 1.x volumes (historical reference)

Kale 1.x had a full volumes feature using KFP v1 APIs:
- `dsl.PipelineVolume(pvc=...)` — reference an existing PVC
- `dsl.VolumeOp(...)` — create a new PVC for the run
- `task.add_pvolumes({mount_path: volume})` — attach all volumes to every step

The same volumes dict was applied to all steps. Per-step selection was not
supported.

Additionally, Kale 1.x used a marshal PVC (mounted at `/marshal`) as the
transport for inter-step variable passing, and integrated with Arrikto Rok for
snapshotting notebook PVCs before cloning them into pipeline steps. Both the
KFP v1 volume APIs and Rok were removed during the KFP v2 migration.

The data model (`VolumeConfig`, `PipelineConfig.volumes`) still exists in the
codebase but is not wired into the active KFP v2 compiler.

### KFP v2 volume mounting

KFP v2 uses the `kfp-kubernetes` extension for Kubernetes-specific Pod
configuration. Mounting a PVC looks like:

```python
from kfp import kubernetes

task = my_step()
kubernetes.mount_pvc(task, pvc_name="my-data", mount_path="/data")
```

Under the hood, `mount_pvc` appends a `PvcMount` protobuf message to the
task's `PlatformSpec`. At runtime, the KFP backend driver reads that spec and
patches the about-to-launch Pod with the corresponding `Volume` and
`VolumeMount` before the step container starts.

---

## Proposal

### Architecture

1. The user configures volumes in the **Left Panel → Volumes section** of the
   Kale UI.
2. The UI writes those entries into **`notebook metadata.volumes[]`** (saved in
   the notebook's cell metadata).
3. At compile time, the Kale backend reads the metadata and populates
   **`PipelineConfig` / `VolumeConfig`** (`backend/kale/pipeline.py`).
4. The compiler passes the volume list to **`pipeline_template.jinja2`**,
   which renders a `kubernetes.mount_pvc(...)` call for every step task in the
   generated pipeline.

Volumes are **pipeline-level** configuration. The same set of mounts is applied
to every step — consistent with Kale 1.x behavior and the dominant use case
(shared datasets available to all steps).



---

## Design Details

### Frontend — Left Panel

A new **Volumes** section is added directly to the Left Panel, alongside
Pipeline Metadata.

```
Kale Deployment Panel
├── Pipeline Metadata  (experiment, name, description, docker image)
├── Volumes                                    ← NEW
│   ├── [ + Add Volume ]
│   ├── Volume 1: [ PVC dropdown/input ] [ /data   ] [×]
│   └── Volume 2: [ PVC dropdown/input ] [ /models ] [×]
└── Deploy button / progress
```

**Interactions:**

| Action | Behaviour |
|--------|-----------|
| Add Volume | Appends a blank `{ name: '', mount_point: '' }` entry to `metadata.volumes` |
| Remove (×) | Drops that entry from the list |
| PVC field | Combobox — free-text input with suggestions populated from `list_pvcs` RPC; suggestions are shown when available but typing a name manually always works |
| Mount path | Free-text; must be unique across entries |
| "Use notebook volumes" button | Calls the existing `nb.list_volumes` RPC and pre-fills entries from the notebook Pod's own PVC mounts; logs each added volume (name + mount point) to the browser console so the user can see exactly what was detected |

**Light UI validation (warn, never block compile):**
- Duplicate mount paths across entries
- PVC name not found in the combobox suggestions
- Empty PVC name or mount path when the other field is set

Volumes are stored in `metadata.volumes` and saved to notebook metadata on
every change, matching the pattern used by other pipeline metadata fields.

### Backend — Compiler

`pipeline_template.jinja2` is extended to emit `mount_pvc` calls when
`volumes` is non-empty. The `volumes` field already exists in
`VolumeConfig` / `IKaleNotebookMetadata`; for v1, only `name`,
`mount_point`, and `type: "pvc"` are required:

```json
{
  "kubeflow_notebook": {
    "pipeline_name": "my-pipeline",
    "volumes": [
      { "name": "my-data-pvc",   "mount_point": "/data",   "type": "pvc" },
      { "name": "my-models-pvc", "mount_point": "/models", "type": "pvc" }
    ]
  }
}
```

The template renders a `kubernetes.mount_pvc(...)` call for every step task:

```python
from kfp import dsl, kubernetes

@dsl.pipeline(name="my-pipeline")
def auto_generated_pipeline():
    task1 = step_one_step(...)
    kubernetes.mount_pvc(task1, pvc_name="my-data-pvc",   mount_path="/data")
    kubernetes.mount_pvc(task1, pvc_name="my-models-pvc", mount_path="/models")

    task2 = step_two_step(...)
    kubernetes.mount_pvc(task2, pvc_name="my-data-pvc",   mount_path="/data")
    kubernetes.mount_pvc(task2, pvc_name="my-models-pvc", mount_path="/models")
```

`PipelineConfig.volumes` is wired through `nbprocessor.py` into the compiler
path. Today this field is populated from notebook metadata but is never passed
to `pipeline_template.jinja2` — adding that wiring is part of this KEP.

`kfp-kubernetes` is already declared as a dependency
(`kfp[kubernetes]>=2.16.0`); no new package is needed.

### Backend — RPC

The Left Panel's PVC dropdown needs to show which PVCs exist in the cluster
namespace. Rather than calling the Kubernetes API directly from the frontend,
the UI calls a new backend RPC that wraps the API call and handles auth/errors
in one place — consistent with how other cluster resources (e.g.
`list_volumes`, `list_notebooks`) are already exposed.

`list_pvcs` is added to `backend/kale/rpc/nb.py`:

```python
def list_pvcs(request):
    """List all PVCs in the current namespace."""
```

Returning an empty list on failure means the combobox shows no suggestions,
but the user can still type a PVC name manually.

The existing `nb.list_volumes` RPC (which returns PVCs mounted on the notebook
Pod) is reused as-is for the "Use notebook volumes" button.

### CLI

No new flags are required for v1. Volumes come from notebook metadata written by
the UI:

```bash
kale --nb my_notebook.ipynb
```

The existing `--storage-class-name` and `--volume-access-mode` flags are
deferred — they only apply to PVC creation, which
is out of scope for v1.

### Notes/Constraints/Caveats

1. **All volumes on all steps.** Every configured volume is mounted on every
   step Pod, even if a step never opens a file at that path. Unused mounts add
   negligible overhead (no data is copied; the kernel simply registers the
   mount). Per-step selection is deferred to a future iteration.

2. **PVC access modes are set in Kubernetes, not by Kale.** Whether a PVC is
   `ReadWriteOnce`, `ReadWriteMany`, or `ReadOnlyMany` is determined when the
   PVC is created — via `kubectl`, the Kubeflow UI, or a storage provisioner.
   Kale only mounts existing PVCs; it cannot change or inspect their access
   mode. The user is responsible for choosing the right storage class when
   creating the PVC.

3. **No automatic step ordering for file-only dependencies.** KFP schedules
   steps in parallel whenever the DAG allows it. Shared PVC files are invisible
   to the scheduler. When two steps share data only via a volume (no Kale
   variable edge between them), the user must either introduce a variable
   dependency or manually add `.after()` in the generated DSL. This is an edge
   case — in tagged notebooks, most ordering is already implied by variable
   flow.

4. **RWO volumes and parallel steps.** A `ReadWriteOnce` (RWO) PVC can
   typically be mounted read-write by only one node at a time. If the scheduler
   places parallel steps on different nodes, the second Pod may fail to attach
   the volume. Users with large datasets should prefer `ReadWriteMany` (RWM)
   storage classes for shared pipeline data.

5. **PVC existence is not checked at compile time.** A missing or
   wrong-namespace PVC causes the step Pod to fail at runtime with a standard
   Kubernetes mount error surfaced in the KFP UI. This is intentional: offline
   and CI compile must work without cluster access. No runtime pre-check is
   performed today either — see Open Questions.

6. **Marshalling is unchanged.** Kale variable passing between steps (`ins`/`outs`)
   continues to use the marshal + KFP artifact store path. PVCs are not the
   marshal transport.

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| RWO volume blocks parallel step Pod scheduling | Document clearly; recommend RWM storage class for shared datasets (see Open Question 3) |
| Concurrent writers corrupt shared files | Document; rely on DAG ordering or user-added `.after()` in DSL |
| Missing PVC causes step Pod failure at runtime | Soft UI warning for unknown PVC names; standard Kubernetes error surfaced in KFP UI (see Open Question 2) |
| No K8s API access breaks PVC dropdown | Combobox shows no suggestions but free-text entry still works; empty `list_pvcs` return on any exception |
| RBAC prevents `list` PVCs in namespace | Same fallback; no hard dependency on listing |
| `kfp-kubernetes` import added unconditionally | Import only when `volumes` is non-empty in the template |

### Test Plan

- **Unit tests** (`test_rpc_nb.py`): `list_pvcs` returns the correct PVC names
  with a mocked Kubernetes client; returns an empty list on API error.
  `list_volumes` pre-fill populates entries matching the notebook Pod's mounts.
- **Unit tests**: `VolumeConfig` parsing (name, mount point, type); template
  rendering with 0, 1, and N volumes; duplicate mount path detection; empty
  volume list produces no `mount_pvc` calls.
- **UI tests** (Playwright, `kale-ui-components.spec.ts`): Volumes section
  renders in the Left Panel; Add/Remove volume rows; combobox accepts free-text
  input; "Use notebook volumes" button pre-fills entries.
- **Golden-file tests**: compiled pipeline YAML compared against expected output
  for a notebook with configured volumes.
- **E2E tests**: compile a notebook with one PVC configured; run on a Kubeflow
  cluster with the PVC present; verify the step Pod mounts the volume and code
  can read/write the expected path - could be addition to the already existing e2e test.

### Graduation Criteria

- Volumes panel functional in the Left Panel (add, remove, pre-fill).
- Compiled pipeline YAML contains `kubernetes.mount_pvc(...)` for every
  configured volume on every step.
- Works end-to-end on a Kubeflow cluster with a real PVC.
- Unit,UI and e2e tests passing in CI.
- RWO/RWM caveats and parallel-step guidance documented.

---

## Implementation Plan

| Phase | Area | Work |
|-------|------|------|
| 1 | Backend | Wire `PipelineConfig.volumes` through `nbprocessor.py` into the new compiler path |
| 1 | Backend | Extend `pipeline_template.jinja2` to emit `kubernetes.mount_pvc(...)` per step |
| 1 | Backend | Add `list_pvcs` RPC in `rpc/nb.py` using existing `k8sutils.get_v1_client()` |
| 2 | Frontend | Add Volumes section to Left Panel; add/remove rows; save to `metadata.volumes` |
| 2 | Frontend | PVC combobox with suggestions from `list_pvcs` RPC; free-text always available |
| 2 | Frontend | "Use notebook volumes" button wired to existing `nb.list_volumes` RPC |
| 2 | Frontend | Light validation (duplicate paths, empty fields, unknown PVC name) |
| 3 | Tests | Unit + UI + golden-file + E2E tests |
| 3 | Docs | Update README; note RWO/parallel caveats and `.after()` workaround |

---

## Migration

No migration needed. The `volumes` field already exists in `VolumeConfig` and
`IKaleNotebookMetadata` with a compatible shape from Kale 1.x. Notebooks
without a `volumes` key in metadata compile exactly as before (empty list, no
`mount_pvc` calls emitted).

---

## Implementation History

- 2026-07-20: Initial KEP creation

---

## Drawbacks

- All steps receive all configured mounts regardless of whether they use the
  files. This is consistent with Kale 1.x but may be surprising to users who
  expect isolation between steps.
- Adds `from kfp import kubernetes` to generated pipelines that use volumes,
  making those pipelines non-portable to non-Kubernetes backends (acceptable
  since Kale targets Kubeflow on Kubernetes).

---

## Alternatives Considered

### Alternative 1: Per-step volume selection

Allow users to tag individual steps (via cell metadata) with which PVC mounts
they should receive.

**Rejected because**: significantly more complex UI (per-cell volume editor) and
compiler (step-level mount logic) for a v1 feature. Pipeline-wide mounts cover
the dominant use case (shared datasets available to all steps). Per-step
selection can be added later as an opt-in refinement without breaking the
pipeline-wide default.

### Alternative 2: Auto-add `.after()` between all steps sharing a PVC

Automatically serialize all steps that mount the same PVC to eliminate file
races.

**Rejected because**: with pipeline-wide mounts, every step mounts every PVC.
Auto-`.after()` would force all steps into a single chain, eliminating real
parallelism (e.g., two independent steps that both read from `/data` but never
write). Ordering is the user's responsibility when they share files via a
volume without a Kale variable edge.

### Alternative 3: Marshal data over a PVC instead of the artifact store

Route Kale variable passing (`ins`/`outs`) through a shared marshal PVC rather
than the KFP artifact store, as Kale 1.x did.

**Rejected because**: KFP v2 artifact passing is the supported, portable,
cache-aware model. PVCs for marshal require cluster-specific storage
(particularly RWM), couple data passing to Kubernetes storage classes, and lose
caching and lineage tracking. PVCs for user data (this KEP) and artifacts for
Kale variables are complementary.

### Alternative 4: Rok clone / snapshot for notebook volumes

Snapshot the notebook Pod's PVCs and mount clones into pipeline steps (as Kale
1.x did with Arrikto Rok).

**Rejected because**: Rok was removed in #460 and is no longer a dependency.
For the "use this notebook's volumes" case, mounting the same existing PVC
directly is simpler and sufficient for RWM volumes. RWO contention with the
running notebook is a known limitation, documented in the caveats.

---

## Consequences

### Positive

- Users can read/write large datasets in pipeline steps without the
  serialize/deserialize overhead of the KFP artifact store.
- The "PVC works in my notebook but not my pipeline" problem (User Story 1) is
  addressed.
- Consistent with the KFP v2 / `kfp-kubernetes` recommended pattern for
  Kubernetes-specific Pod configuration.
- Reuses existing Kale data model (`VolumeConfig`) and Kubernetes client
  infrastructure (`k8sutils`, `podutils`).
- No new dependencies — `kfp-kubernetes` is already declared.

### Negative

- All steps get all mounts regardless of use — minor overhead; potential
  confusion if a user adds a sensitive PVC expecting only specific steps to
  see it.
- RWO volumes and parallel steps require user awareness of Kubernetes storage
  semantics.

### Neutral

- Kale marshal + artifact store path is unchanged. This KEP does not affect
  variable passing between steps.
- The generated pipeline YAML is Kubernetes-specific (uses `PlatformSpec`).
  This is already the case for other `kfp-kubernetes` features in Kale.

---

## Open Questions

1. **Should deprecated volume-creation flags be deleted?**
   The `--storage-class-name` and `--volume-access-mode` flags are currently
   deferred as out of scope for v1 (they only apply to PVC creation). Should
   they be removed from the codebase now to avoid confusion, or left in place
   in case PVC creation support is added in a future version?

2. **Should there be a runtime pre-flight PVC check?**
   Currently a missing or wrong-namespace PVC would only surface as a Kubernetes
   mount error when the step Pod is scheduled — the error message is not
   user-friendly. A runtime check could give a clearer error earlier. Two
   approaches are possible:
   - A **dedicated first step** in the generated pipeline that calls the
     Kubernetes API to verify all configured PVCs exist before any compute
     steps run.
   - An **init container** injected into every step Pod via `kfp-kubernetes`
     that checks its own mounts before the main container starts.
   Is the improved error message worth the added complexity and latency?

3. **Should Kale warn users about RWO volumes and parallel steps?**
   If a user configures a `ReadWriteOnce` PVC and the pipeline has parallel
   steps, there is a risk that two Pods land on different nodes and one fails
   to attach the volume. Kale can detect this situation at compile time (it
   knows which steps are parallel and that a PVC is configured). Should it
   emit a warning — and if so, where? Options:
   - A compile-time warning printed to the console / surfaced in the UI.
   - A UI warning in the Volumes panel when parallel steps are present.
   - No warning; document the caveat and rely on the user to choose the right
     storage class.
