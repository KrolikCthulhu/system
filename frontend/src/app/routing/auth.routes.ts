import { Route } from '@angular/router';
import { guestGuard } from '@app/providers/auth/guest.guard';

export const authRoutes: Route[] = [
	{
		path: 'auth',
		canActivate: [guestGuard],
		loadComponent: () =>
			import('@pages/auth/ui/auth-page.component').then(
				m => m.AuthPageComponent
			)
	}
];
