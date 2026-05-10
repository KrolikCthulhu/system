import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthSessionService } from '@entities/session/model/auth-session.service';
import { getHomeUrlByRole } from '@app/providers/auth/auth.guard';

function redirectTo(path: string): UrlTree {
	return inject(Router).createUrlTree([path]);
}

export const guestGuard: CanActivateFn = () => {
	const authSession = inject(AuthSessionService);

	return authSession.isAuthenticated()
		? redirectTo(getHomeUrlByRole(authSession.user()?.role))
		: true;
};
