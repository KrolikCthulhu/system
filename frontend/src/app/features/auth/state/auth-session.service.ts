import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthSession, AuthUser } from '../domain/auth.models';
import { AUTH_SESSION_STORAGE } from '../data/auth-session-storage.port';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
	private readonly storage = inject(AUTH_SESSION_STORAGE);
	private readonly storedSession = this.storage.readSession();

	private readonly accessTokenState = signal<string | null>(
		this.storedSession?.accessToken ?? null
	);
	private readonly userState = signal<AuthUser | null>(
		this.storedSession?.user ?? null
	);
	private readonly initializedState = signal(false);

	readonly accessToken = this.accessTokenState.asReadonly();
	readonly user = this.userState.asReadonly();
	readonly initialized = this.initializedState.asReadonly();
	readonly isAuthenticated = computed(
		() => !!this.accessTokenState() && !!this.userState()
	);

	setSession(session: AuthSession) {
		this.accessTokenState.set(session.accessToken);
		this.userState.set(session.user);
		this.storage.writeSession(session);
	}

	clearSession() {
		this.accessTokenState.set(null);
		this.userState.set(null);
		this.storage.clear();
	}

	markInitialized() {
		this.initializedState.set(true);
	}

	getSnapshot(): AuthSession | null {
		const accessToken = this.accessTokenState();
		const user = this.userState();

		return accessToken && user ? { accessToken, user } : null;
	}
}
