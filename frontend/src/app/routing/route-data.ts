import { ActivatedRouteSnapshot, Data, Route } from '@angular/router';
import { AuthUserRole } from '@entities/session/model/session.types';

export interface AppRouteData extends Data {
	roles?: readonly AuthUserRole[];
}

export function withRoles(...roles: AuthUserRole[]): Pick<Route, 'data'> {
	return {
		data: {
			roles
		} satisfies AppRouteData
	};
}

export function getRouteData(
	route: ActivatedRouteSnapshot | Route
): AppRouteData | undefined {
	return route.data as AppRouteData | undefined;
}
