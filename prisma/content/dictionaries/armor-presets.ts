import type { ArmorPresetContent, ContentDocument } from '../content-types';

export default {
	armorPresets: [
		{
			name: 'Без брони',
			sortOrder: 0,
			slug: 'bez-broni',
			points: 0,
			protection: 0
		},
		{
			name: 'Лёгкая броня',
			sortOrder: 1,
			slug: 'legkaya-bronya',
			points: 2,
			protection: 1
		},
		{
			name: 'Средняя броня',
			sortOrder: 2,
			slug: 'srednyaya-bronya',
			points: 3,
			protection: 2
		},
		{
			name: 'Тяжёлая броня',
			sortOrder: 3,
			slug: 'tyazhelaya-bronya',
			points: 4,
			protection: 3
		}
	],
	schemaVersion: 1
} satisfies ContentDocument<{ armorPresets: ArmorPresetContent[] }>;
