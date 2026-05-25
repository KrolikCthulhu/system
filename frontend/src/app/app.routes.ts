import { Route } from '@angular/router';
import { authChildGuard, authGuard } from './core/guards/auth.guard';
import { authRoutes } from './core/routing/auth.routes';
import { privateRoutes } from './core/routing/private.routes';

export const appRoutes: Route[] = [
	...authRoutes,
	{
		path: '',
		canActivate: [authGuard],
		canActivateChild: [authChildGuard],
		loadComponent: () =>
			import('./core/layouts/private-layout/private-layout.component').then(
				m => m.PrivateLayoutComponent
			),
		children: privateRoutes
	},
	{
		path: '**',
		redirectTo: ''
	}
];
