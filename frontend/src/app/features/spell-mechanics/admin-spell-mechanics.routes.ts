import { Route } from '@angular/router';
import { provideConditionsInfrastructure } from '../conditions/data/provide-conditions-infrastructure';
import { provideDamageTypesInfrastructure } from '../damage-types/data/provide-damage-types-infrastructure';
import { provideSkillsInfrastructure } from '../skills/data/provide-skills-infrastructure';
import { provideValuesInfrastructure } from '../values/data/provide-values-infrastructure';
import { provideSpellMechanicsInfrastructure } from './data/provide-spell-mechanics-infrastructure';

const featureProviders = [...provideSpellMechanicsInfrastructure()];

const dependencyProviders = [
	...provideSkillsInfrastructure(),
	...provideDamageTypesInfrastructure(),
	...provideConditionsInfrastructure(),
	...provideValuesInfrastructure()
];

const providers = [...featureProviders, ...dependencyProviders];

export const adminSpellMechanicsRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-spell-mechanics-page/admin-spell-mechanics-page.component'
			).then(m => m.AdminSpellMechanicsPageComponent)
	}
];
