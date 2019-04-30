# kale-toolbar-runner

JupyterLab extension that created a new menu button to deploy the notebook to Kale.


## Prerequisites

* JupyterLab

## Installation

To build the extension, first install the dependencies:

```bash
jlpm add @jupyterlab/notebook @jupyterlab/application @jupyterlab/apputils @jupyterlab/docregistry @phosphor/disposable
```

Then build the extension

```bash
jlpm install
```

And then add the extension to JupyterLab

```bash
jupyter labextension install kale-toolbar-runner
```

or

```bash
jupyter labextension install . --no-build
```

## Development

To reinstall continuously the new changes while developing, run `jlpm run watch`. To install the entire package run `jlpm install` while inside the extension's directory.

## Kale svg icon

- [SVGOMG](https://jakearchibald.github.io/svgomg/): Simplify SVG path structure to be easily embedded into CSS
- [SVG URL Encoder](https://yoksel.github.io/url-encoder/): Convert standard SVG paths to CSS url

## Request

[HTTP Requests w/ Typescript](https://wanago.io/2019/03/18/node-js-typescript-6-sending-http-requests-understanding-multipart-form-data/)