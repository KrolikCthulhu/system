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
		loadComponent: () =>
			import(
				'../../features/campaigns/ui/pages/campaigns-page/campaigns-page.component'
			).then(m => m.CampaignsPageComponent)
	},
	{
		path: 'characters/:id',
		loadComponent: () =>
			import(
				'../../features/player-characters/ui/pages/player-character-editor-page/player-character-editor-page.component'
			).then(m => m.PlayerCharacterEditorPageComponent)
	},
	{
		path: 'combat-encounters/:id',
		loadComponent: () =>
			import(
				'../../features/combat-encounters/ui/pages/combat-encounter-page/combat-encounter-page.component'
			).then(m => m.CombatEncounterPageComponent)
	},
	...adminRoutes
];
