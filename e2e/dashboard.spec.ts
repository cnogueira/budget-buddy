import { test, expect } from './test';

test('overview renders chart widgets', async ({ page }) => {
  await page.goto('/overview');

  await expect(page.getByText('Period Balance')).toBeVisible();
  await expect(page.getByText('Changes')).toBeVisible();
  await expect(page.getByText('Period Income')).toBeVisible();
  await expect(page.getByText('Period Expenses')).toBeVisible();
});
