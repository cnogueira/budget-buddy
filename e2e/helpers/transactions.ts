import { Page } from '@playwright/test';
import { randomUUID } from 'crypto';

export async function addTransaction(page: Page): Promise<string> {
  const marker = 'e2e-' + randomUUID();
  const categoryName = 'e2e-cat-' + randomUUID().slice(0, 8);

  await page.getByRole('button', { name: 'Add Transaction' }).click();

  await page.getByLabel('Amount').fill('9.99');

  await page.getByText('+ New Category').click();
  await page.getByPlaceholder('Enter new category name').fill(categoryName);
  await page.getByRole('button', { name: 'Create' }).click();

  await page.getByLabel('Description (Optional)').fill(marker);

  await page.locator('form').getByRole('button', { name: 'Add Transaction' }).click();

  return marker;
}
