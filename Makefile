# ABOUTME: Kale Development Makefile - unified task automation.
# ABOUTME: Use 'make dev' to set up the development environment.

.PHONY: help dev install \
        test test-backend test-backend-unit test-labextension test-e2e test-e2e-install \
        lint lint-backend lint-labextension format-labextension format-backend \
        build-backend build-labextension \
        kfp-build kfp-serve kfp-compile kfp-run \
        clean clean-venv lock lock-upgrade check-uv \
        jupyter jupyter-kfp watch-labextension

UV := uv
# jlpm is a yarn wrapper provided by JupyterLab - use it for extension development
JLPM := $(UV) run jlpm

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

##@ General

help: ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BLUE)Kale Development Commands$(NC)\n\nUsage:\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

check-uv: ## Verify uv is installed
	@command -v $(UV) >/dev/null 2>&1 || { \
		printf "$(YELLOW)uv not found. Installing...\n$(NC)"; \
		curl -LsSf https://astral.sh/uv/install.sh | sh; \
	}

##@ Installation

# Dev version used for local development (matches KFP_DEV_VERSION)
DEV_VERSION ?= 2.0.0a1

dev: check-uv ## Set up development environment
	@printf "$(BLUE)Setting up Kale development environment...\n$(NC)"
	@# Step 1: Install backend first to get jlpm available
	SETUPTOOLS_SCM_PRETEND_VERSION=$(DEV_VERSION) $(UV) sync --package kubeflow-kale --all-extras
	@# Step 2: Build labextension (requires jlpm from step 1)
	cd labextension && $(JLPM) install
	@# Clean tsbuildinfo cache before build (fixes incremental build issues after make clean)
	cd labextension && $(JLPM) clean:lib
	cd labextension && $(JLPM) build
	@# Step 3: Now sync all packages (labextension editable install needs lib/ to exist)
	SETUPTOOLS_SCM_PRETEND_VERSION=$(DEV_VERSION) $(UV) sync --all-packages --all-extras
	@# Step 4: Link extension for development (must run from labextension directory)
	cd labextension && SETUPTOOLS_SCM_PRETEND_VERSION=$(DEV_VERSION) $(UV) run jupyter labextension develop . --overwrite
	@# Step 5: Set up pre-commit hooks (Python + TypeScript/JavaScript linting)
	@$(UV) run pre-commit install 2>/dev/null || { \
		printf "$(YELLOW)Note: pre-commit hooks not installed (core.hooksPath is set globally).\n$(NC)"; \
		printf "$(YELLOW)To enable pre-commit hooks, run: git config --unset core.hooksPath\n$(NC)"; \
	}
	@printf "$(GREEN)Setup complete! Run 'make jupyter' to start JupyterLab\n$(NC)"

install: dev ## Alias for dev

##@ Testing

test: test-backend test-labextension ## Run all tests

test-backend: ## Run backend tests
	@printf "$(BLUE)Running backend tests...\n$(NC)"
	$(UV) run pytest backend/kale/tests -vv

test-backend-unit: ## Run backend unit tests only
	@printf "$(BLUE)Running backend unit tests...\n$(NC)"
	$(UV) run pytest backend/kale/tests/unit_tests -vv

test-labextension: ## Run labextension tests
	@printf "$(BLUE)Running labextension tests...\n$(NC)"
	cd labextension && $(JLPM) test

test-e2e-install: ## Install Playwright browsers (run once)
	@printf "$(BLUE)Installing Playwright dependencies...\n$(NC)"
	cd labextension/ui-tests && $(JLPM) install
	cd labextension/ui-tests && $(JLPM) playwright install
	@printf "$(GREEN)Playwright installed!\n$(NC)"

test-e2e: ## Run Playwright e2e tests (experimental)
	@printf "$(BLUE)Running Playwright e2e tests...\n$(NC)"
	@printf "$(YELLOW)Note: e2e tests may timeout due to extension kernel startup\n$(NC)"
	cd labextension/ui-tests && $(JLPM) playwright test

##@ Linting

lint: lint-backend lint-labextension ## Run all linters

lint-backend: ## Lint backend code (ruff)
	@printf "$(BLUE)Linting backend...\n$(NC)"
	$(UV) run ruff check backend
	$(UV) run ruff format --check backend

lint-labextension: ## Lint labextension code (eslint + prettier)
	@printf "$(BLUE)Linting labextension...\n$(NC)"
	cd labextension && $(JLPM) lint:check

format-labextension: ## Format labextension code
	cd labextension && $(JLPM) prettier && $(JLPM) eslint

format-backend: ## Format backend code (ruff)
	$(UV) run ruff check --fix backend
	$(UV) run ruff format backend

##@ Building

build-backend: ## Build backend wheel
	@printf "$(BLUE)Building backend wheel with version $(DEV_VERSION)...\n$(NC)"
	cd backend && SETUPTOOLS_SCM_PRETEND_VERSION=$(DEV_VERSION) $(UV) build
	@printf "$(GREEN)Wheel built: backend/dist/\n$(NC)"

build-labextension: ## Build labextension wheel
	@printf "$(BLUE)Building labextension...\n$(NC)"
	cd labextension && $(JLPM) build:prod
	cd labextension && $(UV) build
	@printf "$(GREEN)Labextension wheel built: labextension/dist/\n$(NC)"

