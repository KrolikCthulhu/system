import { expect, Page } from '@playwright/test';

const apiBaseUrl = process.env['E2E_API_BASE_URL'] || 'http://localhost:4000';

export const e2eAdminCredentials = {
	email: process.env['E2E_ADMIN_EMAIL'] || 'admin@system.local',
	password: process.env['E2E_ADMIN_PASSWORD'] || 'Admin12345!'
} as const;

interface AuthUser {
	id: string;
	email: string;
	username: string;
	displayUsername: string;
	role: 'USER' | 'ADMIN';
	isEmailVerified?: boolean;
	sessionId?: string;
}

interface AuthSessionResponse {
	accessToken: string;
	user: AuthUser;
}

export async function loginAsAdmin(page: Page) {
	const response = await page.context().request.post(`${apiBaseUrl}/auth/login`, {
		data: e2eAdminCredentials
	});

	expect(response.ok()).toBeTruthy();

	const session = (await response.json()) as AuthSessionResponse;

	expect(session.user.role).toBe('ADMIN');

	await page.addInitScript(({ accessToken, user }) => {
		window.sessionStorage.setItem('accessToken', accessToken);
		window.sessionStorage.setItem('user', JSON.stringify(user));
	}, session);

	return session;
}
