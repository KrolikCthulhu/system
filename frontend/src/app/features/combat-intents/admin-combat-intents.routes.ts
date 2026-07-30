import { Route } from '@angular/router';
import { provideConditionsInfrastructure } from '../conditions/data/provide-conditions-infrastructure';
import { provideCombatIntentsInfrastructure } from './data/provide-combat-intents-infrastructure';

const featureProviders = [...provideCombatIntentsInfrastructure()];

const dependencyProviders = [...provideConditionsInfrastructure()];

const providers = [...featureProviders, ...dependencyProviders];

export const adminCombatIntentsRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-combat-intents-page/admin-combat-intents-page.component'
			).then(m => m.AdminCombatIntentsPageComponent)
	}
];
