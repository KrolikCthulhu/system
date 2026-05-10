import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/generated';
import { CookieOptions } from 'express';
import { createHash, randomUUID } from 'crypto';
import {
	AccessTokenPayload,
	EmailVerificationTokenPayload,
	RefreshTokenPayload
} from './auth.types';
import { authConfig } from './config/auth.config';

interface AccessTokenInput {
	userId: string;
	email: string;
	username: string;
	displayUsername: string;
	role: UserRole;
	sessionId: string;
}

interface RefreshTokenInput {
	userId: string;
	sessionId: string;
	familyId: string;
}

interface EmailVerificationTokenInput {
	userId: string;
	email: string;
}

@Injectable()
export class TokenService {
	constructor(
		private readonly jwtService: JwtService,
		@Inject(authConfig.KEY)
		private readonly authSettings: ConfigType<typeof authConfig>
	) {}

	createSessionFamilyId() {
		return randomUUID();
	}

	createSessionId() {
		return randomUUID();
	}

	async createAccessToken(input: AccessTokenInput) {
		const payload: AccessTokenPayload = {
			sub: input.userId,
			email: input.email,
			username: input.username,
			displayUsername: input.displayUsername,
			role: input.role,
			sessionId: input.sessionId,
			type: 'access'
		};

		return this.jwtService.signAsync(payload, {
			secret: this.authSettings.accessTokenSecret,
			expiresIn: Math.floor(this.authSettings.accessTokenTtlMs / 1000)
		});
	}

	async createRefreshToken(input: RefreshTokenInput) {
		const payload: RefreshTokenPayload = {
			sub: input.userId,
			sessionId: input.sessionId,
			familyId: input.familyId,
			type: 'refresh'
		};

		return this.jwtService.signAsync(payload, {
			secret: this.authSettings.refreshTokenSecret,
			expiresIn: Math.floor(this.authSettings.refreshTokenTtlMs / 1000)
		});
	}

	async createEmailVerificationToken(input: EmailVerificationTokenInput) {
		const payload: EmailVerificationTokenPayload = {
			sub: input.userId,
			email: input.email,
			type: 'email-verification'
		};

		return this.jwtService.signAsync(payload, {
			secret: this.authSettings.emailVerificationSecret,
			expiresIn: Math.floor(
				this.authSettings.emailVerificationTokenTtlMs / 1000
			)
		});
	}

	buildEmailVerificationUrl(token: string) {
		const url = new URL(this.authSettings.emailVerificationUrl);
		url.searchParams.set('token', token);

		return url.toString();
	}

	isEmailVerificationEnabled() {
		return this.authSettings.emailVerificationEnabled;
	}

	getRefreshTokenExpiresAt() {
		return new Date(Date.now() + this.authSettings.refreshTokenTtlMs);
	}

	getRefreshTokenCookieName() {
		return this.authSettings.refreshCookieName;
	}

	getRefreshTokenCookieOptions(): CookieOptions {
		return {
			httpOnly: true,
			secure: this.authSettings.cookieSecure,
			sameSite: this.authSettings.cookieSameSite,
			path: this.authSettings.refreshCookiePath,
			maxAge: this.authSettings.refreshTokenTtlMs,
			...(this.authSettings.cookieDomain
				? { domain: this.authSettings.cookieDomain }
				: {})
		};
	}

	getClearedRefreshTokenCookieOptions(): CookieOptions {
		return {
			...this.getRefreshTokenCookieOptions(),
			maxAge: 0
		};
	}

	getRefreshTokenFromCookies(cookies?: Record<string, string | undefined>) {
		if (!cookies) {
			return null;
		}

		return cookies[this.authSettings.refreshCookieName] ?? null;
	}

	hashToken(token: string) {
		return createHash('sha256').update(token).digest('hex');
	}

	verifyEmailVerificationToken(token: string) {
		return this.jwtService.verifyAsync<EmailVerificationTokenPayload>(token, {
			secret: this.authSettings.emailVerificationSecret
		});
	}

	verifyRefreshToken(token: string) {
		return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
			secret: this.authSettings.refreshTokenSecret
		});
	}
}
