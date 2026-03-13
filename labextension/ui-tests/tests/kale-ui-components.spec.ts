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

import { test, expect } from '@playwright/test';

test.describe('Kale Empty State', () => {
  test('should open the Kale panel and verify the empty-state components', async ({
    page,
  }) => {
    await page.goto('http://localhost:8889/lab', { waitUntil: 'load' });

    await page.waitForTimeout(3000);

    // Dismiss the Git dialog if it appears
    const dismissButton = page.locator('button', { hasText: 'Dismiss' });
    if (await dismissButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissButton.click();
      await page.waitForTimeout(500);
    }

    // Click the Kale sidebar tab (Kubeflow Pipelines Deployment Panel)
    const kaleTab = page.locator(
      '[title="Kubeflow Pipelines Deployment Panel"]',
    );
    await kaleTab.click();

    await page.waitForTimeout(1000);

    // Verify Enable Switch
    const toolbarContainer = page.locator('.toolbar.input-container');
    await expect(toolbarContainer).toBeVisible();

    const enableLabel = page.locator('.switch-label', { hasText: 'Enable' });
    await expect(enableLabel).toBeVisible({ timeout: 5000 });

    const enableSwitch = page.locator('input[name="enableKale"]');
    await expect(enableSwitch).toBeVisible({ timeout: 5000 });
    await expect(enableSwitch).not.toBeChecked();

    // Verify Empty State
    const emptyState = page.locator('.kale-empty-state-container');
    await expect(emptyState).toBeVisible({ timeout: 5000 });

    const title = page.locator('.kale-empty-state-title');
    await expect(title).toContainText(
      'Transform your Notebooks into Pipelines',
    );

    const featureItems = page.locator('.kale-empty-state-list-item');
    await expect(featureItems).toHaveCount(3);

    const githubLink = page.locator(
      'a[href="https://github.com/kubeflow/kale"]',
    );
    await expect(githubLink).toBeVisible();
  });
});

test.describe('Open a Notebook and Enable Kale', () => {
  test('should open a JupyterNotebook, enable Kale with the toggle, and verify UI components', async ({
    page,
  }) => {
    await page.goto('http://localhost:8889/lab', { waitUntil: 'load' });

    await page.waitForTimeout(3000);

    // Dismiss the Git dialog if it appears
    const dismissButton = page.locator('button', { hasText: 'Dismiss' });
    if (await dismissButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissButton.click();
      await page.waitForTimeout(500);
    }

    // Click the Kale sidebar tab (Kubeflow Pipelines Deployment Panel)
    const kaleTab = page.locator(
      '[title="Kubeflow Pipelines Deployment Panel"]',
    );
    await kaleTab.click();

    await page.waitForTimeout(1000);

    // Create a new notebook
    const pythonNotebook = page
      .locator(
        '.jp-LauncherCard:has(.jp-LauncherCard-label[title="Python 3 (ipykernel)"])',
      )
      .first();
    await pythonNotebook.click();

    const notebookPanel = page.locator('.jp-NotebookPanel');
    await expect(notebookPanel).toBeVisible({ timeout: 5000 });

    // Enable Kale
    const enableSwitch = page.locator('input[name="enableKale"]');
    await enableSwitch.click();
    await expect(enableSwitch).toBeChecked();

    // Verify deploy button
    const compileButton = page.locator('button:has-text("Compile")');
    await expect(compileButton).toBeVisible();

    // Verify inline metadata
    const editButton = page.locator('.kale-editor-toggle');
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();
    await page.waitForTimeout(500);
    const metadataEditor = page.locator('.kale-metadata-editor-wrapper');
    await expect(metadataEditor).toBeVisible({ timeout: 5000 });

    // Verify metadata editor fields
    await expect(page.locator('label:has-text("Cell type")')).toBeVisible();
    await expect(page.locator('label:has-text("Step name")')).toBeVisible();
    await expect(page.locator('label:has-text("Depends on")')).toBeVisible();
    await expect(page.locator('[title="Base Image"]')).toBeVisible();
    await expect(page.locator('[title="GPU"]')).toBeVisible();
    await expect(page.locator('[title="Caching"]')).toBeVisible();
  });
});
