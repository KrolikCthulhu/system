export type AuthUserRole = 'USER' | 'ADMIN';

export interface AuthUser {
	id: string;
	email: string;
	username: string;
	displayUsername: string;
	role: AuthUserRole;
	isEmailVerified?: boolean;
	sessionId?: string;
}

export interface AuthSession {
	accessToken: string;
	user: AuthUser;
}
