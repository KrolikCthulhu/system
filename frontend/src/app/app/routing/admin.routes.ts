import { Route } from '@angular/router';
import { roleChildGuard, roleGuard } from '../guards/role.guard';
import { withRoles } from './route-data';

export const adminRoutes: Route[] = [
	{
		path: 'admin',
		canActivate: [roleGuard],
		canActivateChild: [roleChildGuard],
		...withRoles('ADMIN'),
		loadComponent: () =>
			import('../layouts/admin-layout/admin-layout.component').then(
				m => m.AdminLayoutComponent
			),
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'rules/skills'
			},
			{
				path: 'rules',
				children: [
					{
						path: '',
						pathMatch: 'full',
						redirectTo: 'skills'
					},
					{
						path: 'skills',
						loadComponent: () =>
							import(
								'../../presentation/pages/admin-skills/ui/admin-skills-page.component'
							).then(m => m.AdminSkillsPageComponent)
					}
				]
			},
			{
				path: '**',
				redirectTo: 'rules/skills'
			}
		]
	}
];
