import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('unauthenticated visit to / redirects to /login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

test('can sign in with email and password', async ({ page }) => {
  await page.goto('/login');

  await page.getByText('Sign in with email').click();
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page).toHaveURL('/');
});
