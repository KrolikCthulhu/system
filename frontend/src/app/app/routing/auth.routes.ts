import { Route } from '@angular/router';
import { guestGuard } from '../guards/guest.guard';

export const authRoutes: Route[] = [
	{
		path: 'auth',
		canActivate: [guestGuard],
		loadComponent: () =>
			import('../../presentation/pages/auth/ui/auth-page.component').then(
				m => m.AuthPageComponent
			)
	}
];
