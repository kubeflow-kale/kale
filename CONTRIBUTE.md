# Contributing to the Kale Backend

This guide walks through setting up a local development environment for the Kale
backend, explains how the package version flows through the system, and shows how
to iterate safely using a temporary Python package index.

> The backend lives under `backend/`. All commands below assume you run them from
> the repository root unless noted otherwise.

## 1. Prerequisites

- Python 3.10 (managed via `pyenv`, `conda`, or your system package manager).
- Recent `pip` and `virtualenv`/`venv`.
- `node`/`yarn` are only required when working on the labextension (not covered here).
- Optional but recommended: `devpi-server` and `devpi-client` for local package
  publishing (see “Local package index”).

## 2. Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

## 3. Install the backend in editable mode

```bash
cd backend
pip install -e .[dev]
```

The `pip install -e .[dev]` step relies on `backend/pyproject.toml`:

- Dependencies are declared in `[project] dependencies`.
- `setuptools_scm` infers the package version from git tags, so the version number
  evolves automatically (`1.2.3` → `1.2.3.devN+gHASH` for untagged commits). You do
  *not* have to edit any file to bump versions during development.

## 4. Understanding version detection in code generation

Kale exposes its version at runtime via `kale.__version__`. When a notebook is
compiled into a Kubeflow Pipelines (KFP) component:

- `kale.compiler.Compiler._get_package_list_from_imports` always includes a Kale
  dependency. If a concrete version is available (`__version__ != "0+unknown"`),
  the component pins to `kubeflow-kale==<version>`. Otherwise it falls back to an
  unpinned `kubeflow-kale`.
- `kale.common.utils.compute_pip_index_urls` determines which PyPI indexes are
  baked into the generated component. It honours environment variables in the
  following order:
  1. `KALE_PIP_INDEX_URLS` – comma separated list, highest priority.
  2. `KALE_DEV_MODE` + optional `KALE_DEVPI_SIMPLE_URL` – enables your local devpi.
  3. Default fallback – `https://pypi.org/simple`.

Because compiled workflows freeze both the Kale version and the index list,
updating your local package copy requires re‑publishing the wheel/sdist that the
pipeline will install. That is why a disposable package index (devpi) is useful –
you can iterate without uploading experimental builds to the public PyPI.

## 5. Working with the local devpi index

The `backend/scripts/` directory provides helpers for spinning up a local devpi
registry and publishing the freshly built Kale package:

| Script | Purpose | Typical usage |
| ------ | ------- | ------------- |
| `devpi-up.sh` | Start (or reuse) a devpi-server instance on `HOST:PORT` and create a volatile `root/<index>` derived from the public PyPI mirror. Prints the environment variables needed for pip. | `./scripts/devpi-up.sh` |
| `devpi-publish.sh` | Build Kale (`python -m build`), infer the newest artifact version from `dist/`, remove any existing release with the same version from the target devpi index, then upload the artifacts. | `./scripts/devpi-publish.sh` |
| `devpi-main.sh` | Convenience wrapper that calls the two scripts above and exports `KALE_DEV_MODE=1` + `KALE_DEVPI_SIMPLE_URL` in the current shell. | `source ./scripts/devpi-main.sh` |

Recommended loop when iterating on compiled pipelines:

```bash
source .venv/bin/activate
cd backend

# Start devpi and export KALE_DEV_MODE / KALE_DEVPI_SIMPLE_URL / pip overrides.
source scripts/devpi-main.sh

# Make your code changes…
# Rebuild and publish to the local index (removes the previous dev build).
./scripts/devpi-publish.sh

# Re-run notebook compilation so the generated component pulls from devpi.
kale --help  # or your usual CLI invocation pointing at the notebook
# For example you can run this quick test to validate the the generated DSL points
# for the correct Kale version
# kale --nb ./examples/base/candies_sharing.ipynb --dev
```

> Note: the scripts rely on `devpi-server`, `devpi-client`, and `python -m build`.
> Install them once in your virtualenv: `pip install devpi-server devpi-client build`.

## 6. Running tests

```bash
cd backend
python -m pytest backend/kale/tests/unit_tests
```

Integration tests under `backend/kale/tests/e2e/` perform notebook → DSL
compilation and compare against golden files in `backend/kale/tests/assets/`.
If you alter template output, update the generated files accordingly.

## 7. Formatting and linting

- Python formatting is enforced via the existing code style (PEP 8). Many generated
  files run through `autopep8`.
- The labextension has independent tooling (`jlpm lint`, `jlpm prettier`). Run
  those only if you modify the frontend package.

## 8. Typical development checklist

1. Activate your virtual environment.
2. `pip install -e .[dev]`.
3. Optionally start `devpi` via `source scripts/devpi-main.sh`.
4. Implement and re-publish using `scripts/devpi-publish.sh` when you need a new
   dev build.
5. Update fixtures (`backend/kale/tests/assets/kfp_dsl/*.py`) whenever template
   output changes.
6. Run unit and (when relevant) e2e tests.
7. Before committing, ensure `git status` shows only intentional changes.

Happy hacking! If anything in this guide is unclear, open an issue or PR with
improvements. Contributions are welcome.***
