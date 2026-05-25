import { inject, Injectable } from '@angular/core';
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
import { AUTH_REPOSITORY } from '../data/auth-repository.port';
import { AuthUser } from '../domain/auth.models';
import { SignInCommand, SignUpCommand } from './auth.commands';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
	private readonly authRepository = inject(AUTH_REPOSITORY);
	private readonly authSession = inject(AuthSessionService);

	readonly user = this.authSession.user;
	readonly isAuthenticated = this.authSession.isAuthenticated;
	readonly initialized = this.authSession.initialized;

	signIn(command: SignInCommand): Observable<AuthUser> {
		return this.authRepository.signIn(command).pipe(
			tap(session => {
				this.authSession.setSession(session);
			}),
			map(session => session.user)
		);
	}

	signUp(command: SignUpCommand): Observable<AuthUser> {
		return this.authRepository.signUp(command).pipe(
			switchMap(() =>
				this.signIn({
					email: command.email,
					password: command.password
				})
			)
		);
	}

	logout(): Observable<never> {
		if (!this.authSession.accessToken()) {
			this.authSession.clearSession();
			return EMPTY;
		}

		return this.authRepository.logout().pipe(
			ignoreElements(),
			finalize(() => {
				this.authSession.clearSession();
			})
		);
	}

	initializeSession(): Observable<never> {
		return this.authRepository.restoreSession().pipe(
			tap(session => {
				this.authSession.setSession(session);
			}),
			ignoreElements(),
			catchError(() => {
				this.authSession.clearSession();
				return EMPTY;
			}),
			finalize(() => {
				this.authSession.markInitialized();
			})
		);
	}
}
