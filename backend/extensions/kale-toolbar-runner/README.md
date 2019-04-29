# kale-toolbar-runner

JupyterLab extension that created a new menu button to deploy the notebook to Kale.


## Prerequisites

* JupyterLab

## Installation

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