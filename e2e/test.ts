import { test as base, expect } from '@playwright/test';
import { ensureSignedIn } from './helpers/auth';

export { expect };

export const test = base.extend<object>({
  page: async ({ page }, provide) => {
    await ensureSignedIn(page);
    await provide(page);
  },
});
