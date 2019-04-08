![Kale Logo](docs/imgs/kale_logo.png)

---------------------------------------------------------------------

Kale is a Python package that aims at automatically deploy a general purpose Jupyter Notebook as a running [Kubeflow Pipelines](https://github.com/kubeflow/pipelines) instance, without requiring the use the specific KFP DSL.

The general idea of kale is to automatically arrange the cells included in a notebook, and transform them into a unified KFP-compliant pipeline. To do so, the user is only required to decide which cells correspond to which pipeline step, by the use of tags. In this way, a researcher can better focus on building and testing its code locally, and then scale it in a simple, organized and controlled way.

## Tagging language

Jupyter provides a tagging feature out-of-the-box, that lets you associate each cells with custom defined tags. The feature is available also in JupyterLab via the [jupyterlab-celltags](https://github.com/jupyterlab/jupyterlab-celltags) extension.

The tags are used to tell Kale how to convert the notebook's code cells into an execution graph, by specifying the execution dependencies between the pipeline steps and which code cells to merge together.

This is a list of tags recognized by Kale:

| Tag | Description | Example |
| :---: | :---: | :---: |
| `^block:<block_name>(;<block_name>)*$` | Assign the current cell to a (multiple) pipeline step | `block:train-model`<br>`block:processing-A;processing-B`|  
| `^prev:<block_name>(;<block_name>)*$` | Define an execution dependency of the current cell to `n` other pipeline steps | `prev:load-dataset
| <code>imports&#124;functions</code> | Tell Kale to add this code block at the beginning of every pipeline code block. Useful to add imports/function to every pipeline step | - |  
| `skip` | 'Hide' the current cell from Kale. | - |

Where `<block_name>` is matched against the regex: `[a-z0-9]`. So any string containing only digits and lowercase characters.

## Installation

Kale is provided as a Python package. Just clone the repository to your local machine and install the package in a virtual environment. 

```bash
# Clone the repo to your local environment
git clone https://github.com/StefanoFioravanzo/kale.git
cd kale
# Install the package in your virtualenv
python setup.py
```

## Getting Started

First you need to have a running Kubeflow instance (Kubeflow [getting started guide](https://www.kubeflow.org/docs/started/getting-started/)).


Kale provides a CLI command. Run `kale --help` for a detailed description of the execution parameters.

Example:

```bash
kale --nb kale/examples/base_example_numpy.ipynb \
	--pipeline_name numpy_example \
	--pipeline_descr "Numpy Example" \
	--docker_image stefanofioravanzo/pipelines-container:1.3
```

See the notebooks under the examples folder to start experimenting with Kale.

If run with the `--deploy` flag, Kale will deploy the generated to a running KFP instance (see `--help` for more flags to define the KFP endpoint). If run without `--deploy`, Kale will generate a standalone Python script that can be run inside a KFP Jupyter Notebook to spawn the pipeline.

## Development



## Contributing

