import type { CombatIntentContent, ContentDocument } from '../content-types';

export default {
	schemaVersion: 1,
	combatIntents: [
		{
			name: 'Ранить',
			slug: 'ranit',
			sortOrder: 0
		},
		{
			name: 'Оглушить',
			slug: 'oglushit',
			sortOrder: 1
		},
		{
			name: 'Сбить с ног',
			slug: 'sbit-s-nog',
			sortOrder: 2
		},
		{
			name: 'Обезоружить',
			slug: 'obezoruzhit',
			sortOrder: 3
		},
		{
			name: 'Оттолкнуть',
			slug: 'ottolknut',
			sortOrder: 4
		},
		{
			name: 'Захватить',
			slug: 'zahvatit',
			sortOrder: 5
		},
		{
			name: 'Ослепить',
			slug: 'oslepit',
			sortOrder: 6
		},
		{
			name: 'Напугать',
			slug: 'napugat',
			sortOrder: 7
		},
		{
			name: 'Пригвоздить',
			slug: 'prigvozdit',
			sortOrder: 8
		},
		{
			name: 'Удушить',
			slug: 'udushit',
			sortOrder: 9
		}
	]
} satisfies ContentDocument<{ combatIntents: CombatIntentContent[] }>;
