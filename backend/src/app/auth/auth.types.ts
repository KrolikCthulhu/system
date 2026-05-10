import { UserRole } from '@prisma/generated';

export interface AuthenticatedUser {
	id: string;
	email: string;
	username: string;
	displayUsername: string;
	role: UserRole;
	sessionId: string;
}

export interface AccessTokenPayload {
	sub: string;
	email: string;
	username: string;
	displayUsername: string;
	role: UserRole;
	sessionId: string;
	type: 'access';
}

export interface RefreshTokenPayload {
	sub: string;
	sessionId: string;
	familyId: string;
	type: 'refresh';
}

export interface EmailVerificationTokenPayload {
	sub: string;
	email: string;
	type: 'email-verification';
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		email: string;
		username: string;
		displayUsername: string;
		role: UserRole;
		isEmailVerified: boolean;
	};
}
