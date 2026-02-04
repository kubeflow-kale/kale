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
<a target="_blank" href="https://www.npmjs.com/package/kubeflow-kale-labextension">
  <img alt="npm Version" src="https://badgen.net/npm/v/kubeflow-kale-labextension">
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

- **Python 3.10+**
- **Kubeflow Pipelines v2.4.0+** - Install as recommended in the official [Kubeflow Pipelines Installation](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/) documentation
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
pip install "jupyterlab>=4.0.0" kubeflow-kale kubeflow-kale-labextension
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

## FAQ

To build images to be used as a NotebookServer in Kubeflow, refer to the
Dockerfile in the `docker` folder.

Head over to [FAQ](FAQ.md) to read about some known issues and some of the
limitations imposed by the Kale data marshalling model.

## Resources

- Kale introduction [blog post](https://medium.com/kubeflow/automating-jupyter-notebook-deployments-to-kubeflow-pipelines-with-kale-a4ede38bea1f)
- Codelabs showcasing Kale working in MiniKF with Arrikto's [Rok](https://www.arrikto.com/):
  - [From Notebook to Kubeflow Pipelines](https://codelabs.developers.google.com/codelabs/cloud-kubeflow-minikf-kale/#0)
  - [From Notebook to Kubeflow Pipelines with HP Tuning](https://arrik.to/demowfhp)
- KubeCon NA Tutorial 2019: [From Notebook to Kubeflow Pipelines: An End-to-End Data Science Workflow](https://kccncna19.sched.com/event/Uaeq/tutorial-from-notebook-to-kubeflow-pipelines-an-end-to-end-data-science-workflow-michelle-casbon-google-stefano-fioravanzo-fondazione-bruno-kessler-ilias-katsakioris-arrikto?iframe=no&w=100%&sidebar=yes&bg=no)
  / [video](http://youtube.com/watch?v=C9rJzTzVzvQ)
- CNCF Webinar 2020: [From Notebook to Kubeflow Pipelines with MiniKF & Kale](https://www.cncf.io/webinars/from-notebook-to-kubeflow-pipelines-with-minikf-kale/)
  / [video](https://www.youtube.com/watch?v=1fX9ZFWkvvs)
- KubeCon EU Tutorial 2020: [From Notebook to Kubeflow Pipelines with HP Tuning: A Data Science Journey](https://kccnceu20.sched.com/event/ZerG/tutorial-from-notebook-to-kubeflow-pipelines-with-hp-tuning-a-data-science-journey-stefano-fioravanzo-ilias-katsakioris-arrikto)
  / [video](https://www.youtube.com/watch?v=QK0NxhyADpM)

## Contribute

```bash
make dev      # Set up development environment
make test     # Run all tests
make jupyter  # Start JupyterLab
```

See [CONTRIBUTE.md](CONTRIBUTE.md) for detailed development instructions, including:
- Available make commands
- Testing with KFP clusters
- Building release artifacts
- Live reload setup

#### Kale v2.0 Demo
Watch the KubeFlow Kale Demo - Introduction video below.

[![Demo](https://img.youtube.com/vi/UGLJuqJqJYY/hqdefault.jpg)](https://www.youtube.com/watch?v=UGLJuqJqJYY)
