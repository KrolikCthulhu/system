import { Route } from '@angular/router';
import { provideWeaponsInfrastructure } from './data/provide-weapons-infrastructure';

const providers = [...provideWeaponsInfrastructure()];

export const adminNaturalAttacksRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-natural-attacks-page/admin-natural-attacks-page.component'
			).then(m => m.AdminNaturalAttacksPageComponent)
	}
];

export const adminWeaponTemplatesRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-weapon-templates-page/admin-weapon-templates-page.component'
			).then(m => m.AdminWeaponTemplatesPageComponent)
	}
];

export const adminWeaponsRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import('./ui/pages/admin-weapons-page/admin-weapons-page.component').then(
				m => m.AdminWeaponsPageComponent
			)
	}
];
