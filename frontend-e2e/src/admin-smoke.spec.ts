import { expect, test } from '@playwright/test';
import { loginAsAdmin } from './support/auth';

test('admin can open spell mechanics page', async ({ page }) => {
	await loginAsAdmin(page);

	await page.goto('/admin/rules/spell-mechanics');

	await expect(page.getByRole('heading', { name: 'Механики' })).toBeVisible();
});
