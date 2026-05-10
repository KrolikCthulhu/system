import { Route } from '@angular/router';
import { roleChildGuard, roleGuard } from '@app/providers/auth/role.guard';
import { withRoles } from '@app/routing/route-data';

export const adminRoutes: Route[] = [
	{
		path: 'admin',
		canActivate: [roleGuard],
		canActivateChild: [roleChildGuard],
		...withRoles('ADMIN'),
		children: [
			{
				path: '',
				loadComponent: () =>
					import('@pages/admin-home/ui/admin-home-page.component').then(
						m => m.AdminHomePageComponent
					)
			}
		]
	}
];
