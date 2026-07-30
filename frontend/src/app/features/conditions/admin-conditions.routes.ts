import { Route } from '@angular/router';
import { provideAnatomySchemesInfrastructure } from '../anatomy-schemes/data/provide-anatomy-schemes-infrastructure';
import { provideAttributesInfrastructure } from '../attributes/data/provide-attributes-infrastructure';
import { provideCreaturesInfrastructure } from '../creatures/data/provide-creatures-infrastructure';
import { provideSkillsInfrastructure } from '../skills/data/provide-skills-infrastructure';
import { provideWeaponsInfrastructure } from '../weapons/data/provide-weapons-infrastructure';
import { provideConditionsInfrastructure } from './data/provide-conditions-infrastructure';

const featureProviders = [...provideConditionsInfrastructure()];

const dependencyProviders = [
	...provideAttributesInfrastructure(),
	...provideAnatomySchemesInfrastructure(),
	...provideCreaturesInfrastructure(),
	...provideSkillsInfrastructure(),
	...provideWeaponsInfrastructure()
];

const providers = [...featureProviders, ...dependencyProviders];

export const adminConditionsRoutes: Route[] = [
	{
		path: '',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-conditions-page/admin-conditions-page.component'
			).then(m => m.AdminConditionsPageComponent)
	}
];
