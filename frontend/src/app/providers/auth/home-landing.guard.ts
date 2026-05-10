import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '@entities/session/model/auth-session.service';
import { getHomeUrlByRole } from '@app/providers/auth/auth.guard';

export const homeLandingGuard: CanActivateFn = () => {
	const authSession = inject(AuthSessionService);
	const router = inject(Router);
	const user = authSession.user();
	const target = getHomeUrlByRole(user?.role);

	return target === '/' ? true : router.createUrlTree([target]);
};
