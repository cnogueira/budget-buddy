import { chromium } from '@playwright/test';
import * as path from 'path';

export default async function globalSetup() {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');

  await page.getByText('Sign in with email').click();
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await page.waitForURL('http://localhost:3000/');

  await page.context().storageState({
    path: path.join(process.cwd(), 'e2e/.auth/user.json'),
  });

  await browser.close();
}
