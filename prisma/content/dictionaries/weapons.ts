import type { ContentDocument, WeaponContent } from '../content-types';

export default {
	schemaVersion: 1,
	weapons: [
		{
			name: 'Меч',
			slug: 'mech',
			skill: {
				name: 'Клинковое оружие',
				slug: 'klinkovoe-oruzhie'
			},
			extraDamage: 1,
			sortOrder: 0
		},
		{
			name: 'Дубина',
			slug: 'dubina',
			skill: {
				name: 'Ударное оружие',
				slug: 'udarnoe-oruzhie'
			},
			extraDamage: 1,
			sortOrder: 1
		},
		{
			name: 'Копьё',
			slug: 'kope',
			skill: {
				name: 'Древковое оружие',
				slug: 'drevkovoe-oruzhie'
			},
			extraDamage: 1,
			sortOrder: 2
		}
	]
} satisfies ContentDocument<{ weapons: WeaponContent[] }>;
