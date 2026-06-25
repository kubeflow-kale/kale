# Installation

This page walks you through the prerequisites, installation options, and a
quick sanity check for a working Kale setup.

## Prerequisites

| Requirement        | Version            | Notes                                                                                   |
| ------------------ | ------------------ | --------------------------------------------------------------------------------------- |
| Python             | 3.11 or later      | Kale uses modern typing features; older Pythons are not supported.                      |
| Kubeflow Pipelines | **v2.16.0+**       | Older KFP servers reject the `securityContext` field Kale emits for step pods.          |
| Kubernetes cluster | any                | `minikube`, `kind`, Docker Desktop, or a managed cluster all work.                      |
| JupyterLab         | 4.0+ (for the UI)  | Only required if you want to use the Kale side panel inside JupyterLab.                 |

Install KFP by following the
[official Kubeflow Pipelines installation guide](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/).
Make sure to set `PIPELINE_VERSION=2.16.0` or later. If you are upgrading an
older environment, ensure your Python deps include `kfp[kubernetes]>=2.16.0`.

## Install from PyPI

```{admonition} Kale v2.0 pre-release
:class: important

Kale v2.0 is available on PyPI as a release candidate. Install it with the
`--pre` flag until the final release is tagged.
```

```bash
pip install --pre "jupyterlab>=4.0.0" "kubeflow-kale[jupyter]"
jupyter lab
```

## Install from source

Clone the repository and use the `make` targets provided by the project:

```bash
git clone https://github.com/kubeflow/kale.git
cd kale

make dev      # Install Python + Node deps, build and link the labextension
make jupyter  # Start JupyterLab with the Kale panel
```

`make dev` takes care of:

- Installing [uv](https://github.com/astral-sh/uv) if it is not already present.
- Running `uv sync --all-extras` to create the virtual environment and install
  the Python package in editable mode.
- Building the JupyterLab 4 extension and linking it so it appears in your
  JupyterLab UI.
- Installing pre-commit hooks for linting.

See [Contributing](../contributing.md) for a full breakdown of the available `make` targets
and the development workflow.

## Try Kale in Docker (no cluster required)

If you just want to play with Kale in an isolated environment, the repo ships
with a Dockerfile based on the official Kubeflow `jupyter-scipy` image:

```bash
make docker-build   # Build Kale wheels and bake them into the image
make docker-run     # Start JupyterLab on http://localhost:8889
```

To also connect to a KFP cluster, follow the multi-terminal setup in
[Running Pipelines](../user-guide/running-pipelines.md).

## Verify your installation

1. **Start a cluster and KFP port-forward** (minikube example):

   ```bash
   minikube start
   kubectl port-forward -n kubeflow svc/ml-pipeline-ui 8080:80
   ```

2. **Test the CLI** against an example notebook:

   ```bash
   kale --nb examples/base/candies_sharing.ipynb \
        --kfp_host http://127.0.0.1:8080 \
        --run_pipeline
   ```

   This compiles the notebook into `.kale/<name>.kale.py`, uploads the
   pipeline, and starts a run.

3. **Test the JupyterLab extension**:
   - Open JupyterLab (`make jupyter` or `jupyter lab`).
   - Open any notebook from `examples/base/`.
   - Click the Kale icon in the left sidebar.
   - Toggle the Kale panel on — you should see cell type dropdowns appear on
     each notebook cell.

If any of these steps fail, head to [Troubleshooting](../user-guide/troubleshooting.md) — the
most common issues are covered there.
