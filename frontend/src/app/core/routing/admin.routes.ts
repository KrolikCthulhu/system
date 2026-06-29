import { Route } from '@angular/router';
import { roleChildGuard, roleGuard } from '../guards/role.guard';
import { withRoles } from './route-data';

export const adminRoutes: Route[] = [
	{
		path: 'admin',
		canActivate: [roleGuard],
		canActivateChild: [roleChildGuard],
		...withRoles('ADMIN'),
		loadComponent: () =>
			import('../layouts/admin-layout/admin-layout.component').then(
				m => m.AdminLayoutComponent
			),
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'rules/skills'
			},
			{
				path: 'rules',
				children: [
					{
						path: '',
						pathMatch: 'full',
						redirectTo: 'skills'
					},
					{
						path: 'skills/:skillId',
						loadComponent: () =>
							import(
								'../../features/skills/ui/pages/admin-skill-detail-page/admin-skill-detail-page.component'
							).then(m => m.AdminSkillDetailPageComponent)
					},
					{
						path: 'skills',
						pathMatch: 'full',
						loadComponent: () =>
							import(
								'../../features/skills/ui/pages/admin-skills-page/admin-skills-page.component'
							).then(m => m.AdminSkillsPageComponent)
					},
					{
						path: 'attributes/attribute/:attributeId',
						loadComponent: () =>
							import(
								'../../features/attributes/ui/pages/admin-attribute-detail-page/admin-attribute-detail-page.component'
							).then(m => m.AdminAttributeDetailPageComponent)
					},
					{
						path: 'attributes/characteristic/:characteristicId',
						loadComponent: () =>
							import(
								'../../features/attributes/ui/pages/admin-characteristic-detail-page/admin-characteristic-detail-page.component'
							).then(m => m.AdminCharacteristicDetailPageComponent)
					},
					{
						path: 'attributes',
						pathMatch: 'full',
						loadComponent: () =>
							import(
								'../../features/attributes/ui/pages/admin-attributes-page/admin-attributes-page.component'
							).then(m => m.AdminAttributesPageComponent)
					},
					{
						path: 'roll-consequences/:consequenceId',
						loadComponent: () =>
							import(
								'../../features/roll-consequences/ui/pages/admin-roll-consequence-detail-page/admin-roll-consequence-detail-page.component'
							).then(m => m.AdminRollConsequenceDetailPageComponent)
					},
					{
						path: 'roll-consequences',
						pathMatch: 'full',
						loadComponent: () =>
							import(
								'../../features/roll-consequences/ui/pages/admin-roll-consequences-page/admin-roll-consequences-page.component'
							).then(m => m.AdminRollConsequencesPageComponent)
					},
					{
						path: 'damage-types',
						loadComponent: () =>
							import(
								'../../features/damage-types/ui/pages/admin-damage-types-page/admin-damage-types-page.component'
							).then(m => m.AdminDamageTypesPageComponent)
					},
					{
						path: 'conditions',
						loadComponent: () =>
							import(
								'../../features/conditions/ui/pages/admin-conditions-page/admin-conditions-page.component'
							).then(m => m.AdminConditionsPageComponent)
					},
					{
						path: 'armor-presets',
						loadComponent: () =>
							import(
								'../../features/armor-presets/ui/pages/admin-armor-presets-page/admin-armor-presets-page.component'
							).then(m => m.AdminArmorPresetsPageComponent)
					},
					{
						path: 'creature-types',
						loadComponent: () =>
							import(
								'../../features/creature-types/ui/pages/admin-creature-types-page/admin-creature-types-page.component'
							).then(m => m.AdminCreatureTypesPageComponent)
					},
					{
						path: 'creatures',
						loadComponent: () =>
							import(
								'../../features/creatures/ui/pages/admin-creatures-page/admin-creatures-page.component'
							).then(m => m.AdminCreaturesPageComponent)
					},
					{
						path: 'values',
						loadComponent: () =>
							import(
								'../../features/values/ui/pages/admin-values-page/admin-values-page.component'
							).then(m => m.AdminValuesPageComponent)
					},
					{
						path: 'events',
						loadComponent: () =>
							import(
								'../../features/events/ui/pages/admin-events-page/admin-events-page.component'
							).then(m => m.AdminEventsPageComponent)
					},
					{
						path: 'magic-words',
						loadComponent: () =>
							import(
								'../../features/magic/ui/pages/admin-magic-words-page/admin-magic-words-page.component'
							).then(m => m.AdminMagicWordsPageComponent)
					},
					{
						path: 'spell-mechanics',
						loadComponent: () =>
							import(
								'../../features/spell-mechanics/ui/pages/admin-spell-mechanics-page/admin-spell-mechanics-page.component'
							).then(m => m.AdminSpellMechanicsPageComponent)
					},
					{
						path: 'progression-presets',
						loadComponent: () =>
							import(
								'../../features/progression-presets/ui/pages/admin-progression-presets-page/admin-progression-presets-page.component'
							).then(m => m.AdminProgressionPresetsPageComponent)
					},
					{
						path: 'spells/formula/:actionId/:essenceId/:gestureId',
						loadComponent: () =>
							import(
								'../../features/magic/ui/pages/admin-spell-detail-page/admin-spell-detail-page.component'
							).then(m => m.AdminSpellDetailPageComponent)
					},
					{
						path: 'spells/:spellId',
						loadComponent: () =>
							import(
								'../../features/magic/ui/pages/admin-spell-detail-page/admin-spell-detail-page.component'
							).then(m => m.AdminSpellDetailPageComponent)
					},
					{
						path: 'spells',
						pathMatch: 'full',
						loadComponent: () =>
							import(
								'../../features/magic/ui/pages/admin-spells-page/admin-spells-page.component'
							).then(m => m.AdminSpellsPageComponent)
					}
				]
			},
			{
				path: 'sandbox',
				children: [
					{
						path: '',
						pathMatch: 'full',
						redirectTo: 'character-sheet'
					},
					{
						path: 'character-sheet',
						loadComponent: () =>
							import(
								'../../features/character-sheet/ui/pages/admin-character-sheet-page/admin-character-sheet-page.component'
							).then(m => m.AdminCharacterSheetPageComponent)
					}
				]
			},
			{
				path: '**',
				redirectTo: 'rules/skills'
			}
		]
	}
];
