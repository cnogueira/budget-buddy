import { test, expect } from './test';

test('overview loads all four chart widgets', async ({ page }) => {
  await page.goto('/overview');

  await expect(page.getByText('Period Balance')).toBeVisible();
  await expect(page.getByText('Changes')).toBeVisible();
  await expect(page.getByText('Period Income')).toBeVisible();
  await expect(page.getByText('Period Expenses')).toBeVisible();
});

test('back button shifts range into URL params', async ({ page }) => {
  await page.goto('/overview');
  await page.getByRole('button', { name: 'Go to previous period' }).click();

  await expect(page).toHaveURL(/[?&]from=\d{4}-\d{2}-\d{2}/);
  await expect(page).toHaveURL(/[?&]to=\d{4}-\d{2}-\d{2}/);
});

test('forward button is hidden for the current month', async ({ page }) => {
  await page.goto('/overview');
  // Current month ends today (or in the future), so navigating forward would
  // start a range in the future — the button must not be rendered.
  await expect(page.getByRole('button', { name: 'Go to next period' })).not.toBeVisible();
});

test('forward button is visible for a past month', async ({ page }) => {
  await page.goto('/overview?from=2026-01-01&to=2026-01-31');
  await expect(page.getByRole('button', { name: 'Go to next period' })).toBeVisible();
});

test('forward button shifts range forward and updates URL', async ({ page }) => {
  await page.goto('/overview?from=2026-01-01&to=2026-01-31');
  await page.getByRole('button', { name: 'Go to next period' }).click();

  // New range should start on Feb 1
  await expect(page).toHaveURL(/from=2026-02-01/);
});

test('date range picker opens with preset options', async ({ page }) => {
  await page.goto('/overview');
  // The picker button shows the current date range with an en-dash separator
  await page.getByRole('button', { name: /–/ }).click();

  await expect(page.getByText('This month')).toBeVisible();
  await expect(page.getByText('Last month')).toBeVisible();
  await expect(page.getByText('This year')).toBeVisible();
  await expect(page.getByText('All history')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select' })).toBeVisible();
});

test('selecting Last month preset updates the URL range', async ({ page }) => {
  await page.goto('/overview');
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

test('date picker closes without changing URL when dismissed', async ({ page }) => {
  await page.goto('/overview');
  const urlBefore = page.url();

  await page.getByRole('button', { name: /–/ }).click();
  await expect(page.getByText('Last month')).toBeVisible();

  // Click outside the popover to dismiss
  await page.mouse.click(10, 10);
  await expect(page.getByText('Last month')).not.toBeVisible();
  expect(page.url()).toBe(urlBefore);
});

test('granularity toggle switches without a page reload', async ({ page }) => {
  await page.goto('/overview');
  await expect(page.getByText('Period Balance')).toBeVisible();

  // The Period Balance widget has Days/Weeks/Months buttons
  await page.getByRole('button', { name: 'Weeks' }).first().click();
  // Still on the same URL — no navigation occurred
  await expect(page).toHaveURL('/overview');
  await expect(page.getByText('Period Balance')).toBeVisible();

  await page.getByRole('button', { name: 'Months' }).first().click();
  await expect(page).toHaveURL('/overview');
});

test('Period Balance chart fills all months in a multi-month range', async ({ page }) => {
  // A range spanning Jan 1 – May 14, 2026 (5 months)
  await page.goto('/overview?from=2026-01-01&to=2026-05-14');

  // Scope to the Period Balance card via its h3 heading's nearest rounded-xl ancestor
  const card = page.getByRole('heading', { name: 'Period Balance', level: 3 })
    .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
  await expect(card).toBeVisible();

  // Chart must be rendering (not empty state)
  await expect(card.getByRole('application')).toBeVisible();

  // Switch to Months granularity on the Period Balance chart
  await page.getByRole('button', { name: 'Months' }).first().click();

  // Every month in the range must appear as an x-axis tick label —
  // including months that have no transactions.
  const ticks = card.locator('.recharts-xAxis .recharts-cartesian-axis-tick');
  await expect(ticks).toHaveCount(5);
});
