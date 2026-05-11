import { Injectable } from '@angular/core';
import { AuthSessionStorage } from '../../use-cases/auth/ports/auth-session-storage.port';
import { AuthSession } from '../../domain/auth/auth.models';

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
const USER_STORAGE_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class BrowserAuthSessionStorageService implements AuthSessionStorage {
	readSession(): AuthSession | null {
		const accessToken = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
		const rawUser = sessionStorage.getItem(USER_STORAGE_KEY);

		if (!accessToken || !rawUser) {
			return null;
		}

		try {
			return {
				accessToken,
				user: JSON.parse(rawUser) as AuthSession['user']
			};
		} catch {
			this.clear();
			return null;
		}
	}

	writeSession(session: AuthSession): void {
		sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.accessToken);
		sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
	}

	clear(): void {
		sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
		sessionStorage.removeItem(USER_STORAGE_KEY);
	}
}
