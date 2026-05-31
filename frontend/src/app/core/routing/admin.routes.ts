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
						path: 'skills/:skillId',
						loadComponent: () =>
							import(
								'../../features/skills/ui/pages/admin-skill-detail-page/admin-skill-detail-page.component'
							).then(m => m.AdminSkillDetailPageComponent)
					},
					{
						path: 'skills',
						pathMatch: 'full',
						loadComponent: () =>
							import(
								'../../features/skills/ui/pages/admin-skills-page/admin-skills-page.component'
							).then(m => m.AdminSkillsPageComponent)
					},
					{
						path: 'attributes',
						loadComponent: () =>
							import(
								'../../features/attributes/ui/pages/admin-attributes-page/admin-attributes-page.component'
							).then(m => m.AdminAttributesPageComponent)
					},
					{
						path: 'values',
						loadComponent: () =>
							import(
								'../../features/values/ui/pages/admin-values-page/admin-values-page.component'
							).then(m => m.AdminValuesPageComponent)
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
