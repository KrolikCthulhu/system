import { registerAs } from '@nestjs/config';

const DURATION_PATTERN = /^(\d+)([smhd])$/;

function parseBoolean(value: string | undefined, defaultValue: boolean) {
	if (value === undefined || value === '') {
		return defaultValue;
	}

	return value === 'true';
}

function parseDurationToMs(value: string, name: string) {
	const match = DURATION_PATTERN.exec(value);

	if (!match) {
		throw new Error(`${name} must match <number><s|m|h|d>. Received "${value}".`);
	}

	const amount = Number(match[1]);
	const unit = match[2];

	switch (unit) {
		case 's':
			return amount * 1000;
		case 'm':
			return amount * 60 * 1000;
		case 'h':
			return amount * 60 * 60 * 1000;
		case 'd':
			return amount * 24 * 60 * 60 * 1000;
		default:
			throw new Error(`Unsupported duration unit "${unit}".`);
	}
}

export const authConfig = registerAs('auth', () => {
	const accessTokenTtl = process.env.JWT_ACCESS_TTL ?? '15m';
	const refreshTokenTtl = process.env.JWT_REFRESH_TTL ?? '30d';
	const emailVerificationTokenTtl =
		process.env.EMAIL_VERIFICATION_TOKEN_TTL ?? '24h';
	const emailVerificationResendCooldown =
		process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN ?? '60s';
	const authCleanupRetention =
		process.env.AUTH_CLEANUP_RETENTION ?? '1d';
	const throttleDefaultTtl = process.env.THROTTLE_DEFAULT_TTL ?? '60s';
	const cookieSameSite = (process.env.COOKIE_SAME_SITE ?? 'lax').toLowerCase();

	if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
		throw new Error(
			'COOKIE_SAME_SITE must be one of: lax, strict, none.'
		);
	}

	return {
		accessTokenSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
		accessTokenTtl,
		accessTokenTtlMs: parseDurationToMs(accessTokenTtl, 'JWT_ACCESS_TTL'),
		refreshTokenSecret:
			process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
		refreshTokenTtl,
		refreshTokenTtlMs: parseDurationToMs(refreshTokenTtl, 'JWT_REFRESH_TTL'),
		emailVerificationSecret:
			process.env.EMAIL_VERIFICATION_SECRET ??
			'change-me-email-verification-secret',
		emailVerificationEnabled: parseBoolean(
			process.env.EMAIL_VERIFICATION_ENABLED,
			false
		),
		emailVerificationTokenTtl,
		emailVerificationTokenTtlMs: parseDurationToMs(
			emailVerificationTokenTtl,
			'EMAIL_VERIFICATION_TOKEN_TTL'
		),
		emailVerificationResendCooldown,
		emailVerificationResendCooldownMs: parseDurationToMs(
			emailVerificationResendCooldown,
			'EMAIL_VERIFICATION_RESEND_COOLDOWN'
		),
		emailVerificationUrl:
			process.env.EMAIL_VERIFICATION_URL ??
			`${process.env.ALLOWED_ORIGIN ?? 'http://localhost:3000'}/auth/verify-email`,
		authCleanupRetention,
		authCleanupRetentionMs: parseDurationToMs(
			authCleanupRetention,
			'AUTH_CLEANUP_RETENTION'
		),
		throttleDefaultTtl,
		throttleDefaultTtlMs: parseDurationToMs(
			throttleDefaultTtl,
			'THROTTLE_DEFAULT_TTL'
		),
		throttleDefaultLimit: Number(process.env.THROTTLE_DEFAULT_LIMIT ?? 60),
		refreshCookieName: process.env.COOKIE_REFRESH_NAME ?? 'refresh_token',
		refreshCookiePath: process.env.COOKIE_REFRESH_PATH ?? '/auth/refresh',
		cookieDomain: process.env.COOKIE_DOMAIN || undefined,
		cookieSecure: parseBoolean(process.env.COOKIE_SECURE, false),
		cookieSameSite: cookieSameSite as 'lax' | 'strict' | 'none'
	};
});
