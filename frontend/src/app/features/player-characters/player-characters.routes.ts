import { Route } from '@angular/router';
import { provideAttributesInfrastructure } from '../attributes/data/provide-attributes-infrastructure';
import { provideSkillsInfrastructure } from '../skills/data/provide-skills-infrastructure';
import { provideValuesInfrastructure } from '../values/data/provide-values-infrastructure';
import { providePlayerCharactersInfrastructure } from './data/provide-player-characters-infrastructure';

const featureProviders = [...providePlayerCharactersInfrastructure()];

const dependencyProviders = [
	...provideAttributesInfrastructure(),
	...provideSkillsInfrastructure(),
	...provideValuesInfrastructure()
];

const providers = [...featureProviders, ...dependencyProviders];

export const playerCharacterEditorRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/player-character-editor-page/player-character-editor-page.component'
			).then(m => m.PlayerCharacterEditorPageComponent)
	}
];
