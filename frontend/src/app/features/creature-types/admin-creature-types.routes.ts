import { Route } from '@angular/router';
import { provideCreatureTypesInfrastructure } from './data/provide-creature-types-infrastructure';

export const adminCreatureTypesRoutes: Route[] = [
	{
		path: '',
		providers: [...provideCreatureTypesInfrastructure()],
		loadComponent: () =>
			import(
				'./ui/pages/admin-creature-types-page/admin-creature-types-page.component'
			).then(m => m.AdminCreatureTypesPageComponent)
	}
];
