import { Route } from '@angular/router';
import { provideCreaturesInfrastructure } from '../creatures/data/provide-creatures-infrastructure';
import { providePlayerCharactersInfrastructure } from '../player-characters/data/provide-player-characters-infrastructure';
import { provideCombatEncountersInfrastructure } from './data/provide-combat-encounters-infrastructure';

const featureProviders = [...provideCombatEncountersInfrastructure()];

const dependencyProviders = [
	...providePlayerCharactersInfrastructure(),
	...provideCreaturesInfrastructure()
];

const providers = [...featureProviders, ...dependencyProviders];

export const combatEncounterRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/combat-encounter-page/combat-encounter-page.component'
			).then(m => m.CombatEncounterPageComponent)
	}
];
