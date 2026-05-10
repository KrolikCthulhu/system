import { Route } from '@angular/router';
import { homeLandingGuard } from '@app/providers/auth/home-landing.guard';
import { adminRoutes } from '@app/routing/admin.routes';

export const privateRoutes: Route[] = [
	{
		path: '',
		pathMatch: 'full',
		canActivate: [homeLandingGuard],
		loadComponent: () =>
			import('@pages/home/ui/home-page.component').then(
				m => m.HomePageComponent
			)
	},
	...adminRoutes
];
