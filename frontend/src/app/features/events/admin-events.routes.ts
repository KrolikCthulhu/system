import { Route } from '@angular/router';
import { provideRollConsequencesInfrastructure } from '../roll-consequences/data/provide-roll-consequences-infrastructure';
import { provideGameEventsInfrastructure } from './data/provide-game-events-infrastructure';
import { AdminEventsFacade } from './state/admin-events.facade';

const featureProviders = [
	...provideGameEventsInfrastructure(),
	AdminEventsFacade
];

const dependencyProviders = [...provideRollConsequencesInfrastructure()];

const providers = [...featureProviders, ...dependencyProviders];

export const adminEventsRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import('./ui/pages/admin-events-page/admin-events-page.component').then(
				m => m.AdminEventsPageComponent
			)
	}
];
