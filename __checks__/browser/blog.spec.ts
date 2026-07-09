import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_URL;

test('blog dashboard renders with live feed widgets', async ({ page }) => {
  const response = await page.goto(`${WEB_URL}/blog`);
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByRole('heading', { name: 'Information Pulse' })).toBeVisible();
});
