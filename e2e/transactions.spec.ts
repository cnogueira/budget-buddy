import { test, expect } from './test';
import { addTransaction } from './helpers/transactions';

test('can add a transaction', async ({ page }) => {
  await page.goto('/transactions');

  const marker = await addTransaction(page);

  await expect(page.getByText(marker)).toBeVisible();
});

test('can delete a transaction', async ({ page }) => {
  await page.goto('/transactions');

  const marker = await addTransaction(page);

  // Register before the click that triggers globalThis.confirm()
  page.on('dialog', (dialog) => dialog.accept());

  await page.locator('tr', { hasText: marker }).getByTitle('Delete transaction').click();

  await expect(page.getByText(marker)).not.toBeVisible();
});

test('sort toggle switches between newest and oldest first', async ({ page }) => {
  await page.goto('/transactions');

  // Default is newest-first; clicking toggles to oldest-first
  await page.getByRole('button', { name: 'Newest first' }).click();
  await expect(page).toHaveURL(/[?&]sort=asc/);
  await expect(page.getByRole('button', { name: 'Oldest first' })).toBeVisible();

  // Clicking again restores newest-first
  await page.getByRole('button', { name: 'Oldest first' }).click();
  await expect(page).toHaveURL(/sort=desc/);
  await expect(page.getByRole('button', { name: 'Newest first' })).toBeVisible();
});

test('date range picker in filter bar updates URL params', async ({ page }) => {
  await page.goto('/transactions');
  await page.getByRole('button', { name: /–/ }).click();
  await page.getByText('Last month').click();
  await page.getByRole('button', { name: 'Select' }).click();

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const y = lastMonth.getFullYear();
  const m = String(lastMonth.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, lastMonth.getMonth() + 1, 0).getDate();
  const from = `${y}-${m}-01`;
  const to = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;

  await expect(page).toHaveURL(new RegExp(`from=${from}`));
  await expect(page).toHaveURL(new RegExp(`to=${to}`));
});

test('category filter updates URL and shows active selection', async ({ page }) => {
  await page.goto('/transactions');

  // Ensure at least one category exists
  await addTransaction(page);

  // Open the category multi-select
  await page.getByText('All categories').click();

  // Select the first category
  const firstLabel = page.locator('label').filter({ has: page.locator('input[type="checkbox"]') }).first();
  await expect(firstLabel).toBeVisible();
  await firstLabel.click();

  // URL changes and page re-renders with the selected category
  await expect(page).toHaveURL(/[?&]categories=[\w-]+/);
  // After re-render the trigger button reflects the count
  await expect(page.getByText('1 category')).toBeVisible();
});

test('URL params persist across reload', async ({ page }) => {
  await page.goto('/transactions?from=2026-03-01&to=2026-03-31&sort=asc');

  await expect(page.getByRole('button', { name: 'Oldest first' })).toBeVisible();

  await page.reload();

  // After reload the server re-renders with same params
  await expect(page.getByRole('button', { name: 'Oldest first' })).toBeVisible();
});

test('Add Transaction and Import buttons are present', async ({ page }) => {
  await page.goto('/transactions');

  await expect(page.getByRole('button', { name: 'Add Transaction' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
});
