import { Route } from '@angular/router';
import { provideValuesInfrastructure } from './data/provide-values-infrastructure';
import { SystemValuesCatalogFacade } from './state/system-values-catalog.facade';

export const adminValuesRoutes: Route[] = [
	{
		path: '',
		providers: [
			...provideValuesInfrastructure(),
			SystemValuesCatalogFacade
		],
		loadComponent: () =>
			import('./ui/pages/admin-values-page/admin-values-page.component').then(
				m => m.AdminValuesPageComponent
			)
	}
];
