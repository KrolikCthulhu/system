import { Route } from '@angular/router';
import { adminRoutes } from './admin.routes';

export const privateRoutes: Route[] = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'campaigns'
	},
	{
		path: 'campaigns',
		loadChildren: () =>
			import('../../features/campaigns/campaigns.routes').then(
				m => m.campaignsRoutes
			)
	},
	{
		path: 'characters/:id',
		loadChildren: () =>
			import('../../features/player-characters/player-characters.routes').then(
				m => m.playerCharacterEditorRoutes
			)
	},
	{
		path: 'combat-encounters/:id',
		loadChildren: () =>
			import('../../features/combat-encounters/combat-encounters.routes').then(
				m => m.combatEncounterRoutes
			)
	},
	...adminRoutes
];
