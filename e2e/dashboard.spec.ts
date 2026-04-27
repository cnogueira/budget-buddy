import { test, expect } from '@playwright/test';

test('dashboard renders summary cards', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Income').first()).toBeVisible();
  await expect(page.getByText('Expenses').first()).toBeVisible();
  await expect(page.getByText('Saved This Month')).toBeVisible();
});

test('Add Transaction button is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add Transaction' })).toBeVisible();
});

test('Transactions section heading is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();
});
