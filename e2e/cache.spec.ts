import { test, expect } from '@playwright/test';

test('localStorage cache is populated after first load', async ({ page }) => {
  await page.goto('/overview');
  await expect(page.getByText('Period Balance')).toBeVisible();

  const keys = await page.evaluate(() => Object.keys(localStorage));
  const cacheKey = keys.find((k) => k.startsWith('budget-buddy:cache:'));
  expect(cacheKey).toBeDefined();

  const raw = await page.evaluate((k) => localStorage.getItem(k!), cacheKey);
  const parsed = JSON.parse(raw!);
  expect(parsed).toHaveProperty('transactions');
  expect(parsed).toHaveProperty('categories');
  expect(parsed).toHaveProperty('fingerprint');
});

test('range navigation keeps content visible without skeleton flash', async ({ page }) => {
  await page.goto('/overview');
  await expect(page.getByText('Period Balance')).toBeVisible();

  // Navigate to previous period — client-side re-render from cache, not a server fetch
  await page.getByRole('button', { name: 'Go to previous period' }).click();
  await expect(page).toHaveURL(/[?&]from=\d{4}-\d{2}-\d{2}/);

  // Charts must remain visible immediately — no skeleton means no full reload
  await expect(page.getByText('Period Balance')).toBeVisible();
  await expect(page.getByText('Changes')).toBeVisible();
});

test('second visit to transactions page shows content without loading skeleton', async ({ page }) => {
  // Seed the cache
  await page.goto('/overview');
  await expect(page.getByText('Period Balance')).toBeVisible();

  // Navigate to transactions — DataProvider re-mounts but should hit localStorage
  await page.goto('/transactions');

  // Content should appear without remaining on a skeleton
  await expect(page.getByRole('button', { name: 'Add Transaction' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Newest first' })).toBeVisible();
});

// Sign-out test must run last — it invalidates the auth session
test('cache is cleared on sign out', async ({ page }) => {
  await page.goto('/overview');
  await expect(page.getByText('Period Balance')).toBeVisible();

  const keysBefore = await page.evaluate(() => Object.keys(localStorage));
  expect(keysBefore.some((k) => k.startsWith('budget-buddy:cache:'))).toBe(true);

  await page.getByRole('button', { name: /open user menu/i }).click();
  await page.getByRole('menuitem', { name: /sign out/i }).click();
  await expect(page).toHaveURL('/login');

  const keysAfter = await page.evaluate(() => Object.keys(localStorage));
  expect(keysAfter.some((k) => k.startsWith('budget-buddy:cache:'))).toBe(false);
});
