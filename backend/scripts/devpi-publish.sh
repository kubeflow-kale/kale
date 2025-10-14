#!/usr/bin/env bash
set -euo pipefail

INDEX_URL="${INDEX_URL:-${KALE_DEVPI_INDEX_URL:-http://127.0.0.1:3141/root/dev}}"

python -m build

# Ensure we’re pointed at the right index
devpi use "$INDEX_URL"
devpi login root --password '' || true

# Remove exact version if re-uploading same devN during a quick iteration
PKG="kubeflow-kale"
VERSION="$(python - <<'PY'
from pathlib import Path
import sys

dist_dir = Path("dist")
if not dist_dir.exists():
    sys.stderr.write("No dist/ directory found. Run `python -m build` first.\\n")
    sys.exit(1)

wheel_candidates = sorted(
    dist_dir.glob("kubeflow_kale-*.whl"),
    key=lambda p: p.stat().st_mtime,
    reverse=True,
)
sdist_candidates = sorted(
    dist_dir.glob("kubeflow_kale-*.tar.gz"),
    key=lambda p: p.stat().st_mtime,
    reverse=True,
)

artifact = next(iter(wheel_candidates or sdist_candidates), None)
if artifact is None:
    sys.stderr.write(
        "Could not detect a freshly built kubeflow-kale artifact in dist/.\\n"
    )
    sys.exit(1)

name = artifact.name
prefix = "kubeflow_kale-"
version_part = name[len(prefix):]
if name.endswith(".whl"):
    version = version_part.split("-", 1)[0]
elif name.endswith(".tar.gz"):
    version = version_part[: -len(".tar.gz")]
else:
    sys.stderr.write(f"Unrecognized artifact format: {name}\\n")
    sys.exit(1)

print(version)
PY
)"
echo "Publishing $PKG==$VERSION to $INDEX_URL ..."
devpi remove "${PKG}==${VERSION}" --yes || true

devpi upload
