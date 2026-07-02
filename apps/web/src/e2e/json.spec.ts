import { test, expect } from '@playwright/test';

test.describe('JSON Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/json');
  });

  test('shows JSON viewer with editor and tree', async ({ page }) => {
    await expect(page.getByText('JSON Viewer')).toBeVisible();
    await expect(page.getByText('Tree View')).toBeVisible();
    await expect(page.getByRole('button', { name: /format/i })).toBeVisible();
  });

  test('validates and shows valid JSON badge', async ({ page }) => {
    await page.getByRole('button', { name: /validate/i }).click();
    await expect(page.getByText(/valid json/i)).toBeVisible();
  });

  test('shows error for invalid JSON', async ({ page }) => {
    // Clear editor and type invalid JSON
    // The Monaco editor is in an iframe-like container
    const editor = page.locator('.monaco-editor textarea').first();
    await editor.fill('{invalid json}');
    await page.getByRole('button', { name: /validate/i }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test('format button beautifies JSON', async ({ page }) => {
    await page.getByRole('button', { name: /format/i }).click();
    // After format, the badge should show Valid
    await expect(page.locator('text=Valid').first()).toBeVisible();
  });

  test('minify button compresses JSON', async ({ page }) => {
    await page.getByRole('button', { name: /minify/i }).click();
    await expect(page.getByText(/valid/i)).toBeVisible();
  });

  test('tree view shows JSON structure', async ({ page }) => {
    // Default sample JSON has "user" key
    await expect(page.getByText('"user"')).toBeVisible();
  });

  test('download button works', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('data.json');
  });

  test('clear button empties editor', async ({ page }) => {
    await page.getByRole('button', { name: /clear/i }).click();
    // Tree view should show empty state
    await expect(page.getByText(/enter json/i)).toBeVisible();
  });
});
