import { test, expect } from './test';
import { ensureSignedOut } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await ensureSignedOut(page);
});

test('/privacy is reachable without auth', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page).toHaveURL('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});

test('/terms is reachable without auth', async ({ page }) => {
  await page.goto('/terms');
  await expect(page).toHaveURL('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
});
