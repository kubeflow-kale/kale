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

import { expect, galata, test } from '@jupyterlab/galata';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('should load extension without critical errors', async ({ page }) => {
  const errors: string[] = [];

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto();

  // Wait for JupyterLab to fully load
  await page.waitForSelector('.jp-SideBar.jp-mod-left', { timeout: 30000 });

  // Check that no critical errors occurred during page load
  // Filter out known non-critical warnings
  const criticalErrors = errors.filter(
    err =>
      !err.includes('Failed to load resource') &&
      !err.includes('DevTools') &&
      !err.includes('404'),
  );

  expect(criticalErrors).toHaveLength(0);
});

test('should show different states in Kale panel based on context', async ({
  page,
}) => {
  await page.goto();

  // Wait for the sidebar to be ready
  await page.waitForSelector('.jp-SideBar.jp-mod-left');

  // Look for the Kale tab in the sidebar
  const kaleTab = page.locator('.jp-SideBar.jp-mod-left .lm-TabBar-tab', {
    hasText: /kale/i,
  });

  await expect(kaleTab).toBeVisible();

  // Click the Kale tab to open the panel
  await kaleTab.click();

  // STATE 1: No notebook open - should show empty state
  // Look for message asking user to open a notebook
  const emptyStateMessage = page.locator('.jp-SideBar-content', {
    has: page.locator('text=/open.*notebook/i'),
  });
  await expect(emptyStateMessage).toBeVisible({ timeout: 5000 });

  // STATE 2: Notebook open, Kale disabled - should show toggle message
  // Create a new notebook
  await page.notebook.createNew();

  // Wait a moment for the panel to update
  await page.waitForTimeout(1000);

  // Look for message asking user to toggle on the extension
  const toggleMessage = page.locator('.jp-SideBar-content', {
    has: page.locator('text=/toggle.*extension/i, text=/enable.*kale/i'),
  });
  await expect(toggleMessage).toBeVisible({ timeout: 5000 });

  // Verify that full functionality is NOT visible yet
  const deployButton = page.locator('button', { hasText: /deploy/i });
  await expect(deployButton).not.toBeVisible();

  // STATE 3: Kale enabled - should show full KFP functionality
  // Find and click the Enable switch
  const enableSwitch = page.locator('input[type="checkbox"]').first();
  await expect(enableSwitch).toBeVisible();
  await enableSwitch.click();

  // Wait for the panel to update
  await page.waitForTimeout(1000);

  // Verify full Kale/KFP functionality is now visible
  // Look for pipeline configuration inputs
  const pipelineNameInput = page.locator(
    'input[placeholder*="pipeline" i], label:has-text("Pipeline Name") + input',
  );
  await expect(pipelineNameInput.first()).toBeVisible({ timeout: 5000 });

  // Verify Deploy button is now visible
  await expect(deployButton).toBeVisible({ timeout: 5000 });

  // Verify experiment selector is visible
  const experimentInput = page.locator(
    'text=/experiment/i, label:has-text("Experiment")',
  );
  await expect(experimentInput.first()).toBeVisible();
});

test('should toggle Kale enable switch and show inline metadata', async ({
  page,
}) => {
  await page.goto();

  // Create a new notebook
  await page.notebook.createNew();

  // Add some code to the first cell
  await page.notebook.setCell(0, 'code', 'print("hello world")');

  // Open Kale panel
  const kaleTab = page.locator('.jp-SideBar.jp-mod-left .lm-TabBar-tab', {
    hasText: /kale/i,
  });
  await kaleTab.click();

  // Find and toggle the Enable switch
  const enableSwitch = page.locator('input[type="checkbox"]').first();
  await expect(enableSwitch).toBeVisible();

  // Toggle ON
  await enableSwitch.click();

  // Wait for inline metadata to appear on the cell
  const inlineMetadata = page.locator('.kale-inline-cell-metadata').first();
  await expect(inlineMetadata).toBeVisible({ timeout: 5000 });

  // Toggle OFF
  await enableSwitch.click();

  // Wait for inline metadata to disappear
  await expect(inlineMetadata).not.toBeVisible({ timeout: 5000 });
});

