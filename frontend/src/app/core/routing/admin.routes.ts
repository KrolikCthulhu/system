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
						path: 'skills',
						loadChildren: () =>
							import('../../features/skills/admin-skills.routes').then(
								m => m.adminSkillsRoutes
							)
					},
					{
						path: 'attributes',
						loadChildren: () =>
							import('../../features/attributes/admin-attributes.routes').then(
								m => m.adminAttributesRoutes
							)
					},
					{
						path: 'roll-consequences',
						loadChildren: () =>
							import(
								'../../features/roll-consequences/admin-roll-consequences.routes'
							).then(m => m.adminRollConsequencesRoutes)
					},
					{
						path: 'damage-types',
						loadChildren: () =>
							import('../../features/damage-types/admin-damage-types.routes').then(
								m => m.adminDamageTypesRoutes
							)
					},
					{
						path: 'conditions',
						loadChildren: () =>
							import('../../features/conditions/admin-conditions.routes').then(
								m => m.adminConditionsRoutes
							)
					},
					{
						path: 'combat-intents',
						loadChildren: () =>
							import(
								'../../features/combat-intents/admin-combat-intents.routes'
							).then(m => m.adminCombatIntentsRoutes)
					},
					{
						path: 'natural-attacks',
						loadChildren: () =>
							import('../../features/weapons/admin-weapons.routes').then(
								m => m.adminNaturalAttacksRoutes
							)
					},
					{
						path: 'armor-presets',
						loadChildren: () =>
							import('../../features/armor-presets/admin-armor-presets.routes').then(
								m => m.adminArmorPresetsRoutes
							)
					},
					{
						path: 'weapon-templates',
						loadChildren: () =>
							import('../../features/weapons/admin-weapons.routes').then(
								m => m.adminWeaponTemplatesRoutes
							)
					},
					{
						path: 'weapons',
						loadChildren: () =>
							import('../../features/weapons/admin-weapons.routes').then(
								m => m.adminWeaponsRoutes
							)
					},
					{
						path: 'creature-types',
						loadChildren: () =>
							import(
								'../../features/creature-types/admin-creature-types.routes'
							).then(m => m.adminCreatureTypesRoutes)
					},
					{
						path: 'anatomy-schemes',
						loadChildren: () =>
							import(
								'../../features/anatomy-schemes/admin-anatomy-schemes.routes'
							).then(m => m.adminAnatomySchemesRoutes)
					},
					{
						path: 'creatures',
						loadChildren: () =>
							import('../../features/creatures/admin-creatures.routes').then(
								m => m.adminCreaturesRoutes
							)
					},
					{
						path: 'values',
						loadChildren: () =>
							import('../../features/values/admin-values.routes').then(
								m => m.adminValuesRoutes
							)
					},
					{
						path: 'events',
						loadChildren: () =>
							import('../../features/events/admin-events.routes').then(
								m => m.adminEventsRoutes
							)
					},
					{
						path: 'magic-words',
						loadChildren: () =>
							import('../../features/magic/admin-magic.routes').then(
								m => m.adminMagicWordsRoutes
							)
					},
					{
						path: 'spell-mechanics',
						loadChildren: () =>
							import(
								'../../features/spell-mechanics/admin-spell-mechanics.routes'
							).then(m => m.adminSpellMechanicsRoutes)
					},
					{
						path: 'progression-presets',
						loadChildren: () =>
							import(
								'../../features/progression-presets/admin-progression-presets.routes'
							).then(m => m.adminProgressionPresetsRoutes)
					},
					{
						path: 'spells',
						loadChildren: () =>
							import('../../features/magic/admin-magic.routes').then(
								m => m.adminSpellsRoutes
							)
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
						loadChildren: () =>
							import(
								'../../features/character-sheet/admin-character-sheet.routes'
							).then(m => m.adminCharacterSheetRoutes)
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
