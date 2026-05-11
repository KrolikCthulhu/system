import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthSessionService } from '../../use-cases/auth/state/auth-session.service';
import { getHomeUrlByRole } from './auth.guard';

function redirectTo(path: string): UrlTree {
	return inject(Router).createUrlTree([path]);
}

export const guestGuard: CanActivateFn = () => {
	const authSession = inject(AuthSessionService);

	return authSession.isAuthenticated()
		? redirectTo(getHomeUrlByRole(authSession.user()?.role))
		: true;
};
