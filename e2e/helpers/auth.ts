import { Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.getByText('Sign in with email').click();
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('/');
}

export async function ensureSignedIn(page: Page) {
  await page.goto('/');
  if (page.url().includes('/login')) {
    await signIn(page);
  }
}

export async function ensureSignedOut(page: Page) {
  await page.goto('/');
  if (!page.url().includes('/login')) {
    await page.getByRole('button', { name: /open user menu/i }).click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();
    await page.waitForURL('/login');
  }
}
