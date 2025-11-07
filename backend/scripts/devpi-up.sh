#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3141}"
INDEX_NAME="${INDEX_NAME:-dev}"
SERVER_DIR="${DEVPI_SERVERDIR:-${HOME}/.devpi/server}"

if ! devpi-server --help >/dev/null 2>&1; then
  echo "devpi-server not found; install with: pip install devpi-server devpi-client"
  exit 1
fi
if ! devpi --help >/dev/null 2>&1; then
  echo "devpi-client not found; install with: pip install devpi-client"
  exit 1
fi
if ! devpi-init --help >/dev/null 2>&1; then
  echo "devpi-init not found; install with: pip install devpi-server"
  exit 1
fi

mkdir -p "${SERVER_DIR}"

# Initialize the server directory on first use.
if [ ! -f "${SERVER_DIR}/.serverversion" ]; then
  echo "Initializing devpi-server data directory at ${SERVER_DIR} ..."
  devpi-init --serverdir "${SERVER_DIR}"
fi

echo "Starting devpi-server on http://${HOST}:${PORT} (serverdir=${SERVER_DIR}) ..."
if pgrep -f "devpi-server --serverdir ${SERVER_DIR}" >/dev/null 2>&1; then
  echo "devpi-server already running."
else
  devpi-server \
    --serverdir "${SERVER_DIR}" \
    --host "${HOST}" \
    --port "${PORT}" &
  DEVPI_PID=$!
  echo "devpi-server started with PID ${DEVPI_PID}"
fi

sleep 2

# Wait until the server is reachable.
echo -n "Waiting for devpi-server to become ready"
ready=false
for attempt in {1..30}; do
  if devpi use "http://${HOST}:${PORT}" >/dev/null 2>&1; then
    ready=true
    break
  fi
  echo -n "."
  sleep 1
done

if [ "${ready}" != "true" ]; then
  echo
  echo "Failed to contact devpi-server at http://${HOST}:${PORT}."
  exit 1
fi
echo " ... ready."

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
