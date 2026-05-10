import { inject } from '@angular/core';
import {
	CanActivateChildFn,
	CanActivateFn,
	Router,
	UrlTree
} from '@angular/router';
import { AuthSessionService } from '@entities/session/model/auth-session.service';
import { AuthUserRole } from '@entities/session/model/session.types';

function redirectTo(path: string): UrlTree {
	return inject(Router).createUrlTree([path]);
}

function checkAuthenticated(): true | UrlTree {
	const authSession = inject(AuthSessionService);

	return authSession.isAuthenticated() ? true : redirectTo('/auth');
}

export function getHomeUrlByRole(role: AuthUserRole | undefined): string {
	return role === 'ADMIN' ? '/admin' : '/';
}

export const authGuard: CanActivateFn = () => checkAuthenticated();

export const authChildGuard: CanActivateChildFn = () => checkAuthenticated();
