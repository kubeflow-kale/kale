> :warning: **NOTICE** :warning:: The latest and greatest features are being developed in branch `kubecon-workshop` in preparation of [this](https://kccncna19.sched.com/event/Uaeq/tutorial-from-notebook-to-kubeflow-pipelines-an-end-to-end-data-science-workflow-michelle-casbon-google-stefano-fioravanzo-fondazione-bruno-kessler-ilias-katsakioris-arrikto?iframe=no&w=100%&sidebar=yes&bg=no) tutorial session at KubeCon North America on Nov 21st.
> 
> Note that we are targeting for a seamless experience on [MiniKF](https://www.kubeflow.org/docs/other-guides/virtual-dev/getting-started-minikf/) for the tutorial, so running Kale on local machines or on K8S clusters might result in unexpected behaviors. We will work to merge all the new features to `master` and support all environments after the conference.

![Kale Logo](https://raw.githubusercontent.com/kubeflow-kale/kale/master/docs/imgs/kale_logo.png)

---------------------------------------------------------------------

Kale is a Python package that aims at automatically deploy a general purpose Jupyter Notebook as a running [Kubeflow Pipelines](https://github.com/kubeflow/pipelines) instance, without requiring the use the specific KFP DSL.

The general idea of kale is to automatically arrange the cells included in a notebook, and transform them into a unified KFP-compliant pipeline. To do so, the user is only required to decide which cells correspond to which pipeline step, by the use of tags. In this way, a researcher can better focus on building and testing its code locally, and then scale it in a simple, organized and controlled way.

## Getting started

Install Kale from PyPI and run it over one of the provided [examples](https://github.com/kubeflow-kale/examples).

```bash
# install kale
pip install kubeflow-kale

# download a tagged example notebook
wget https://raw.githubusercontent.com/kubeflow-kale/examples/master/titanic-ml-dataset/titanic_dataset_ml.ipynb
# convert the notebook to a python script that defines a kfp pipeline
kale --nb titanic_dataset_ml.ipynb
```

This will generate generate `kaggle-titanic.kfp.py` containing a runnable pipeline defined using the KFP Python DSL. Have a look at the code to get a feeling of the magic Kale is performing under the hood.

#### Deploy the pipeline

In case you are running Kale in a Kubeflow Notebook Server, you can add the `--run_pipeline` flag to convert and run the pipeline automatically:

```bash
kale --nb titanic_dataset_ml.ipynb --run_pipeline
```

will convert the Notebook and start a new run. Switch over to the KFP UI under the Experiments tabs so the running pipeline.

#### Jupyter UI

The best way to exploit the potential of Kale is to run JupyterLab with the [Jupyter Kale extension](https://github.com/kubeflow-kale/jupyterlab-kubeflow-kale)  installed.

## Tagging language

Jupyter provides a tagging feature out-of-the-box, that lets you associate each cells with custom defined tags.

The tags are used to tell Kale how to convert the notebook's code cells into an execution graph, by specifying the execution dependencies between the pipeline steps and which code cells to merge together.

The list of tags recognized by Kale:

| Tag | Description | 
| :---: | :---: | 
| `block:<block_name>` | Assign the current cell to a pipeline step | `block:train_model`<br>`block:preprocess_data`|  
| `prev:<block_name>` | Define a dependency of the current cell to other pipeline steps | `prev:load_dataset`
| `imports` | Code to be added at the beginning of every pipeline step. This is particularly useful with cells containing import statements | - |  
| `functions` | Code to be added at the beginning of every pipeline step, but after import statements. This is particularly useful for functions or statements used in multiple pipeline steps | 
| `parameters` | To be used in cells that contain just variable assignment of primitive types (`int`, `str`, `float`, `bool`). These variables will be used as pipeline parameters, using the assigned values as defaults |
| `skip` | Do not include the code of the cell in the pipeline | - |

**Note**: `<block_name>` must consist of lower case alphanumeric characters or `_`, and can not start with a digit (matching regex: `^[_a-z][_a-z0-9]$`).

#### Cell Merging

Multiple code cells performing a related task (e.g. some data processing) can be merged into a single pipeline step by tagging the first one with a block tag (e.g. `block:data_processing`) and leaving the below cells empty of any tags. Kale will merge any untagged cell with the first tagged cell above - always skipping cells tagged with the `skip` tag.

Cell can be merged even if not contiguous in the notebook, just by tagging them with the same block name - the order of cells in the notebook will be preserved in the resulting pipeline step.

#### Notebook Tags

The ell tags can be added to the `tags` section of a code cell metadata (see nbformat doc on [cell metadata](https://nbformat.readthedocs.io/en/latest/format_description.html#metadata)).

## Notebook Metadata Spec

In order to deploy a pipeline to Kubeflow Pipeline, Kale needs several information like the name of the experiment and the pipeline, its description, volume mounts, etc...

All this information can be embedded into the Notebook in the `metadata` section (see the [nbformat spec](https://nbformat.readthedocs.io/en/latest/format_description.html#top-level-structure)). Kale expects an entry in the `metadata` section named `kubeflow_notebook` with the following spec:

| Key | Required | Description | Spec |
| :---: | :---: | :---: | :---: | 
| `pipeline_experiment` | Yes | Name of the KFP Experiment | Free Text |
| `pipeline_name` | Yes | Name of the pipeline | Alphanumeric characters or `-` |
| `pipeline_description` | No | Description of the pipeline | Free Text |
| `volumes` | No | A list of volume specs | See below the Volume spec |
| `docker_image` | No | Base docker image for pipeline steps | - |

Volume spec:

| Key | Required | Description | Spec |
| :---: | :---: | :---: | :---: | 
| `type` | Yes | Type of Volume to be mounted | One of `pv`, `pvc`, `new_pvc` |
| `name` | Yes | Name of the existing or new resource | K8s compliant resource name |
| `mount_point` | Yes | The mount point in the pipeline step fs | Valid Unix path |
| `size` | Yes (for `pv` and `new_pvc` options | Size of Volume | Integer |
| `size_type` | Yes (when defining `size`) | Storage size | One of `Gi`, `Mi`, `Ki` |
| `snapshot` | Yes | When true: snapshot volume at the end of pipeline | Bool |
| `snapshot_name` | Yes (when `snapshot` True) | Name of the snapshot resource | K8s compliant resource name|

A sample Notebook metadata:

```json
"kubeflow_notebook": {
    "experiment_name": "Titanic Experiment",
    "pipeline_name": "ml-comparison",
    "pipeline_description": "ML Pipeline predicting survival score of passengers of Titanic",
    "docker_image": "docker.io/kubeflow-kale/launcher:latest",
    "volumes": [
        {
            "type": "new_pvc",
            "name": "titanic-data-pvc",
            "mount_point": "/data",
            "size": "1",
            "size_type": "Gi",
            "snapshot": true,
            "snapshot_name": "titanic-data-snapshot"
        }
    ]
}
```

## Data passing

When splitting a Notebook into separate execution steps (each pipeline step runs inside its own docker container) the data dependencies between the steps would not allow the proper execution of the pipeline.

Kale is able to provide a seamless execution without any user intervention by detecting these data dependencies that marshalling the necessary data between the steps.

## Contribute

 Just clone the repository to your local machine and install the package in a virtual environment. 

```bash
# Clone the repo to your local environment
git clone https://github.com/kubeflow-kale/kale
cd kale
# Install the package in your virtualenv
python install -r requirements.txt
```

For a more detailed explanation of the internals of Kale, head over to [Architecture.md](./Architecture.md)


