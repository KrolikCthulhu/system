import { Route } from '@angular/router';
import { guestGuard } from '../guards/guest.guard';

export const authRoutes: Route[] = [
	{
		path: 'auth',
		canActivate: [guestGuard],
		loadComponent: () =>
			import('../../features/auth/ui/pages/auth-page/auth-page.component').then(
				m => m.AuthPageComponent
			)
	}
];
