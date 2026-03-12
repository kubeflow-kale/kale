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

test.describe('Kale UI Components', () => {
  test('should display all main UI components in Kale panel', async ({
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

    // Enable Switch
    const toolbarContainer = page.locator('.toolbar.input-container');
    await expect(toolbarContainer).toBeVisible();

    const enableLabel = page.locator('.switch-label', { hasText: 'Enable' });
    await expect(enableLabel).toBeVisible({ timeout: 5000 });

    const enableSwitch = page.locator('input[name="enableKale"]');
    await expect(enableSwitch).toBeVisible({ timeout: 5000 });
    await expect(enableSwitch).not.toBeChecked();

    // KaleEmptyState
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

    // DeployProgress
    const kalePanel = page.locator('.kale-panel');
    await expect(kalePanel).toBeVisible({ timeout: 5000 });

    const deploysProgress = page.locator('.deploys-progress');
    await expect(deploysProgress).toHaveCount(1);
  });
});
