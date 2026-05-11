import { Route } from '@angular/router';
import { authChildGuard, authGuard } from './app/guards/auth.guard';
import { authRoutes } from './app/routing/auth.routes';
import { privateRoutes } from './app/routing/private.routes';

export const appRoutes: Route[] = [
	...authRoutes,
	{
		path: '',
		canActivate: [authGuard],
		canActivateChild: [authChildGuard],
		loadComponent: () =>
			import('./app/layouts/private-layout/private-layout.component').then(
				m => m.PrivateLayoutComponent
			),
		children: privateRoutes
	},
	{
		path: '**',
		redirectTo: ''
	}
];
