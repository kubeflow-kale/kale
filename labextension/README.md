## Kubeflow-Kale-Launcher JupyterLab Extension

JupyterLab extension that provides a Kubeflow specific left area that can be used to deploy a Notebook to Kubeflow Pipelines. This panel provides several inputs to customize pipeline metadata (name, description, parameters), volume mount points, ...

When hitting the deploy button, the active Kubeflow-Kale REST endpoint will be called, sending the active notebook with its tags. Kubeflow-Kale will then manage the actual deployment to Kubeflow Pipelines, to have a more in depth look at how this works check out the [Kubeflow-Kale repository](http://github.com/kubeflow-kale/kale).

![JPKaleScreen Logo](https://raw.githubusercontent.com/kubeflow-kale/jupyterlab-kubeflow-kale/master/docs/imgs/jp-kale.png)

## Installation

The extension currently supports JupyterLab `v1.1.1`:

```bash
pip install jupyterlab==1.1.1

# add the extension
jupyter labextension install kubeflow-kale-launcher

# verify extension status
jupyter labextension list

# run
jupyter lab
```

## Development

To build the extension

```bash
jlpm install
```

And then add the extension to JupyterLab

```bash
jupyter labextension install .
```


To reinstall continuously the new changes while developing, run `jlpm run watch`. To install the entire package run `jlpm install` while inside the extension's directory. Then run JuptyerLab with `jupyter lab --watch` to watch for changes in the extension.