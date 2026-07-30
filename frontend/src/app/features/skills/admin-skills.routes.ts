import { Route } from '@angular/router';
import { provideAttributesInfrastructure } from '../attributes/data/provide-attributes-infrastructure';
import { provideRollConsequencesInfrastructure } from '../roll-consequences/data/provide-roll-consequences-infrastructure';
import { provideValuesInfrastructure } from '../values/data/provide-values-infrastructure';
import { SystemValuesCatalogFacade } from '../values/state/system-values-catalog.facade';
import { provideSkillsInfrastructure } from './data/provide-skills-infrastructure';

const featureProviders = [...provideSkillsInfrastructure()];

const dependencyProviders = [
	...provideAttributesInfrastructure(),
	...provideRollConsequencesInfrastructure(),
	...provideValuesInfrastructure(),
	SystemValuesCatalogFacade
];

const providers = [...featureProviders, ...dependencyProviders];

export const adminSkillsRoutes: Route[] = [
	{
		path: '',
		pathMatch: 'full',
		providers,
		loadComponent: () =>
			import('./ui/pages/admin-skills-page/admin-skills-page.component').then(
				m => m.AdminSkillsPageComponent
			)
	},
	{
		path: ':skillId',
		providers,
		loadComponent: () =>
			import(
				'./ui/pages/admin-skill-detail-page/admin-skill-detail-page.component'
			).then(m => m.AdminSkillDetailPageComponent)
	}
];
