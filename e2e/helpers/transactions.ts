import { Page, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

export async function addTransaction(page: Page): Promise<string> {
  const marker = 'e2e-' + randomUUID();

  await page.getByRole('button', { name: 'Add Transaction' }).click();
  await page.getByLabel('Amount').fill('9.99');

  // Wait for categories to load, then pick an existing one or create if none exist
  const firstPill = page.locator('form button.rounded-full').first();
  const noCategoriesMsg = page.getByText('No categories found. Create one to get started.');
  await expect(firstPill.or(noCategoriesMsg)).toBeVisible({ timeout: 5000 });

  if (await firstPill.isVisible()) {
    await firstPill.click();
  } else {
    const categoryName = 'e2e-cat-' + randomUUID().slice(0, 8);
    await page.getByText('+ New Category').click();
    await page.getByPlaceholder('Enter new category name').fill(categoryName);
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByPlaceholder('Enter new category name')).not.toBeVisible();
  }

  await page.getByLabel('Description (Optional)').fill(marker);
  await page.locator('form').getByRole('button', { name: 'Add Transaction' }).click();
  await expect(page.getByRole('heading', { name: 'Add Transaction' })).not.toBeVisible({ timeout: 5000 });

  return marker;
}
