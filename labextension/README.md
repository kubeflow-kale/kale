## Kubeflow-Kale JupyterLab Extension

JupyterLab extension that provides a Kubeflow specific left area used to deploy a Notebook via Kale.

## Installation

To build the extension

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

## svg icon

Useful tools to create the CSS svg icon:

- [SVGOMG](https://jakearchibald.github.io/svgomg/): Simplify SVG path structure to be easily embedded into CSS
- [SVG URL Encoder](https://yoksel.github.io/url-encoder/): Convert standard SVG paths to CSS url

## Request

[HTTP Requests w/ Typescript](https://wanago.io/2019/03/18/node-js-typescript-6-sending-http-requests-understanding-multipart-form-data/)