import { inject } from '@angular/core';
import {
	CanActivateChildFn,
	CanActivateFn,
	Router,
	UrlTree
} from '@angular/router';
import { AuthSessionService } from '../../features/auth/state/auth-session.service';
import { AuthUserRole } from '../../features/auth/domain/auth.models';

function redirectTo(path: string): UrlTree {
	return inject(Router).createUrlTree([path]);
}

function checkAuthenticated(): true | UrlTree {
	const authSession = inject(AuthSessionService);

	return authSession.isAuthenticated() ? true : redirectTo('/auth');
}

export function getHomeUrlByRole(role: AuthUserRole | undefined): string {
	return role === 'ADMIN' ? '/admin' : '/auth';
}

export const authGuard: CanActivateFn = () => checkAuthenticated();

export const authChildGuard: CanActivateChildFn = () => checkAuthenticated();
