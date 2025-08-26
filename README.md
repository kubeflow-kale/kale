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
<a target="_blank" href="https://github.com/kubeflow-kale/kale/actions">
  <img alt="Kale CI Workflow Status" src="https://github.com/kubeflow-kale/kale/workflows/CI/badge.svg">
</a>
</p>

---

KALE (Kubeflow Automated pipeLines Engine) is a project that aims at simplifying
the Data Science experience of deploying Kubeflow Pipelines workflows.

Kubeflow is a great platform for orchestrating complex workflows on top
Kubernetes and Kubeflow Pipeline provides the mean to create reusable components
that can be executed as part of workflows. The self-service nature of Kubeflow
make it extremely appealing for Data Science use, at it provides an easy access
to advanced distributed jobs orchestration, re-usability of components, Jupyter
Notebooks, rich UIs and more. Still, developing and maintaining Kubeflow
workflows can be hard for data scientists, who may not be experts in working
orchestration platforms and related SDKs. Additionally, data science often
involve processes of data exploration, iterative modelling and interactive
environments (mostly Jupyter notebook).

Kale bridges this gap by providing a simple UI to define Kubeflow Pipelines
workflows directly from you JupyterLab interface, without the need to change a
single line of code.

Read more about Kale and how it works in this Medium post:
[Automating Jupyter Notebook Deployments to Kubeflow Pipelines with Kale](https://medium.com/kubeflow/automating-jupyter-notebook-deployments-to-kubeflow-pipelines-with-kale-a4ede38bea1f)

## Getting started

### Requirements
- Install Kubeflow Pipelines(v2.4.0) as recommended in the official documentation [Kubeflow Pipelines Installation](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/)
- Kubernetes

Install the Kale backend from PyPI and the JupyterLab extension. You can find a
set of curated Notebooks in the
[examples repository](https://github.com/kubeflow-kale/examples)

```bash
# install kale
pip install kubeflow-kale

# install jupyter lab
pip install "jupyterlab>=4.0.0"

# install the extension
jupyter labextension install kubeflow-kale-labextension
# verify extension status
jupyter labextension list

# run
jupyter lab
```

<img alt="Kale JupyterLab Extension" src="https://raw.githubusercontent.com/kubeflow-kale/kale/master/docs/imgs/labextension.png"/>

To build images to be used as a NotebookServer in Kubeflow, refer to the
Dockerfile in the `docker` folder.

### FAQ

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

#### Backend

Make sure you have installed Kubeflow Pipelines(v2.4.0) as recommended in the official documentation [Kubeflow Pipelines Installation](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/)

Clone the repository and create a conda environment:
```bash
git clone https://github.com/kubeflow-kale/kale.git
cd kale
conda create --name my_project_env python=3.10
conda activate my_project_env
```
Checkout to backend directory. Then:

```bash
cd backend/
pip install -e .[dev]

#start kfp locally in another terminal (optional)
kubectl port-forward -n kubeflow svc/ml-pipeline-ui 8080:80

#run cli from outside the backend directory
cd ..
python ./backend/kale/cli.py --nb ./examples/base/candies_sharing.ipynb --kfp_host http://127.0.0.1:8080 --run_pipeline

# run tests
pytest -x -vv # TODO
```
DSL script will be generated inside .kale of root directory and pipeline would be visible in KFP UI running at 'http://127.0.0.1:8080/'.

#### Notes to consider:
1. Component names can't be same as any other variable with same name being used in the user code.
2. Component name can't have _ and spaces, but instead have '-'
3. Component names can't have capital letters and numbers after a '-'.
4. Step names shouldn't have capital letters and no numbers after '-', eg. 'kid1' is fine, but not 'kid-1'.
5. Step names with _ are replaced to '-' for component names and appended with '-step' in the DSL script.
6. Artifact variables are appended with '-artifact' in the DSL script.


#### Labextension

The JupyterLab Python package comes with its own yarn wrapper, called `jlpm`.
While using the previously installed venv, install JupyterLab by running:

```bash
pip install "jupyterlab>=4.0.0"
```

You can then run the following to install the Kale extension:

```bash
cd labextension/

# build extension
jlpm build

# install dependencies using pyproject.toml
pip install -e . --force-reinstal

# install labextension in dev mode
jupyter labextension develop . --overwrite
# list installed jp extensions
jlpm labextension list

# open jupyterlab
jupyter lab

# To make changes and rebuild
# open 2nd tab inside labextension, then
jlpm build

# copy paste static directory files inside kubeflow-kale-labextension/labextension folder and refresh jupyterlab
```

#### Git Hooks

This repository uses
[husky](https://github.com/typicode/husky)
to set up git hooks.

For `husky` to function properly, you need to have `yarn` installed and in your
`PATH`. The reason that is required is that `husky` is installed via
`jlpm install` and `jlpm` is a `yarn` wrapper. (Similarly, if it was installed
using the `npm` package manager, then `npm` would have to be in `PATH`.)

Currently installed git hooks:

- `pre-commit`: Run a prettier check on staged files, using
  [pretty-quick](https://github.com/azz/pretty-quick)

#### Issues to cover
1. Fix Progress bar in left panel during compile and run.
2. Fix opening of editor after clicking edit pencil icon above cells.
3. Fix weakmap warning related in InlineMetadata.tsx which gets displayed while toggling the kale icon to enable state. It can be skipped for now in UI.
4. Fix Kale icon in LeftPanel
5. Fix building and packaging of labextension related with package.json, pyproject.toml, and tsconfig.json