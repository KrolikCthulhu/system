import { Route } from '@angular/router';
import { provideDamageTypesInfrastructure } from './data/provide-damage-types-infrastructure';

export const adminDamageTypesRoutes: Route[] = [
	{
		path: '',
		providers: [...provideDamageTypesInfrastructure()],
		loadComponent: () =>
			import(
				'./ui/pages/admin-damage-types-page/admin-damage-types-page.component'
			).then(m => m.AdminDamageTypesPageComponent)
	}
];
