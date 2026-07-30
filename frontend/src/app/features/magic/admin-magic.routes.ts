import { Route } from '@angular/router';
import { provideCharacterSheetInfrastructure } from '../character-sheet/data/provide-character-sheet-infrastructure';
import { provideConditionsInfrastructure } from '../conditions/data/provide-conditions-infrastructure';
import { provideCreaturesInfrastructure } from '../creatures/data/provide-creatures-infrastructure';
import { provideDamageTypesInfrastructure } from '../damage-types/data/provide-damage-types-infrastructure';
import { provideProgressionPresetsInfrastructure } from '../progression-presets/data/provide-progression-presets-infrastructure';
import { provideSkillsInfrastructure } from '../skills/data/provide-skills-infrastructure';
import { provideSpellMechanicsInfrastructure } from '../spell-mechanics/data/provide-spell-mechanics-infrastructure';
import { provideValuesInfrastructure } from '../values/data/provide-values-infrastructure';
import { provideMagicWordsInfrastructure } from './data/provide-magic-words-infrastructure';

const magicWordsFeatureProviders = [...provideMagicWordsInfrastructure()];

const magicWordsEditorDependencyProviders = [
	...provideSkillsInfrastructure(),
	...provideDamageTypesInfrastructure(),
	...provideConditionsInfrastructure()
];

const magicWordsEditorProviders = [
	...magicWordsFeatureProviders,
	...magicWordsEditorDependencyProviders
];

const spellDetailFeatureProviders = [...provideMagicWordsInfrastructure()];

const spellDetailDependencyProviders = [
	...provideSpellMechanicsInfrastructure(),
	...provideSkillsInfrastructure(),
	...provideDamageTypesInfrastructure(),
	...provideConditionsInfrastructure(),
	...provideCreaturesInfrastructure(),
	...provideProgressionPresetsInfrastructure(),
	...provideValuesInfrastructure(),
	...provideCharacterSheetInfrastructure()
];

const spellDetailProviders = [
	...spellDetailFeatureProviders,
	...spellDetailDependencyProviders
];

export const adminMagicWordsRoutes: Route[] = [
	{
		path: '',
		providers: magicWordsEditorProviders,
		loadComponent: () =>
			import(
				'./ui/pages/admin-magic-words-page/admin-magic-words-page.component'
			).then(m => m.AdminMagicWordsPageComponent)
	}
];

export const adminSpellsRoutes: Route[] = [
	{
		path: '',
		pathMatch: 'full',
		providers: magicWordsFeatureProviders,
		loadComponent: () =>
			import('./ui/pages/admin-spells-page/admin-spells-page.component').then(
				m => m.AdminSpellsPageComponent
			)
	},
	{
		path: 'formula/:actionId/:essenceId/:gestureId',
		providers: spellDetailProviders,
		loadComponent: () =>
			import(
				'./ui/pages/admin-spell-detail-page/admin-spell-detail-page.component'
			).then(m => m.AdminSpellDetailPageComponent)
	},
	{
		path: ':spellId',
		providers: spellDetailProviders,
		loadComponent: () =>
			import(
				'./ui/pages/admin-spell-detail-page/admin-spell-detail-page.component'
			).then(m => m.AdminSpellDetailPageComponent)
	}
];
