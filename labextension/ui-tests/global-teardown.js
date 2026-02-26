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

const fs = require('fs');

module.exports = async () => {
  const xdgDataHome = process.env.XDG_DATA_HOME;

  if (xdgDataHome) {
    if (
      xdgDataHome.includes('.galata-root') ||
      xdgDataHome.includes('ui-tests')
    ) {
      try {
        fs.rmSync(xdgDataHome, { recursive: true, force: true });
      } catch (error) {
        console.error('Failed to remove test data directory:', error);
      }
    } else {
      console.warn(
        'XDG_DATA_HOME does not appear to be a test directory, skipping cleanup:',
        xdgDataHome,
      );
    }
  }
};
