import { Route } from '@angular/router';
import { provideValuesInfrastructure } from '../values/data/provide-values-infrastructure';
import { SystemValuesCatalogFacade } from '../values/state/system-values-catalog.facade';
import { provideRollConsequencesInfrastructure } from './data/provide-roll-consequences-infrastructure';

const featureProviders = [...provideRollConsequencesInfrastructure()];

const dependencyProviders = [
	...provideValuesInfrastructure(),
	SystemValuesCatalogFacade
];

const providers = [...featureProviders, ...dependencyProviders];

export const adminRollConsequencesRoutes: Route[] = [
	{
		path: '',
		pathMatch: 'full',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-roll-consequences-page/admin-roll-consequences-page.component'
			).then(m => m.AdminRollConsequencesPageComponent)
	},
	{
		path: ':consequenceId',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-roll-consequence-detail-page/admin-roll-consequence-detail-page.component'
			).then(m => m.AdminRollConsequenceDetailPageComponent)
	}
];
