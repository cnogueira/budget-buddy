import { test, expect } from '@playwright/test';
import { addTransaction } from './helpers/transactions';

test('can add a transaction', async ({ page }) => {
  await page.goto('/');

  const marker = await addTransaction(page);

  // Modal closes after 1.5s success delay; the modal title heading is only in the modal
  await expect(page.getByRole('heading', { name: 'Add Transaction' })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(marker)).toBeVisible();
});

test('can delete a transaction', async ({ page }) => {
  await page.goto('/');

  const marker = await addTransaction(page);

  await expect(page.getByRole('heading', { name: 'Add Transaction' })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(marker)).toBeVisible();

  // Register before the click that triggers globalThis.confirm()
  page.on('dialog', (dialog) => dialog.accept());

  await page.locator('tr', { hasText: marker }).getByTitle('Delete transaction').click();

  await expect(page.getByText(marker)).not.toBeVisible();
});