##@ KFP Development (replaces devpi workflow)

KFP_WHEEL_DIR ?= $(CURDIR)/.kfp-wheels
KFP_PORT ?= 8765
KFP_DEV_VERSION ?= $(DEV_VERSION)
# Host address for KFP to reach the wheel server (Linux users: override with your host IP)
KFP_HOST_ADDR ?= host.docker.internal

kfp-build: ## Build wheel for KFP cluster testing (fixed version for reproducibility)
	@printf "$(BLUE)Building wheel with version $(KFP_DEV_VERSION)...\n$(NC)"
	rm -f dist/kubeflow_kale-*.whl
	cd backend && SETUPTOOLS_SCM_PRETEND_VERSION=$(KFP_DEV_VERSION) $(UV) build
	@# Create PEP 503 compliant simple index structure
	rm -rf $(KFP_WHEEL_DIR)
	mkdir -p $(KFP_WHEEL_DIR)/kubeflow-kale
	cp dist/kubeflow_kale-*.whl $(KFP_WHEEL_DIR)/kubeflow-kale/
	@# Generate index files for pip simple API
	@echo '<!DOCTYPE html><html><body><a href="kubeflow-kale/">kubeflow-kale</a></body></html>' > $(KFP_WHEEL_DIR)/index.html
	@cd $(KFP_WHEEL_DIR)/kubeflow-kale && for f in *.whl; do echo "<a href=\"$$f\">$$f</a><br>"; done > index.html
	@printf "$(GREEN)Wheel ready at $(KFP_WHEEL_DIR)\n$(NC)"

kfp-serve: kfp-build ## Serve wheel via HTTP for Kind/Docker clusters
	@printf "$(BLUE)Starting wheel server on port $(KFP_PORT)...\n$(NC)"
	cd $(KFP_WHEEL_DIR) && python3 -m http.server $(KFP_PORT)

kfp-compile: ## Compile notebook with local wheel (usage: make kfp-compile NB=path/to/notebook.ipynb)
	@test -n "$(NB)" || { printf "$(YELLOW)Usage: make kfp-compile NB=path/to/notebook.ipynb\n$(NC)"; exit 1; }
	@printf "$(YELLOW)Make sure 'make kfp-serve' is running in another terminal\n$(NC)"
	SETUPTOOLS_SCM_PRETEND_VERSION=$(KFP_DEV_VERSION) \
	KALE_PIP_INDEX_URLS="http://$(KFP_HOST_ADDR):$(KFP_PORT)" \
	KALE_PIP_TRUSTED_HOSTS="$(KFP_HOST_ADDR)" \
	$(UV) run kale --nb $(NB)

kfp-run: ## Compile and run on KFP with local wheel (usage: make kfp-run NB=... KFP_HOST=...)
	@test -n "$(NB)" || { printf "$(YELLOW)Usage: make kfp-run NB=path/to/notebook.ipynb KFP_HOST=http://localhost:8080\n$(NC)"; exit 1; }
	@test -n "$(KFP_HOST)" || { printf "$(YELLOW)Error: KFP_HOST not set\n$(NC)"; exit 1; }
	@printf "$(YELLOW)Make sure 'make kfp-serve' is running in another terminal\n$(NC)"
	SETUPTOOLS_SCM_PRETEND_VERSION=$(KFP_DEV_VERSION) \
	KALE_PIP_INDEX_URLS="http://$(KFP_HOST_ADDR):$(KFP_PORT)" \
	KALE_PIP_TRUSTED_HOSTS="$(KFP_HOST_ADDR)" \
	$(UV) run kale --nb $(NB) --kfp_host $(KFP_HOST) --run_pipeline

##@ Cleanup

clean: ## Clean all build artifacts
	@printf "$(BLUE)Cleaning...\n$(NC)"
	rm -rf .venv
	rm -rf dist backend/dist backend/*.egg-info
	rm -rf labextension/dist labextension/*.egg-info
	rm -rf labextension/lib labextension/node_modules
	rm -rf labextension/kubeflow_kale_labextension/labextension
	rm -rf .kfp-wheels .kale
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	@printf "$(GREEN)Clean complete\n$(NC)"

clean-venv: ## Remove virtual environment only
	rm -rf .venv

##@ Lockfile Management

lock: check-uv ## Update uv.lock
	$(UV) lock

lock-upgrade: check-uv ## Upgrade all dependencies and update lock
	$(UV) lock --upgrade

##@ Development Helpers

jupyter: ## Start JupyterLab
	SETUPTOOLS_SCM_PRETEND_VERSION=$(DEV_VERSION) $(UV) run jupyter lab

jupyter-kfp: ## Start JupyterLab with KFP dev environment (run kfp-serve first!)
	@printf "$(YELLOW)Make sure 'make kfp-serve' is running in another terminal\n$(NC)"
	SETUPTOOLS_SCM_PRETEND_VERSION=$(KFP_DEV_VERSION) \
	KALE_PIP_INDEX_URLS="http://$(KFP_HOST_ADDR):$(KFP_PORT)" \
	KALE_PIP_TRUSTED_HOSTS="$(KFP_HOST_ADDR)" \
	$(UV) run jupyter lab

watch-labextension: ## Watch labextension for changes (run in separate terminal)
	cd labextension && $(JLPM) watch
