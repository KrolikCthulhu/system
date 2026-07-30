import { Route } from '@angular/router';
import { provideCreaturesInfrastructure } from './data/provide-creatures-infrastructure';

const providers = [...provideCreaturesInfrastructure()];

export const adminCreaturesRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import('./ui/pages/admin-creatures-page/admin-creatures-page.component').then(
				m => m.AdminCreaturesPageComponent
			)
	},
	{
		path: ':slug',
		providers,
		loadComponent: () =>
			import('./ui/pages/admin-creatures-page/admin-creatures-page.component').then(
				m => m.AdminCreaturesPageComponent
			)
	}
];
