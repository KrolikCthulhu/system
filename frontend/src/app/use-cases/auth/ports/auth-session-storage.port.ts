import { InjectionToken } from '@angular/core';
import { AuthSession } from '../../../domain/auth/auth.models';

export interface AuthSessionStorage {
	readSession(): AuthSession | null;
	writeSession(session: AuthSession): void;
	clear(): void;
}

export const AUTH_SESSION_STORAGE = new InjectionToken<AuthSessionStorage>(
	'AUTH_SESSION_STORAGE'
);
