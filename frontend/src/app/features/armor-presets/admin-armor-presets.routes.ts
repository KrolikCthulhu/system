import { Route } from '@angular/router';
import { provideArmorPresetsInfrastructure } from './data/provide-armor-presets-infrastructure';

export const adminArmorPresetsRoutes: Route[] = [
	{
		path: '',
		providers: [...provideArmorPresetsInfrastructure()],
		loadComponent: () =>
			import(
				'./ui/pages/admin-armor-presets-page/admin-armor-presets-page.component'
			).then(m => m.AdminArmorPresetsPageComponent)
	}
];
