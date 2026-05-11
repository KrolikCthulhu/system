import { inject } from '@angular/core';
import {
	ActivatedRouteSnapshot,
	CanActivateChildFn,
	CanActivateFn,
	Router,
	UrlTree
} from '@angular/router';
import { AuthSessionService } from '../../use-cases/auth/state/auth-session.service';
import { AuthUserRole } from '../../domain/auth/auth.models';
import { getHomeUrlByRole } from './auth.guard';
import { getRouteData } from '../routing/route-data';

function getAllowedRoles(route: ActivatedRouteSnapshot): AuthUserRole[] {
	for (const snapshot of [...route.pathFromRoot].reverse()) {
		const roles = getRouteData(snapshot)?.roles;

		if (roles?.length) {
			return [...roles];
		}
	}

	return [];
}

function resolveRoleAccess(route: ActivatedRouteSnapshot): true | UrlTree {
	const authSession = inject(AuthSessionService);
	const router = inject(Router);
	const user = authSession.user();
	const allowedRoles = getAllowedRoles(route);

	if (!user) {
		return router.createUrlTree(['/auth']);
	}

	if (allowedRoles.includes(user.role)) {
		return true;
	}

	return router.createUrlTree([getHomeUrlByRole(user.role)]);
}

export const roleGuard: CanActivateFn = route => resolveRoleAccess(route);

export const roleChildGuard: CanActivateChildFn = childRoute =>
	resolveRoleAccess(childRoute);
