<p align="center">
<img alt="Kale Logo" src="https://raw.githubusercontent.com/kubeflow-kale/kale/master/docs/imgs/kale_logo.png" height="130">
</p>
<p align="center">
<a href="#">
  <img alt="GitHub License" src="https://badgen.net/github/license/kubeflow-kale/kale">
</a>
<a target="_blank" href="https://pypi.org/project/kubeflow-kale/">
    <img alt="PyPI Version" src="https://badgen.net/pypi/v/kubeflow-kale">
</a>
<a target="_blank" href="https://www.npmjs.com/package/jupyterlab-kubeflow-kale">
  <img alt="npm Version" src="https://badgen.net/npm/v/jupyterlab-kubeflow-kale">
</a>
<a target="_blank" href="https://github.com/kubeflow/kale/actions">
  <img alt="Kale CI Workflow Status" src="https://github.com/kubeflow/kale/workflows/CI/badge.svg">
</a>
</p>

---

> [!NOTE]
> ## Project Status Update 🚀
>
> After several years of inactivity, we’re excited to announce that Kale development has restarted! 🎉
> Kale was widely appreciated by the community back in the day, and our current goal is to re-establish a solid baseline by updating all components to the latest versions and ensuring full compatibility with the most recent Kubeflow releases.
>
> See all details in the [**Road to 2.0 issue**](https://github.com/kubeflow-kale/kale/issues/457)




KALE (Kubeflow Automated pipeLines Engine) is a project that aims at simplifying
the Data Science experience of deploying Kubeflow Pipelines workflows.

Kubeflow is a great platform for orchestrating complex workflows on top of
Kubernetes, and Kubeflow Pipelines provide the means to create reusable components
that can be executed as part of workflows. The self-service nature of Kubeflow
makes it extremely appealing for Data Science use, at it provides an easy access
to advanced distributed jobs orchestration, re-usability of components, Jupyter
Notebooks, rich UIs and more. Still, developing and maintaining Kubeflow
workflows can be hard for data scientists, who may not be experts in working
orchestration platforms and related SDKs. Additionally, data science often
involve processes of data exploration, iterative modelling and interactive
environments (mostly Jupyter notebook).

Kale bridges this gap by providing a simple UI to define Kubeflow Pipelines
workflows directly from your JupyterLab interface, without the need to change a
single line of code.

See the `Kale v2.0 Demo` video at the bottom of the `README` for more details.

Read more about Kale and how it works in this Medium post:
[Automating Jupyter Notebook Deployments to Kubeflow Pipelines with Kale](https://medium.com/kubeflow/automating-jupyter-notebook-deployments-to-kubeflow-pipelines-with-kale-a4ede38bea1f)

## Getting started

### Requirements

- **Python 3.11+**
- **Kubeflow Pipelines v2.16.0+**
     - The `securityContext` field in the Kubernetes executor config is not recognized by older KFP servers (`kfp[kubernetes] < 2.16.0`), causing pipeline submission to fail.
     - Install KFP as recommended in the official [Kubeflow Pipelines Installation](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/) documentation (make sure to set `PIPELINE_VERSION=2.16.0` or later)
     - If you are upgrading from an earlier version, make sure you have `kfp[kubernetes]>=2.16.0` in your dependencies along with `kfp>=2.0.0`
- A Kubernetes cluster (`minikube`, `kind`, or any K8s cluster)

### Installation

> [!IMPORTANT]
> **Kale v2.0 is not yet released on PyPI.** Until then, install from source:

```bash
git clone https://github.com/kubeflow-kale/kale.git
cd kale
make dev      # Set up development environment
make jupyter  # Start JupyterLab
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup instructions.

Once v2.0 is released, you'll be able to install from PyPI:

```bash
pip install "jupyterlab>=4.0.0" kubeflow-kale[jupyter]
jupyter lab
```

### Verify installation

1. **Start your Kubernetes cluster and KFP:**
   ```bash
   minikube start
   kubectl port-forward -n kubeflow svc/ml-pipeline-ui 8080:80
   ```

2. **Test the CLI:**
   ```bash
   kale --nb examples/base/candies_sharing.ipynb --kfp_host http://127.0.0.1:8080 --run_pipeline
   ```
   This generates a pipeline in `.kale/` and submits it to KFP.

3. **Test the JupyterLab extension:**
   - Open JupyterLab (`make jupyter` or `jupyter lab`)
   - Open a notebook from `examples/base/`
   - Click the Kale icon in the left panel
   - Enable the Kale panel with the toggle

<img alt="Kale JupyterLab Extension" src="docs/imgs/Extension.png"/>

## Docker (Local Testing)

You can test Kale in a Kubeflow-like notebook environment using Docker. The image
is based on the official Kubeflow notebook image (`jupyter-scipy`) with Kale
pre-installed.

```bash
make docker-build   # Build wheels + Docker image
make docker-run     # Start JupyterLab on http://localhost:8889
```

To connect to a KFP cluster, run these in separate terminals:

```bash
# Terminal 1: Serve the dev wheel (so compiled pipelines can install Kale)
make kfp-serve

# Terminal 2: Port-forward the KFP API
kubectl port-forward -n kubeflow svc/ml-pipeline 8080:8888

# Terminal 3: Start the container
make docker-run
```

`make docker-run` automatically configures:
- **KFP API** via `host.docker.internal` (works on macOS, Windows, and Linux)
- **KFP UI links** pointing to `localhost:8080` (so pipeline links open in your browser)
- **Wheel server** connectivity for compiled pipelines

## KFP Server Configuration

Kale stores connection settings in `~/.config/kale/kfp_server_config.json` while keeping credentials secure. **Tokens and secrets are never saved to disk** — only references to environment variables or file paths are stored.

### Quick Setup

**Using environment variables (recommended):**
```bash
# Set your token
export KF_PIPELINES_TOKEN=your-token-here

# Configure Kale to use it
python -c "
from kale.config import kfp_server_config
kfp_server_config.save_config({
    'host': 'http://ml-pipeline.kubeflow:8888',
    'auth_type': 'existing_bearer_token',
    'auth_config': {'env_var': 'KF_PIPELINES_TOKEN'}
})
"
```

**Using Kubernetes mounted secrets:**
```python
from kale.config import kfp_server_config

kfp_server_config.save_config({
    "host": "http://ml-pipeline.kubeflow:8888",
    "auth_type": "existing_bearer_token",
    "auth_config": {"file_path": "/var/run/secrets/kfp-token"}
})
```

### Authentication Types

| Type | Description | Config Example |
|------|-------------|----------------|
| `none` | No authentication | `{"auth_type": "none"}` |
| `existing_bearer_token` | Bearer token | `{"auth_type": "existing_bearer_token", "auth_config": {"env_var": "KF_PIPELINES_TOKEN"}}` |
| `dex` | DEX cookies | `{"auth_type": "dex", "auth_config": {"env_var": "KF_PIPELINES_COOKIES"}}` |
| `kubernetes_service_account_token` | K8s service account | `{"auth_type": "kubernetes_service_account_token", "auth_config": {"token_path": "/var/run/secrets/kubernetes.io/serviceaccount/token"}}` |

**Security:** Configuration stores only references (`env_var`, `file_path`), never actual credentials. Tokens are read fresh from the environment or filesystem at runtime.

## Cell Types

Kale uses special cell types (tags) to organize your notebook into pipeline components. You can assign these types to cells using the Kale JupyterLab extension or by adding tags directly in the notebook metadata.

### Cell Types Reference

| Cell Type | Status | Description |
|-----------|--------|-------------|
| **Imports** | ✅ Works | The code in this cell will be pre-pended to every step of the pipeline. Used for all import statements. **All imports must be placed in cells tagged as `imports`.** Importing libraries (pandas, tensorflow, etc.) in other cell types will cause pipeline execution errors. |
| **Functions** | ✅ Works |The code in this cell will be pre-pended to every step of the pipeline, after **imports**. Used for function and class definitions only.  **Do not include** top-level executable statements |
| **Pipeline Parameters** | ✅ Works | Define variables that will become pipeline parameters. If more than one Pipeline Parameters cell exists, and a parameter is defined in each cell, only the final value will be taken.|
| **Pipeline Metrics** | ✅ Works | Print scalar metrics and transform it into pipeline metrics. |
| **Step** | ✅ Works | Regular pipeline steps with custom names. This is the default cell type for your data processing and ML logic. Each step can have dependencies on other steps. Steps can also define their own image and GPU requirements. |
| **Skip Cell** | ✅ Works | Cells marked as skip will be excluded from the pipeline. Useful for exploratory code or debugging that shouldn't be part of the production pipeline. |

### Important Guidelines

> [!WARNING]
> **Imports outside `Imports` cells won't be detected for automatic dependency installation, which causes ImportError at runtime if the package isn't pre-installed in the container image.**


**Best Practices:**
- Place all imports at the beginning of your notebook in cells tagged as `Imports`
- Keep function definitions pure - no side effects (modifying global variables or mutable parameters), prints, or imports
- Use `pipeline-parameters` for values you might want to tune between runs
- Use `skip` cells for exploratory analysis that shouldn't be in the pipeline

### Example

Check out the example notebooks at `examples/` to see cell types in action.

## FAQ

Head over to [FAQ](FAQ.md) to read about some known issues and some of the
limitations imposed by the Kale data marshalling model.

## Resources

- Kale introduction [blog post](https://medium.com/kubeflow/automating-jupyter-notebook-deployments-to-kubeflow-pipelines-with-kale-a4ede38bea1f)
- KubeCon NA Tutorial 2019: [From Notebook to Kubeflow Pipelines: An End-to-End Data Science Workflow](https://kccncna19.sched.com/event/Uaeq/tutorial-from-notebook-to-kubeflow-pipelines-an-end-to-end-data-science-workflow-michelle-casbon-google-stefano-fioravanzo-fondazione-bruno-kessler-ilias-katsakioris-arrikto?iframe=no&w=100%&sidebar=yes&bg=no)
  / [video](http://youtube.com/watch?v=C9rJzTzVzvQ)
- KubeCon EU Tutorial 2020: [From Notebook to Kubeflow Pipelines with HP Tuning: A Data Science Journey](https://kccnceu20.sched.com/event/ZerG/tutorial-from-notebook-to-kubeflow-pipelines-with-hp-tuning-a-data-science-journey-stefano-fioravanzo-ilias-katsakioris-arrikto)
  / [video](https://www.youtube.com/watch?v=QK0NxhyADpM)

## Contribute

```bash
make dev      # Set up development environment
make test     # Run all tests
make jupyter  # Start JupyterLab
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development instructions, including:
- Available make commands
- Testing with KFP clusters
- Building release artifacts
- Live reload setup

#### Kale v2.0 Demo
Watch the KubeFlow Kale Demo - Introduction video below.

[![Demo](https://img.youtube.com/vi/UGLJuqJqJYY/hqdefault.jpg)](https://www.youtube.com/watch?v=UGLJuqJqJYY)
