import { Route } from '@angular/router';
import { homeLandingGuard } from '../guards/home-landing.guard';
import { adminRoutes } from './admin.routes';

export const privateRoutes: Route[] = [
	{
		path: '',
		pathMatch: 'full',
		canActivate: [homeLandingGuard],
		loadComponent: () =>
			import('../../presentation/pages/home/ui/home-page.component').then(
				m => m.HomePageComponent
			)
	},
	...adminRoutes
];
