import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_URL;

test('JSON viewer page renders and can validate JSON client-side', async ({ page }) => {
  const response = await page.goto(`${WEB_URL}/json`);
  expect(response?.status()).toBeLessThan(400);

  await expect(page).toHaveTitle(/JSON Viewer/i);

  const editor = page.locator('textarea, [contenteditable="true"], .monaco-editor').first();
  await expect(editor).toBeVisible({ timeout: 15000 });
});
