import { Route } from '@angular/router';
import { adminRoutes } from './admin.routes';

export const privateRoutes: Route[] = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'admin'
	},
	...adminRoutes
];
