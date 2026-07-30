import { Route } from '@angular/router';
import { provideAnatomySchemesInfrastructure } from './data/provide-anatomy-schemes-infrastructure';

export const adminAnatomySchemesRoutes: Route[] = [
	{
		path: '',
		providers: [...provideAnatomySchemesInfrastructure()],
		loadComponent: () =>
			import(
				'./ui/pages/admin-anatomy-schemes-page/admin-anatomy-schemes-page.component'
			).then(m => m.AdminAnatomySchemesPageComponent)
	}
];
