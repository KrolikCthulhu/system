import type { ContentDocument, CreatureContent } from '../content-types';

const noArmor = {
	name: 'Без брони',
	slug: 'bez-broni'
};

const smallSize = {
	name: 'Малый',
	slug: 'malyy'
};

const mediumSize = {
	name: 'Средний',
	slug: 'sredniy'
};

const largeSize = {
	name: 'Крупный',
	slug: 'krupnyy'
};

const evasion = {
	name: 'Уклонение',
	slug: 'uklonenie'
};

const unarmed = {
	name: 'Рукопашный бой',
	slug: 'rukopashnyy-boy'
};

const power = {
	name: 'Мощь',
	slug: 'mosch'
};

const reflexes = {
	name: 'Рефлексы',
	slug: 'refleksy'
};

const soul = {
	name: 'Душа',
	slug: 'dusha'
};

const memory = {
	name: 'Память',
	slug: 'pamyat'
};

const bite = {
	name: 'Укус',
	slug: 'ukus'
};

const piercing = {
	name: 'Колющий',
	slug: 'kolyuschiy'
};

const wound = {
	name: 'Ранить',
	slug: 'ranit'
};

const targetedWound = {
	name: 'Прицельно ранить',
	slug: 'pricelno-ranit'
};

const bleeding = {
	name: 'Вызвать кровотечение',
	slug: 'vyzvat-krovotechenie'
};

const knockdown = {
	name: 'Сбить с ног',
	slug: 'sbit-s-nog'
};

const grab = {
	name: 'Захватить',
	slug: 'zahvatit'
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
			naturalAttacks: [
				{
					...bite,
					attackProfiles: [
						{
							kind: 'melee',
							name: 'Ближняя атака',
							skill: unarmed,
							characteristic: power,
							baseCost: 1,
							baseDamage: 1,
							rangeMeters: 1,
							usesAmmo: false,
							canBeParried: false,
							damageTypes: [piercing],
							combatIntents: [wound, targetedWound, bleeding, knockdown, grab],
							sortOrder: 0
						}
					]
				}
			],
			tiers: [
				{
					tier: 1,
					name: 'Молодой волк',
					hp: 3,
					size: smallSize,
					armorPreset: noArmor,
					characteristics: [
						{ ...power, value: 1 },
						{ ...reflexes, value: 2 },
						{ ...soul, value: 1 },
						{ ...memory, value: 1 }
					],
					skills: [
						{ ...evasion, level: 1 },
						{ ...unarmed, level: 1 }
					]
				},
				{
					tier: 2,
					name: 'Волк',
					hp: 5,
					size: mediumSize,
					armorPreset: noArmor,
					characteristics: [
						{ ...power, value: 2 },
						{ ...reflexes, value: 3 },
						{ ...soul, value: 1 },
						{ ...memory, value: 1 }
					],
					skills: [
						{ ...evasion, level: 1 },
						{ ...unarmed, level: 2 }
					]
				},
				{
					tier: 3,
					name: 'Матёрый волк',
					hp: 8,
					size: mediumSize,
					armorPreset: noArmor,
					characteristics: [
						{ ...power, value: 3 },
						{ ...reflexes, value: 4 },
						{ ...soul, value: 2 },
						{ ...memory, value: 1 }
					],
					skills: [
						{ ...evasion, level: 2 },
						{ ...unarmed, level: 3 }
					]
				},
				{
					tier: 4,
					name: 'Вожак стаи',
					hp: 12,
					size: mediumSize,
					armorPreset: noArmor,
					characteristics: [
						{ ...power, value: 3 },
						{ ...reflexes, value: 5 },
						{ ...soul, value: 3 },
						{ ...memory, value: 2 }
					],
					skills: [
						{ ...evasion, level: 3 },
						{ ...unarmed, level: 4 }
					]
				},
				{
					tier: 5,
					name: 'Лютый волк',
					hp: 18,
					size: largeSize,
					armorPreset: noArmor,
					characteristics: [
						{ ...power, value: 5 },
						{ ...reflexes, value: 4 },
						{ ...soul, value: 2 },
						{ ...memory, value: 1 }
					],
					skills: [
						{ ...evasion, level: 4 },
						{ ...unarmed, level: 5 }
					]
				}
			]
		}
	],
	schemaVersion: 1
} satisfies ContentDocument<{ creatures: CreatureContent[] }>;
