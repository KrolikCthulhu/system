import type { ContentDocument, SystemValueContent } from '../content-types';

export default {
	values: [
		{
			name: 'Источник',
			description:
				'Ресурс персонажа: начисляется за выпавшие шестерки при броске.',
			primaryOwnerType: 'MANUAL',
			displaySection: 'Ресурсы персонажа',
			calculation: 'characterInput',
			isSystemManaged: false,
			isActive: true,
			sortOrder: 0,
			slug: 'istochnik'
		},
		{
			name: 'Здоровье',
			description:
				'Ресурс персонажа: запас состояния, который изменяется уроном и восстановлением.',
			primaryOwnerType: 'MANUAL',
			coreKey: 'health_points',
			displaySection: 'Ресурсы персонажа',
			calculation: 'characterInput',
			isSystemManaged: true,
			isActive: true,
			sortOrder: 2,
			slug: 'zdorovye'
		},
		{
			name: 'Скорость',
			description:
				'Базовая скорость персонажа. Используется боевым столкновением как снимок текущей скорости.',
			primaryOwnerType: 'MANUAL',
			coreKey: 'speed',
			displaySection: 'Ресурсы персонажа',
			calculation: 'characterInput',
			isSystemManaged: true,
			isActive: true,
			sortOrder: 3,
			slug: 'speed'
		}
	],
	schemaVersion: 1
} satisfies ContentDocument<{ values: SystemValueContent[] }>;
