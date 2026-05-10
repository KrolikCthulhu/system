import { computed, inject, Injectable, signal } from '@angular/core';
import {
	EMPTY,
	Observable,
	catchError,
	finalize,
	ignoreElements,
	map,
	switchMap,
	tap
} from 'rxjs';
import { AuthApiService } from '@entities/session/api/auth-api.service';
import { SignInPayload } from '@entities/session/api/auth.contracts';
import { AuthUser } from '@entities/session/model/session.types';

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
const USER_STORAGE_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
	private readonly authApi = inject(AuthApiService);

	private readonly accessTokenState = signal<string | null>(
		sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
	);
	private readonly userState = signal<AuthUser | null>(this.readStoredUser());
	private readonly initializedState = signal(false);

	readonly accessToken = this.accessTokenState.asReadonly();
	readonly user = this.userState.asReadonly();
	readonly initialized = this.initializedState.asReadonly();
	readonly isAuthenticated = computed(
		() => !!this.accessTokenState() && !!this.userState()
	);

	restoreSession(): Observable<AuthUser> {
		return this.authApi.refresh().pipe(
			tap(refreshResult => {
				this.setAccessToken(refreshResult.accessToken);
			}),
			switchMap(() => this.authApi.me()),
			tap(user => {
				this.setUser(user);
			})
		);
	}

	initializeSession(): Observable<never> {
		return this.restoreSession().pipe(
			ignoreElements(),
			catchError(() => {
				this.clearSession();
				return EMPTY;
			}),
			finalize(() => {
				this.initializedState.set(true);
			})
		);
	}

	signIn(payload: SignInPayload): Observable<AuthUser> {
		return this.authApi.login(payload).pipe(
			tap(result => {
				this.setSession(result.accessToken, result.user);
			}),
			map(result => result.user)
		);
	}

	logout(): Observable<never> {
		if (!this.accessTokenState()) {
			this.clearSession();
			return EMPTY;
		}

		return this.authApi.logout().pipe(
			ignoreElements(),
			finalize(() => {
				this.clearSession();
			})
		);
	}

	private setSession(accessToken: string, user: AuthUser) {
		this.setAccessToken(accessToken);
		this.setUser(user);
	}

	private setAccessToken(accessToken: string) {
		this.accessTokenState.set(accessToken);
		sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
	}

	private setUser(user: AuthUser) {
		this.userState.set(user);
		sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
	}

	private clearSession() {
		this.accessTokenState.set(null);
		this.userState.set(null);
		sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
		sessionStorage.removeItem(USER_STORAGE_KEY);
	}

	private readStoredUser() {
		const raw = sessionStorage.getItem(USER_STORAGE_KEY);

		if (!raw) {
			return null;
		}

		try {
			return JSON.parse(raw) as AuthUser;
		} catch {
			sessionStorage.removeItem(USER_STORAGE_KEY);
			return null;
		}
	}
}
