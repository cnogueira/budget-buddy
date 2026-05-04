// This file is named z_signout.spec.ts so it runs last alphabetically.
// The sign-out call invalidates the Supabase access token in the shared auth state,
// which would break any tests that run after it in the same process.
import { test, expect } from '@playwright/test';

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
