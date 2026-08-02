import { Route } from '@angular/router';
import { provideSystemCombatActionsInfrastructure } from './data/provide-system-combat-actions-infrastructure';

export const adminSystemCombatActionsRoutes: Route[] = [
	{
		path: '',
		providers: [...provideSystemCombatActionsInfrastructure()],
		loadComponent: () =>
			import(
				'./ui/pages/admin-system-combat-actions-page/admin-system-combat-actions-page.component'
			).then(m => m.AdminSystemCombatActionsPageComponent)
	}
];
