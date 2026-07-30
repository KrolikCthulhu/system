import { Route } from '@angular/router';
import { provideAttributesInfrastructure } from '../attributes/data/provide-attributes-infrastructure';
import { provideSkillsInfrastructure } from '../skills/data/provide-skills-infrastructure';
import { provideValuesInfrastructure } from '../values/data/provide-values-infrastructure';
import { provideCharacterSheetInfrastructure } from './data/provide-character-sheet-infrastructure';
import { AdminCharacterSheetFacade } from './state/admin-character-sheet.facade';

const featureProviders = [
	...provideCharacterSheetInfrastructure(),
	AdminCharacterSheetFacade
];

const dependencyProviders = [
	...provideAttributesInfrastructure(),
	...provideSkillsInfrastructure(),
	...provideValuesInfrastructure()
];

const providers = [...featureProviders, ...dependencyProviders];

export const adminCharacterSheetRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-character-sheet-page/admin-character-sheet-page.component'
			).then(m => m.AdminCharacterSheetPageComponent)
	}
];
