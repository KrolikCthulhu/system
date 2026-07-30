import { Route } from '@angular/router';
import { provideValuesInfrastructure } from '../values/data/provide-values-infrastructure';
import { SystemValuesCatalogFacade } from '../values/state/system-values-catalog.facade';
import { provideAttributesInfrastructure } from './data/provide-attributes-infrastructure';

const featureProviders = [...provideAttributesInfrastructure()];

const dependencyProviders = [
	...provideValuesInfrastructure(),
	SystemValuesCatalogFacade
];

const providers = [...featureProviders, ...dependencyProviders];

export const adminAttributesRoutes: Route[] = [
	{
		path: '',
		pathMatch: 'full',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-attributes-page/admin-attributes-page.component'
			).then(m => m.AdminAttributesPageComponent)
	},
	{
		path: 'attribute/:attributeId',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-attribute-detail-page/admin-attribute-detail-page.component'
			).then(m => m.AdminAttributeDetailPageComponent)
	},
	{
		path: 'characteristic/:characteristicId',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-characteristic-detail-page/admin-characteristic-detail-page.component'
			).then(m => m.AdminCharacteristicDetailPageComponent)
	}
];
