import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { loginAsAdmin } from './support/auth';

interface SpellCatalogResponse {
	groups: Array<{
		formulas: Array<{
			action: { id: string };
			essence: { id: string };
			gesture: { id: string };
			spell: { id: string } | null;
		}>;
	}>;
}

const apiBaseUrl = process.env['E2E_API_BASE_URL'] || 'http://localhost:4000';
const screenshotDir = '__screenshots__';

test('admin can configure spell area tab', async ({ page }, testInfo) => {
	const session = await loginAsAdmin(page);

	const response = await page
		.context()
		.request.get(`${apiBaseUrl}/admin/magic/spells/catalog`, {
			headers: {
				Authorization: `Bearer ${session.accessToken}`
			}
		});

	expect(response.ok()).toBeTruthy();

	const catalog = (await response.json()) as SpellCatalogResponse;
	const formulaUrl = catalog.groups
		.flatMap(group => group.formulas)
		.map(item =>
			item.spell
				? `/admin/rules/spells/${item.spell.id}`
				: `/admin/rules/spells/formula/${item.action.id}/${item.essence.id}/${item.gesture.id}`
		)
		.find(Boolean);

	expect(formulaUrl).toBeTruthy();

	await page.goto(formulaUrl as string, { waitUntil: 'domcontentloaded' });
	await page.evaluate(({ accessToken, user }) => {
		window.sessionStorage.setItem('accessToken', accessToken);
		window.sessionStorage.setItem('user', JSON.stringify(user));
	}, session);
	await page.goto(formulaUrl as string, { waitUntil: 'domcontentloaded' });
	await page.getByRole('tab', { name: 'Область' }).click();

	await expect(page.locator('.admin-spell-detail-page__area-panel')).toBeVisible();
	await expect(page.locator('.admin-spell-detail-page__area-head')).toBeVisible();

	mkdirSync(screenshotDir, { recursive: true });
	await page.screenshot({
		path: `${screenshotDir}/admin-spell-area.png`,
		fullPage: true
	});
	await testInfo.attach('admin-spell-area', {
		body: await page.screenshot({ fullPage: true }),
		contentType: 'image/png'
	});
});
