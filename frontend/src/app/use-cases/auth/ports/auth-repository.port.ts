import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthSession } from '../../../domain/auth/auth.models';
import { SignInCommand, SignUpCommand } from '../commands/auth.commands';

export interface AuthRepository {
	signIn(command: SignInCommand): Observable<AuthSession>;
	signUp(command: SignUpCommand): Observable<void>;
	restoreSession(): Observable<AuthSession>;
	logout(): Observable<void>;
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>(
	'AUTH_REPOSITORY'
);
