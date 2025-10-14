#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3141}"
INDEX_NAME="${INDEX_NAME:-dev}"

echo "Starting devpi-server on http://${HOST}:${PORT} ..."
if ! command -v devpi-server >/dev/null; then
  echo "devpi-server not found; install with: pip install devpi-server devpi-client"
  exit 1
fi

# Start (does nothing if already running under a supervisor)
devpi-server --host "${HOST}" --port "${PORT}" &
sleep 2

devpi use "http://${HOST}:${PORT}"
# Set no password for root on local dev
devpi user -c root password='' || true
devpi login root --password '' || true

# Create or reuse an index based on root/pypi as cache mirror
if devpi index -l | grep -q "root/${INDEX_NAME}"; then
  echo "Index root/${INDEX_NAME} exists, ensuring volatile=True ..."
  devpi index "root/${INDEX_NAME}" volatile=True || true
else
  devpi index -c "${INDEX_NAME}" bases=/root/pypi volatile=True
fi

devpi use "root/${INDEX_NAME}"

echo
echo "Export these for pip in dev mode:"
echo "  export KALE_DEV_MODE=1"
echo "  export KALE_DEVPI_SIMPLE_URL=http://${HOST}:${PORT}/root/${INDEX_NAME}/+simple/"
echo "  export PIP_INDEX_URL=\$KALE_DEVPI_SIMPLE_URL"
echo "  export PIP_EXTRA_INDEX_URL=https://pypi.org/simple"