test('should tag a cell and persist to notebook JSON', async ({ page }) => {
  await page.goto();

  // Create a new notebook
  const notebookName = 'test-tagging.ipynb';
  await page.notebook.createNew(notebookName);

  // Add code to the first cell
  await page.notebook.setCell(0, 'code', 'import pandas as pd');

  // Open Kale panel and enable
  const kaleTab = page.locator('.jp-SideBar.jp-mod-left .lm-TabBar-tab', {
    hasText: /kale/i,
  });
  await kaleTab.click();

  const enableSwitch = page.locator('input[type="checkbox"]').first();
  await enableSwitch.click();

  // Wait for inline metadata to appear
  await page.waitForSelector('.kale-inline-cell-metadata', { timeout: 5000 });

  // Click the edit button on the first cell's metadata
  const editButton = page
    .locator('.kale-inline-cell-metadata .kale-edit-button')
    .first();
  await editButton.click();

  // Wait for the metadata editor dialog
  await page.waitForSelector('.kale-metadata-editor', { timeout: 5000 });

  // Find the step name input and enter a name
  const stepNameInput = page.locator('input[placeholder*="step"]').first();
  await stepNameInput.fill('load_data');

  // Save the metadata (look for Save or OK button in the dialog)
  const saveButton = page
    .locator('.kale-metadata-editor button', { hasText: /save|ok/i })
    .first();
  if (await saveButton.isVisible()) {
    await saveButton.click();
  } else {
    // Alternative: press Enter to save
    await stepNameInput.press('Enter');
  }

  // Wait for the dialog to close
  await expect(page.locator('.kale-metadata-editor')).not.toBeVisible({
    timeout: 3000,
  });

  // Verify the inline metadata shows the step name
  const stepChip = page.locator('.kale-inline-cell-metadata', {
    hasText: 'load_data',
  });
  await expect(stepChip).toBeVisible();

  // Save the notebook
  await page.notebook.save();

  // Wait a moment for the save to complete
  await page.waitForTimeout(1000);

  // Read the notebook JSON file and verify tags
  const xdgDataHome =
    process.env.XDG_DATA_HOME ||
    path.resolve(__dirname, '..', '..', '..', '.galata-root');
  const notebookPath = path.join(xdgDataHome, notebookName);

  await expect
    .poll(
      () => {
        if (!fs.existsSync(notebookPath)) {
          return null;
        }
        const notebookContent = fs.readFileSync(notebookPath, 'utf-8');
        const notebook = JSON.parse(notebookContent);
        const firstCell = notebook.cells[0];
        return firstCell?.metadata?.tags || null;
      },
      {
        message: 'Expected notebook to have tags on first cell',
        timeout: 5000,
      },
    )
    .toContain('step:load_data');
});

test('should create cell dependency and persist to notebook JSON', async ({
  page,
}) => {
  await page.goto();

  // Create a new notebook
  const notebookName = 'test-dependencies.ipynb';
  await page.notebook.createNew(notebookName);

  // Add code to cells
  await page.notebook.setCell(0, 'code', 'import pandas as pd');

  // Add a second cell
  await page.notebook.addCell('code', 'df = pd.read_csv("data.csv")');

  // Open Kale panel and enable
  const kaleTab = page.locator('.jp-SideBar.jp-mod-left .lm-TabBar-tab', {
    hasText: /kale/i,
  });
  await kaleTab.click();

  const enableSwitch = page.locator('input[type="checkbox"]').first();
  await enableSwitch.click();

  // Wait for inline metadata to appear
  await page.waitForSelector('.kale-inline-cell-metadata', { timeout: 5000 });

  // Tag first cell as "step_a"
  const editButton1 = page
    .locator('.kale-inline-cell-metadata .kale-edit-button')
    .nth(0);
  await editButton1.click();
  await page.waitForSelector('.kale-metadata-editor', { timeout: 5000 });

  const stepNameInput1 = page.locator('input[placeholder*="step"]').first();
  await stepNameInput1.fill('step_a');
  await stepNameInput1.press('Enter');

  await page.waitForTimeout(500);

  // Tag second cell as "step_b" with dependency on "step_a"
  const editButton2 = page
    .locator('.kale-inline-cell-metadata .kale-edit-button')
    .nth(1);
  await editButton2.click();
  await page.waitForSelector('.kale-metadata-editor', { timeout: 5000 });

  const stepNameInput2 = page.locator('input[placeholder*="step"]').first();
  await stepNameInput2.fill('step_b');

  // Select dependency - look for a multi-select or dropdown with "step_a"
  const dependencySelect = page.locator('[placeholder*="depend"]').first();
  if (await dependencySelect.isVisible()) {
    await dependencySelect.click();
    await page.locator('text=step_a').first().click();
  }

  await stepNameInput2.press('Enter');

  // Wait for editor to close
  await page.waitForTimeout(500);

  // Verify dependency indicator appears on second cell
  const dependencyIndicator = page
    .locator('.kale-inline-cell-metadata')
    .nth(1)
    .locator('.kale-dependency-dot');
  await expect(dependencyIndicator).toBeVisible({ timeout: 3000 });

  // Save the notebook
  await page.notebook.save();
  await page.waitForTimeout(1000);

  // Read the notebook JSON and verify both tags
  const xdgDataHome =
    process.env.XDG_DATA_HOME ||
    path.resolve(__dirname, '..', '..', '..', '.galata-root');
  const notebookPath = path.join(xdgDataHome, notebookName);

  await expect
    .poll(
      () => {
        if (!fs.existsSync(notebookPath)) {
          return { cell0Tags: null, cell1Tags: null };
        }
        const notebookContent = fs.readFileSync(notebookPath, 'utf-8');
        const notebook = JSON.parse(notebookContent);
        return {
          cell0Tags: notebook.cells[0]?.metadata?.tags || [],
          cell1Tags: notebook.cells[1]?.metadata?.tags || [],
        };
      },
      {
        message: 'Expected notebook to have tags on cells',
        timeout: 5000,
      },
    )
    .toMatchObject({
      cell0Tags: expect.arrayContaining(['step:step_a']),
      cell1Tags: expect.arrayContaining(['step:step_b', 'prev:step_a']),
    });
});
