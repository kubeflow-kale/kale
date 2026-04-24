
# Kubeflow Kale
[![PyPI version](https://img.shields.io/pypi/v/kubeflow-kale?color=%2334D058&label=pypi%20package)](https://pypi.org/project/kubeflow-kale/)
[![License](https://img.shields.io/github/license/kubeflow-kale/kale)](https://github.com/kubeflow-kale/kale/blob/main/LICENSE)
[![CI](https://github.com/kubeflow/kale/workflows/CI/badge.svg)](https://github.com/kubeflow/kale/actions)
[![Join Slack](https://img.shields.io/badge/Join_Slack-blue?logo=slack)](https://www.kubeflow.org/docs/about/community/#kubeflow-slack-channels)

<p>
  <img alt="Kale Logo" src="https://raw.githubusercontent.com/kubeflow-kale/kale/master/docs/imgs/kale_logo.png" height="130">
</p>
<h4 >Turn Jupyter Notebooks into ML Pipelines — In One Click</h4>

<p>
  <b>No pipeline code. No SDK learning curve. Just tag your cells and deploy.</b>
</p>

---

Latest News 🔥

- [2026/04] Kubeflow Kale v2.0 is officially released with support for Kubeflow Pipelines 2.16.0!
- [2026/04] The new Kubeflow Kale [docs](./docs) is now available!

## What is Kale?

KALE (Kubeflow Automated pipeLines Engine) is a tool designed to simplify the deployment of Kubeflow Pipelines workflows.

You've built an amazing ML model in a Jupyter notebook. Now you need to run it in production, schedule it, or scale it up. Usually that means rewriting everything as a Kubeflow Pipeline — learning the SDK, restructuring your code, and debugging YAML.

**Kale eliminates all of that.**

Tag your notebook cells with simple labels like `imports`, `step`, or `skip`. Kale analyzes your code, detects dependencies between steps, and generates a production-ready Kubeflow Pipeline. Your notebook stays exactly as it is.

<p align="center">
  <img alt="Kale JupyterLab Extension" src="docs/imgs/Extension.png" width="800"/>
</p>

### Why Data Scientists Love Kale

✅ push-button pipeline generation (tag cells, click "compile")<br>
✅ automatic dependency detection<br>
✅ same notebook for dev and production<br>
✅ create pipelines directly in notebook without looking at YAML<br>
✅ requires no direct knowledge of KFP SDK<br>
✅ no rewriting code into pipeline components<br>



📖 **Documentation:** <https://kale.kubeflow.org>


## See It In Action


Watch how to use Kale convert a notebook to a pipeline in minutes:

[![Kale v2.0 Demo](https://img.youtube.com/vi/UGLJuqJqJYY/hqdefault.jpg)](https://www.youtube.com/watch?v=UGLJuqJqJYY)

## Get Started

### Requirements

- Python 3.11+
- Kubeflow Pipelines v2.16.0+ ([install guide](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/))
- Kubernetes cluster (minikube, kind, or any K8s cluster)


### Quick Install

```bash
# Clone and set up (v2.0 coming soon to PyPI)
git clone https://github.com/kubeflow-kale/kale.git
cd kale && make dev

# Launch JupyterLab with Kale
make jupyter
```

### Your First Pipeline in 60 Seconds

1. Open any notebook from `examples`
2. Click the **Kale icon** in the left sidebar
3. Toggle **Enable** to see your notebook as a pipeline graph
4. Click **Compile and Run** — that's it!

```bash
# Or use the CLI
kale --nb examples/base/candies_sharing.ipynb --kfp_host http://localhost:8080 --run_pipeline
```


## How It Works

Tag your notebook cells to define pipeline structure:

| Cell Tag | What It Does |
|----------|--------------|
| `imports` | Libraries needed by all steps (pandas, sklearn, etc.) |
| `functions` | Helper functions available to all steps |
| `pipeline-parameters` | Variables users can tune between runs |
| `pipeline-metrics` | Metrics to track in the KFP UI |
| `step:step_name` | A pipeline step (Kale auto-detects dependencies!) |
| `skip` | Exploratory code to exclude from the pipeline |

Learn more about cell types in [Kale documentation](https://github.com/kubeflow/kale/blob/main/docs/source/concepts/cell-types.md).

> **Pro tip:** Kale automatically detects which variables flow between steps. You don't need to specify inputs and outputs — just write natural notebook code.

Check out the [example notebooks](examples/) to see these in action.

## Installation

> Make it sure that Kubeflow Pipelines is running and acessible to Kale

Install from [PyPi](https://pypi.org/project/kubeflow-kale/):

```bash
pip install "jupyterlab>=4.0.0" kubeflow-kale[jupyter]
jupyter lab
```

## Local Development

You can install Kale directly from the sources:
```
git clone https://github.com/kubeflow-kale/kale.git
make clean && make dev && make jupyter-kfp
```
See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup instructions.

## Local Development with Docker

Run Kale locally with Docker:

```bash
make docker-build   # Build the image
make docker-run     # JupyterLab at http://localhost:8889
```

Connect to a real KFP cluster:

```bash
make kfp-serve                                              # Serve dev wheel
kubectl port-forward -n kubeflow svc/ml-pipeline 8080:8888  # Forward KFP API
make docker-run                                             # Start container
```

## Community

We'd love to have you!

- **Questions?** Join [#kubeflow](https://www.kubeflow.org/docs/about/community/#kubeflow-slack-channels) on Slack
- **Found a bug?** [Open an issue](https://github.com/kubeflow-kale/kale/issues)
- **Want to contribute?** See [CONTRIBUTING.md](CONTRIBUTING.md)

## Learn More

- [FAQ](FAQ.md) — Common questions and known limitations
- [Blog: Automating Jupyter Deployments](https://medium.com/kubeflow/automating-jupyter-notebook-deployments-to-kubeflow-pipelines-with-kale-a4ede38bea1f)
- [KubeCon NA 2019: From Notebook to Pipeline](https://www.youtube.com/watch?v=C9rJzTzVzvQ)
- [KubeCon EU 2020: Notebook to Pipeline with HP Tuning](https://www.youtube.com/watch?v=QK0NxhyADpM)

---

<p align="center">
  <b>Ready to simplify your ML workflow?</b><br>
  <a href="#get-started">Get started now</a> · <a href="https://github.com/kubeflow-kale/kale/issues/457">Road to 2.0</a> · <a href="https://www.kubeflow.org/docs/about/community/#kubeflow-slack-channels">Join Slack</a>
</p>

## Contributors

Thanks to everyone who has contributed to Kale!

<a href="https://github.com/kubeflow-kale/kale/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kubeflow-kale/kale" />
</a>
