# Kale ROADMAP

## Second half of 2026 and beyond

### Notebook Experience

- Composable Kale Notebooks (GSoC 2026): https://github.com/kubeflow/kale/issues/812
- Searchable runtime image dropdown with defaults for per-step image selection: https://github.com/kubeflow/kale/issues/574
- Built-in Kale example notebooks in the Launcher: https://github.com/kubeflow/kale/issues/607
- Support KFP control flow: conditions, loops, and exit handlers: https://github.com/kubeflow/kale/issues/857
- Better notebook validation: https://github.com/kubeflow/kale/issues/560
- Auto include output parameters on a step if the last parameter is a variable: https://github.com/kubeflow/kale/issues/783
- Allow users to hide the HTML Report https://github.com/kubeflow/kale/issues/885

### Kubeflow SDK Integration

- Migrate Kale from KFP SDK to Kubeflow SDK: https://github.com/kubeflow/kale/issues/851
- MVP of Kale integration with Kubeflow Trainer: https://github.com/kubeflow/kale/issues/854
- MVP of Kale integration with MLflow: https://github.com/kubeflow/kale/issues/853

### Pipeline Execution

- Support KFP Pipeline Workspace for inter-step data passing via shared PVC: https://github.com/kubeflow/kale/issues/856
- Add a way to mount volumes in pipeline steps: https://github.com/kubeflow/kale/issues/843
- Imports and pip packages installation should not be always included: https://github.com/kubeflow/kale/issues/782
- Support Run a pipeline DSL or pipeline YAML: https://github.com/kubeflow/kale/issues/778
- Add CLI support to compile notebooks to native Kubernetes manifests for GitOps/CI/CD: https://github.com/kubeflow/kale/issues/799

### KFP Server Integration

- Integrate with KFP server: list runs and pipeline information directly from Notebook: https://github.com/kubeflow/kale/issues/855
- In-notebook experiment tracking: runs, metrics, and comparison without leaving JupyterLab: https://github.com/kubeflow/kale/issues/852

### Frontend

- Refactor labextension React components from class to functional with hooks: https://github.com/kubeflow/kale/issues/648

### Project Health and Hardening

- Comply with Kubeflow incubating maturity requirements: https://github.com/kubeflow/kale/issues/848
- Set Kale as Default Kubeflow Notebook Image: https://github.com/kubeflow/kale/issues/577
- Support KALE_KFP_NAMESPACE for configurable KFP server namespace: https://github.com/kubeflow/kale/issues/798
- Support KALE_PYPI_PROD_URL for configurable production PyPI index: https://github.com/kubeflow/kale/issues/797

### Delivered

#### Q2 2026 — v2.0.0, v2.1.0, v2.1.1

- Render labels and annotations in KFP DSL output: https://github.com/kubeflow/kale/pull/764
- Configurable default base image for steps: https://github.com/kubeflow/kale/pull/802
- Make security context configurable by environment variables: https://github.com/kubeflow/kale/pull/788
- Allow users to set a relative path to save compiled Pipeline DSL: https://github.com/kubeflow/kale/pull/646
- Refactor Left Panel to functional components: https://github.com/kubeflow/kale/pull/750
- Migrate status and metadata classes to functional components: https://github.com/kubeflow/kale/pull/722
- RAG with Langchain example: https://github.com/kubeflow/kale/pull/784
- Fix metrics flag only set on steps that have assigned metrics: https://github.com/kubeflow/kale/pull/796
- Configurable KFP server endpoint: https://github.com/kubeflow/kale/pull/702
- Comprehensive Sphinx documentation site: https://github.com/kubeflow/kale/pull/756

#### Q1 2026 — v2.0.0 (pre-releases)

- Per-step runtime image selection: https://github.com/kubeflow/kale/pull/571
- GPU limit configuration on pipeline steps: https://github.com/kubeflow/kale/pull/573
- Pipeline component caching (enable/disable per step or whole pipeline): https://github.com/kubeflow/kale/pull/631
- Native JupyterLab toolbar Compile and Run commands: https://github.com/kubeflow/kale/pull/611
- KFP v2 metrics support: https://github.com/kubeflow/kale/pull/665
- Pod Security Standards baseline (security context): https://github.com/kubeflow/kale/pull/656
- Upgrade to KFP SDK 2.16.0: https://github.com/kubeflow/kale/pull/651
- KFP status icon in sidebar: https://github.com/kubeflow/kale/pull/645
- JupyterLab settings panel (enable by default, auto-save on compile/run): https://github.com/kubeflow/kale/pull/685
- Download button for compiled pipeline file: https://github.com/kubeflow/kale/pull/601
- Allow code blocks to have the same name for input and output objects: https://github.com/kubeflow/kale/pull/543
- Display default base image in cell metadata UI: https://github.com/kubeflow/kale/pull/593
- Notebook name as default pipeline name: https://github.com/kubeflow/kale/pull/524
- Better empty state for Left Panel: https://github.com/kubeflow/kale/pull/596
- AST-based import parsing (replacing string-based detection): https://github.com/kubeflow/kale/pull/592
- Merged backend and labextension into single `kubeflow-kale` package: https://github.com/kubeflow/kale/pull/670
- GitHub Actions release workflow and tooling: https://github.com/kubeflow/kale/pull/673
- E2E test infrastructure with KFP: https://github.com/kubeflow/kale/pull/532
- UI test framework (Playwright): https://github.com/kubeflow/kale/pull/660
- Migrated to uv + Makefile for development workflow: https://github.com/kubeflow/kale/pull/544
- Ruff linter and pre-commit hooks: https://github.com/kubeflow/kale/pull/580

## 2025

### Q4 2025 — JupyterLab 4.x extension

- Modernized JupyterLab 4.x extension merged into main: https://github.com/kubeflow/kale/pull/479
- Dark theme support: https://github.com/kubeflow/kale/pull/517
- Configurable pip trusted hosts: https://github.com/kubeflow/kale/pull/536
- KFP artifacts generation: https://github.com/kubeflow/kale/pull/518
- Python 3.11+ CI support: https://github.com/kubeflow/kale/pull/505

### Q3 2025 — Development restart

- KFP v2 backend rewrite: https://github.com/kubeflow/kale/pull/447
- Removed legacy Rok and MLMD utils: https://github.com/kubeflow/kale/pull/460
