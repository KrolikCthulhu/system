import { Route } from '@angular/router';
import { provideCombatEncountersInfrastructure } from '../combat-encounters/data/provide-combat-encounters-infrastructure';
import { providePlayerCharactersInfrastructure } from '../player-characters/data/provide-player-characters-infrastructure';
import { provideCampaignsInfrastructure } from './data/provide-campaigns-infrastructure';

const featureProviders = [...provideCampaignsInfrastructure()];

const dependencyProviders = [
	...providePlayerCharactersInfrastructure(),
	...provideCombatEncountersInfrastructure()
];

const providers = [...featureProviders, ...dependencyProviders];

export const campaignsRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import('./ui/pages/campaigns-page/campaigns-page.component').then(
				m => m.CampaignsPageComponent
			)
	}
];
