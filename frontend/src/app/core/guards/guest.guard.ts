import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthSessionService } from '../../features/auth/state/auth-session.service';
import { getHomeUrlByRole } from './auth.guard';

function redirectTo(path: string): UrlTree {
	return inject(Router).createUrlTree([path]);
}

export const guestGuard: CanActivateFn = () => {
	const authSession = inject(AuthSessionService);
	const role = authSession.user()?.role;

	if (!authSession.isAuthenticated()) {
		return true;
	}

	return role === 'ADMIN' ? redirectTo(getHomeUrlByRole(role)) : true;
};
