## Kubeflow-Kale JupyterLab Extension

JupyterLab extension that provides a Kubeflow specific left area used to deploy a Notebook via Kale. The extension provides the means to deploy e single Jupyter Notebook via Kale using a simple to use interface. The use can specify pipeline metadata and volume mounts and with a click of a button deploy to Kubeflow Pipelines.

![JPKaleScreen Logo](https://raw.githubusercontent.com/kubeflow-kale/jupyterlab-kubeflow-kale/master/docs/imgs/jp-kale.png)

## Installation

To build the extension

```bash
jlpm install
```

And then add the extension to JupyterLab

```bash
jupyter labextension install .
```

## Development

To reinstall continuously the new changes while developing, run `jlpm run watch`. To install the entire package run `jlpm install` while inside the extension's directory. Then run JuptyerLab with `jupyter lab --watch` to watch for changes in the extension.

## svg icon

Useful tools to create the CSS svg icon:

- [SVGOMG](https://jakearchibald.github.io/svgomg/): Simplify SVG path structure to be easily embedded into CSS
- [SVG URL Encoder](https://yoksel.github.io/url-encoder/): Convert standard SVG paths to CSS url