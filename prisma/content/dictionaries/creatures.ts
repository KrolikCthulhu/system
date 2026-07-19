import type { ContentDocument, CreatureContent } from '../content-types';

const noArmor = {
	name: 'Без брони',
	slug: 'bez-broni'
};

const evasion = {
	name: 'Уклонение',
	slug: 'uklonenie'
};

const reflexes = {
	name: 'Рефлексы',
	slug: 'refleksy'
};

export default {
	creatures: [
		{
			name: 'Волк',
			sortOrder: 0,
			slug: 'volk',
			type: {
				name: 'Звери',
				slug: 'zveri'
			},
			anatomyScheme: {
				name: 'Четвероногое',
				slug: 'chetveronogoe'
			},
			tiers: [
				{
					tier: 1,
					name: 'Молодой волк',
					hp: 3,
					armorPreset: noArmor,
					characteristics: [{ ...reflexes, value: 2 }],
					skills: [{ ...evasion, level: 1 }]
				},
				{
					tier: 2,
					name: 'Волк',
					hp: 5,
					armorPreset: noArmor,
					characteristics: [{ ...reflexes, value: 3 }],
					skills: [{ ...evasion, level: 1 }]
				},
				{
					tier: 3,
					name: 'Матёрый волк',
					hp: 8,
					armorPreset: noArmor,
					characteristics: [{ ...reflexes, value: 4 }],
					skills: [{ ...evasion, level: 2 }]
				},
				{
					tier: 4,
					name: 'Вожак стаи',
					hp: 12,
					armorPreset: noArmor,
					characteristics: [{ ...reflexes, value: 5 }],
					skills: [{ ...evasion, level: 3 }]
				},
				{
					tier: 5,
					name: 'Лютый волк',
					hp: 18,
					armorPreset: noArmor,
					characteristics: [{ ...reflexes, value: 6 }],
					skills: [{ ...evasion, level: 4 }]
				}
			]
		}
	],
	schemaVersion: 1
} satisfies ContentDocument<{ creatures: CreatureContent[] }>;
