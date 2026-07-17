import { test, expect } from '@playwright/test';

test.describe('Epoch Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/epoch');
  });

  test('displays live clock with 3 timestamp units', async ({ page }) => {
    await expect(page.getByText('Seconds')).toBeVisible();
    await expect(page.getByText('Milliseconds')).toBeVisible();
    await expect(page.getByText('Nanoseconds')).toBeVisible();
  });

  test('converts timestamp to date', async ({ page }) => {
    await page.getByRole('tab', { name: /timestamp.*date/i }).click();
    await page.getByLabel('Unix Timestamp').fill('1700000000');
    await page.getByRole('button', { name: /convert to date/i }).click();
    await expect(page.getByText('14 Nov 2026')).toBeVisible();
  });

  test('converts date to timestamp', async ({ page }) => {
    await page.getByRole('tab', { name: /date.*timestamp/i }).click();
    await page.getByLabel(/date/i).fill('2026-11-14T22:13:20Z');
    await page.getByRole('button', { name: /convert to timestamp/i }).click();
    await expect(page.getByText('1700000000')).toBeVisible();
  });

  test('shows error for invalid timestamp', async ({ page }) => {
    await page.getByRole('tab', { name: /timestamp.*date/i }).click();
    await page.getByLabel('Unix Timestamp').fill('not-a-number');
    await page.getByRole('button', { name: /convert to date/i }).click();
    await expect(page.getByText(/invalid|error/i)).toBeVisible();
  });

  test('handles zero timestamp (unix epoch)', async ({ page }) => {
    await page.getByRole('tab', { name: /timestamp.*date/i }).click();
    await page.getByLabel('Unix Timestamp').fill('0');
    await page.getByRole('button', { name: /convert to date/i }).click();
    await expect(page.getByText('1970')).toBeVisible();
  });

  test('handles negative timestamp', async ({ page }) => {
    await page.getByRole('tab', { name: /timestamp.*date/i }).click();
    await page.getByLabel('Unix Timestamp').fill('-86400');
    await page.getByRole('button', { name: /convert to date/i }).click();
    await expect(page.getByText(/negative|before.*epoch/i)).toBeVisible();
  });

  test('keyboard shortcut C clears form', async ({ page }) => {
    await page.getByRole('tab', { name: /timestamp.*date/i }).click();
    await page.getByLabel('Unix Timestamp').fill('1700000000');
    await page.keyboard.press('c');
    await expect(page.getByLabel('Unix Timestamp')).toHaveValue('');
  });

  test('shows code examples for JavaScript', async ({ page }) => {
    await page.getByRole('tab', { name: /code examples/i }).click();
    await expect(page.getByText('JavaScript')).toBeVisible();
    await expect(page.getByText('new Date')).toBeVisible();
  });
});
