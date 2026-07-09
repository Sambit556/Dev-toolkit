import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_URL;

test('homepage loads and lists the core tools', async ({ page }) => {
  const response = await page.goto(`${WEB_URL}`);
  expect(response?.status()).toBeLessThan(400);

  await expect(page).toHaveTitle(/Developer Utility Suite/i);
  await expect(page.locator('a[href="/epoch"]').first()).toBeVisible();
  await expect(page.locator('a[href="/json"]').first()).toBeVisible();
});
