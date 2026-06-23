import { expect, Page } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/generated';
import { createHash, randomUUID } from 'node:crypto';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { sign } from 'jsonwebtoken';

dotenvExpand.expand(dotenv.config());

const connectionString = process.env['POSTGRES_URI'];

if (!connectionString) {
	throw new Error('POSTGRES_URI is not set.');
}

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString })
});
const refreshCookieName = process.env['COOKIE_REFRESH_NAME'] || 'refresh_token';
const refreshTokenSecret =
	process.env['JWT_REFRESH_SECRET'] || 'change-me-refresh-secret';
const accessTokenSecret =
	process.env['JWT_ACCESS_SECRET'] || 'change-me-access-secret';

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
	const user = await prisma.user.findUnique({
		where: { email: e2eAdminCredentials.email }
	});

	expect(user).not.toBeNull();
	expect(user?.role).toBe(UserRole.ADMIN);

	const session = await createE2eAdminSession({
		id: user?.id ?? '',
		email: user?.email ?? e2eAdminCredentials.email,
		username: user?.username ?? 'admin',
		displayUsername: user?.displayUsername ?? 'Admin',
		role: UserRole.ADMIN,
		isEmailVerified: user?.isEmailVerified ?? true
	});
	await page.context().addCookies([
		{
			name: refreshCookieName,
			value: session.refreshToken,
			domain: 'localhost',
			path: '/auth/refresh',
			httpOnly: true,
			sameSite: 'Lax',
			expires: Math.floor(session.refreshExpiresAt.getTime() / 1000)
		}
	]);
	await setBrowserSession(page, session);

	return session;
}

async function setBrowserSession(page: Page, session: AuthSessionResponse) {
	await page.context().addInitScript(({ accessToken, user }) => {
		window.sessionStorage.setItem('accessToken', accessToken);
		window.sessionStorage.setItem('user', JSON.stringify(user));
	}, session);
	await page.goto('/auth');
	await page.evaluate(({ accessToken, user }) => {
		window.sessionStorage.setItem('accessToken', accessToken);
		window.sessionStorage.setItem('user', JSON.stringify(user));
	}, session);
}

async function createE2eAdminSession(admin: AuthUser) {
	const sessionId = randomUUID();
	const familyId = randomUUID();
	const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
	const user: AuthUser = {
		...admin,
		sessionId
	};
	const accessToken = sign(
		{
			sub: user.id,
			email: user.email,
			username: user.username,
			displayUsername: user.displayUsername,
			role: user.role,
			sessionId,
			type: 'access'
		},
		accessTokenSecret,
		{ expiresIn: '15m' }
	);
	const refreshToken = sign(
		{
			sub: user.id,
			sessionId,
			familyId,
			type: 'refresh'
		},
		refreshTokenSecret,
		{ expiresIn: '30d' }
	);

	await prisma.authSession.create({
		data: {
			id: sessionId,
			userId: user.id,
			tokenHash: createHash('sha256').update(refreshToken).digest('hex'),
			familyId,
			expiresAt: refreshExpiresAt
		}
	});

	return { accessToken, refreshToken, refreshExpiresAt, user };
}
