# 1) Start devpi and export env for dev mode
./scripts/devpi-up.sh
export KALE_DEV_MODE=1
export KALE_DEVPI_SIMPLE_URL=http://127.0.0.1:3141/root/dev/+simple/

# 2) Build and publish to local index (auto removes same dev version)
./scripts/devpi-publish.sh

# 3) Run your KFP pipeline generation/execution
# The template now uses the local index while KALE_DEV_MODE=1 is set.
# kale compile ...