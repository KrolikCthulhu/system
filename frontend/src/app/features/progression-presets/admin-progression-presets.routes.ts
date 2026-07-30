import { Route } from '@angular/router';
import { provideProgressionPresetsInfrastructure } from './data/provide-progression-presets-infrastructure';

export const adminProgressionPresetsRoutes: Route[] = [
	{
		path: '',
		providers: [...provideProgressionPresetsInfrastructure()],
		loadComponent: () =>
			import(
				'./ui/pages/admin-progression-presets-page/admin-progression-presets-page.component'
			).then(m => m.AdminProgressionPresetsPageComponent)
	}
];
