// Copyright 2026 The Kubeflow Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');
const fs = require('fs');
const path = require('path');

// Setup galata root directory for test isolation
const galataRoot = path.resolve(__dirname, '..', '..', '.galata-root');

// Clean and recreate galata root
if (fs.existsSync(galataRoot)) {
  fs.rmSync(galataRoot, { recursive: true, force: true });
}
fs.mkdirSync(galataRoot, { recursive: true });

// Create required Jupyter subdirectories
const jupyterDir = path.join(galataRoot, 'jupyter');
const runtimeDir = path.join(jupyterDir, 'runtime');
fs.mkdirSync(runtimeDir, { recursive: true });

// Set XDG_DATA_HOME for consistent data directories
process.env.XDG_DATA_HOME = galataRoot;

module.exports = {
  ...baseConfig,
  workers: 1, // Single worker to avoid conflicts with shared state
  globalTeardown: require.resolve('./global-teardown.js'),
  webServer: {
    command: 'jlpm start',
    url: 'http://localhost:8888/lab',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      JUPYTERLAB_GALATA_ROOT_DIR: galataRoot,
    },
  },
};
