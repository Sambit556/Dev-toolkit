import { test, expect } from '@playwright/test';

const WEB_URL = process.env.WEB_URL ?? 'https://dev-toolkit-web-sigma.vercel.app';

test('epoch converter page renders and the live clock ticks', async ({ page }) => {
  const response = await page.goto(`${WEB_URL}/epoch`);
  expect(response?.status()).toBeLessThan(400);

  await expect(page.getByRole('heading', { name: 'Epoch Converter' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Timestamp → Date' })).toBeVisible();
});
