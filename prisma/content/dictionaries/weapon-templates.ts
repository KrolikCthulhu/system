import type { ContentDocument, WeaponTemplateContent } from '../content-types';

const POWER = { name: 'Мощь', slug: 'mosch' };
const REFLEXES = { name: 'Рефлексы', slug: 'refleksy' };

const SKILLS = {
	unarmed: { name: 'Рукопашный бой', slug: 'rukopashnyy-boy' },
	blade: { name: 'Клинковое оружие', slug: 'klinkovoe-oruzhie' },
	axe: { name: 'Топоры и секиры', slug: 'topory-i-sekiry' },
	blunt: { name: 'Дробящее оружие', slug: 'udarnoe-oruzhie' },
	polearm: { name: 'Древковое оружие', slug: 'drevkovoe-oruzhie' },
	throwing: { name: 'Метательное оружие', slug: 'metatelnoe-oruzhie' },
	bow: { name: 'Стрелковое оружие', slug: 'strelkovoe-oruzhie' },
	firearm: { name: 'Огнестрельное оружие', slug: 'ognestrelnoe-oruzhie' }
};

const INTENTS = {
	wound: { name: 'Ранить', slug: 'ranit' },
	knockdown: { name: 'Сбить с ног', slug: 'sbit-s-nog' },
	disarm: { name: 'Обезоружить', slug: 'obezoruzhit' },
	push: { name: 'Оттолкнуть', slug: 'ottolknut' },
	stun: { name: 'Оглушить', slug: 'oglushit' },
	blind: { name: 'Ослепить', slug: 'oslepit' },
	grab: { name: 'Захватить', slug: 'zahvatit' },
	pin: { name: 'Пригвоздить', slug: 'prigvozdit' },
	strangle: { name: 'Удушить', slug: 'udushit' }
};

const commonMeleeIntents = [
	INTENTS.wound,
	INTENTS.knockdown,
	INTENTS.disarm,
	INTENTS.push
];
const bluntIntents = [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.push];
const rangedIntents = [INTENTS.wound, INTENTS.knockdown, INTENTS.blind];

type HandConfig =
	| { hands: number }
	| { handsMin: number; handsMax: number; defaultHands: number };

function handsRange(config: HandConfig) {
	if ('hands' in config) {
		return {
			handsMin: config.hands,
			handsMax: config.hands,
			defaultHands: config.hands
		};
	}

	return config;
}

function meleeTemplate(
	name: string,
	slug: string,
	skill: typeof SKILLS.blade,
	hands: number,
	baseCost: number,
	baseDamage: number,
	rangeMeters: number,
	sortOrder: number,
	combatIntents = commonMeleeIntents
): WeaponTemplateContent {
	return {
		name,
		slug,
		skill,
		...handsRange({ hands }),
		sortOrder,
		attackProfiles: [
			{
				kind: 'melee',
				name: 'Ближняя атака',
				skill,
				characteristic: POWER,
				baseCost,
				baseDamage,
				rangeMeters,
				usesAmmo: false,
				combatIntents,
				sortOrder: 0
			}
		]
	};
}

function rangedTemplate(
	name: string,
	slug: string,
	skill: typeof SKILLS.throwing,
	hands: number,
	baseCost: number,
	baseDamage: number,
	rangeMeters: number,
	sortOrder: number,
	usesAmmo = true
): WeaponTemplateContent {
	return {
		name,
		slug,
		skill,
		...handsRange({ hands }),
		sortOrder,
		attackProfiles: [
			{
				kind: 'ranged',
				name: 'Дистанционная атака',
				skill,
				characteristic: REFLEXES,
				baseCost,
				baseDamage,
				rangeMeters,
				usesAmmo,
				combatIntents: rangedIntents,
				sortOrder: 0
			}
		]
	};
}

function attackProfile(params: {
	kind: 'melee' | 'ranged';
	name: string;
	skill: typeof SKILLS.blade;
	characteristic: typeof POWER;
	baseCost: number;
	baseDamage: number;
	rangeMeters: number;
	usesAmmo?: boolean;
	combatIntents: Array<(typeof INTENTS)[keyof typeof INTENTS]>;
	sortOrder: number;
}): WeaponTemplateContent['attackProfiles'][number] {
	return {
		kind: params.kind,
		name: params.name,
		skill: params.skill,
		characteristic: params.characteristic,
		baseCost: params.baseCost,
		baseDamage: params.baseDamage,
		rangeMeters: params.rangeMeters,
		usesAmmo: params.usesAmmo ?? false,
		combatIntents: params.combatIntents,
		sortOrder: params.sortOrder
	};
}

function filledTemplate(params: {
	name: string;
	slug: string;
	skill: typeof SKILLS.blade;
	sortOrder: number;
	attackProfiles: WeaponTemplateContent['attackProfiles'];
} & HandConfig): WeaponTemplateContent {
	return {
		name: params.name,
		slug: params.slug,
		skill: params.skill,
		...handsRange(params),
		sortOrder: params.sortOrder,
		attackProfiles: params.attackProfiles
	};
}

export default {
	schemaVersion: 1,
	weaponTemplates: [
		filledTemplate({
			name: 'Безоружный бой',
			slug: 'bezoruzhnyy-boy',
			skill: SKILLS.unarmed,
			hands: 0,
			sortOrder: 0,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.unarmed,
					characteristic: POWER,
					baseCost: 1,
					baseDamage: 0,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.knockdown,
						INTENTS.disarm,
						INTENTS.push,
						INTENTS.grab,
						INTENTS.blind,
						INTENTS.strangle
					],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Усиленный безоружный бой',
			slug: 'usilennyy-bezoruzhnyy-boy',
			skill: SKILLS.unarmed,
			hands: 1,
			sortOrder: 1,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.unarmed,
					characteristic: POWER,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.knockdown,
						INTENTS.disarm,
						INTENTS.push,
						INTENTS.grab,
						INTENTS.blind
					],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Захватное оружие',
			slug: 'zahvatnoe-oruzhie',
			skill: SKILLS.unarmed,
			hands: 2,
			sortOrder: 2,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.unarmed,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 0,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.disarm,
						INTENTS.grab,
						INTENTS.pin,
						INTENTS.strangle
					],
					sortOrder: 0
				})
			]
		}),

		filledTemplate({
			name: 'Малый одноручный клинок',
			slug: 'malyy-odnoruchnyy-klinok',
			skill: SKILLS.blade,
			hands: 1,
			sortOrder: 10,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blade,
					characteristic: REFLEXES,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.disarm,
						INTENTS.blind,
						INTENTS.pin
					],
					sortOrder: 0
				}),
				attackProfile({
					kind: 'ranged',
					name: 'Бросок',
					skill: SKILLS.throwing,
					characteristic: REFLEXES,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 5,
					combatIntents: [INTENTS.wound, INTENTS.blind, INTENTS.pin],
					sortOrder: 1
				})
			]
		}),
		filledTemplate({
			name: 'Лёгкий одноручный клинок',
			slug: 'legkiy-odnoruchnyy-klinok',
			skill: SKILLS.blade,
			hands: 1,
			sortOrder: 11,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blade,
					characteristic: REFLEXES,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.disarm,
						INTENTS.blind,
						INTENTS.pin
					],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Средний одноручный клинок',
			slug: 'sredniy-odnoruchnyy-klinok',
			skill: SKILLS.blade,
			hands: 1,
			sortOrder: 12,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blade,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.knockdown,
						INTENTS.disarm,
						INTENTS.push,
						INTENTS.blind,
						INTENTS.pin
					],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Тяжёлый одноручный клинок',
			slug: 'tyazhelyy-odnoruchnyy-klinok',
			skill: SKILLS.blade,
			hands: 1,
			sortOrder: 13,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blade,
					characteristic: POWER,
					baseCost: 2,
					baseDamage: 3,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.knockdown,
						INTENTS.disarm,
						INTENTS.push,
						INTENTS.pin
					],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Полуторный клинок',
			slug: 'polutornyy-klinok',
			skill: SKILLS.blade,
			handsMin: 1,
			handsMax: 2,
			defaultHands: 1,
			sortOrder: 14,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blade,
					characteristic: POWER,
					baseCost: 2,
					baseDamage: 3,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.knockdown,
						INTENTS.disarm,
						INTENTS.push,
						INTENTS.blind,
						INTENTS.pin
					],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Двуручный клинок',
			slug: 'dvuruchnyy-klinok',
			skill: SKILLS.blade,
			hands: 2,
			sortOrder: 15,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blade,
					characteristic: POWER,
					baseCost: 3,
					baseDamage: 4,
					rangeMeters: 2,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.knockdown,
						INTENTS.disarm,
						INTENTS.push,
						INTENTS.pin
					],
					sortOrder: 0
				})
			]
		}),

		filledTemplate({
			name: 'Малый одноручный топор',
			slug: 'malyy-odnoruchnyy-topor',
			skill: SKILLS.axe,
			hands: 1,
			sortOrder: 20,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.axe,
					characteristic: REFLEXES,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.disarm,
						INTENTS.blind,
						INTENTS.pin
					],
					sortOrder: 0
				}),
				attackProfile({
					kind: 'ranged',
					name: 'Бросок',
					skill: SKILLS.throwing,
					characteristic: REFLEXES,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 5,
					combatIntents: [INTENTS.wound, INTENTS.knockdown, INTENTS.pin],
					sortOrder: 1
				})
			]
		}),
		filledTemplate({
			name: 'Средний одноручный топор',
			slug: 'sredniy-odnoruchnyy-topor',
			skill: SKILLS.axe,
			hands: 1,
			sortOrder: 21,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.axe,
					characteristic: POWER,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.knockdown,
						INTENTS.disarm,
						INTENTS.push,
						INTENTS.pin
					],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Тяжёлый одноручный топор',
			slug: 'tyazhelyy-odnoruchnyy-topor',
			skill: SKILLS.axe,
			hands: 1,
			sortOrder: 22,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.axe,
					characteristic: POWER,
					baseCost: 2,
					baseDamage: 3,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.knockdown,
						INTENTS.disarm,
						INTENTS.push,
						INTENTS.pin
					],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Полуторный топор',
			slug: 'polutornyy-topor',
			skill: SKILLS.axe,
			handsMin: 1,
			handsMax: 2,
			defaultHands: 1,
			sortOrder: 23,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.axe,
					characteristic: POWER,
					baseCost: 2,
					baseDamage: 3,
					rangeMeters: 1,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.knockdown,
						INTENTS.disarm,
						INTENTS.push,
						INTENTS.pin
					],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Двуручный топор',
			slug: 'dvuruchnyy-topor',
			skill: SKILLS.axe,
			hands: 2,
			sortOrder: 24,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.axe,
					characteristic: POWER,
					baseCost: 3,
					baseDamage: 4,
					rangeMeters: 2,
					combatIntents: [
						INTENTS.wound,
						INTENTS.stun,
						INTENTS.knockdown,
						INTENTS.disarm,
						INTENTS.push,
						INTENTS.pin
					],
					sortOrder: 0
				})
			]
		}),

		filledTemplate({
			name: 'Малое одноручное дробящее оружие',
			slug: 'maloe-odnoruchnoe-drobyaschee-oruzhie',
			skill: SKILLS.blunt,
			hands: 1,
			sortOrder: 30,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blunt,
					characteristic: REFLEXES,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 1,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.push],
					sortOrder: 0
				}),
				attackProfile({
					kind: 'ranged',
					name: 'Бросок',
					skill: SKILLS.throwing,
					characteristic: REFLEXES,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 5,
					combatIntents: [INTENTS.wound, INTENTS.stun],
					sortOrder: 1
				})
			]
		}),
		filledTemplate({
			name: 'Среднее одноручное дробящее оружие',
			slug: 'srednee-odnoruchnoe-drobyaschee-oruzhie',
			skill: SKILLS.blunt,
			hands: 1,
			sortOrder: 31,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blunt,
					characteristic: POWER,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 1,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.push],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Тяжёлое одноручное дробящее оружие',
			slug: 'tyazheloe-odnoruchnoe-drobyaschee-oruzhie',
			skill: SKILLS.blunt,
			hands: 1,
			sortOrder: 32,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blunt,
					characteristic: POWER,
					baseCost: 2,
					baseDamage: 3,
					rangeMeters: 1,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.push],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Двуручное дробящее оружие',
			slug: 'dvuruchnoe-drobyaschee-oruzhie',
			skill: SKILLS.blunt,
			hands: 2,
			sortOrder: 33,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blunt,
					characteristic: POWER,
					baseCost: 3,
					baseDamage: 4,
					rangeMeters: 2,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.push],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Гибкое дробящее оружие',
			slug: 'gibkoe-drobyaschee-oruzhie',
			skill: SKILLS.blunt,
			hands: 1,
			sortOrder: 34,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.blunt,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 2,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.push, INTENTS.grab],
					sortOrder: 0
				})
			]
		}),

		filledTemplate({
			name: 'Боевой посох',
			slug: 'boevoy-posoh',
			skill: SKILLS.polearm,
			hands: 2,
			sortOrder: 40,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.polearm,
					characteristic: REFLEXES,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 2,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.push],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Короткое древковое оружие',
			slug: 'korotkoe-drevkovoe-oruzhie',
			skill: SKILLS.polearm,
			handsMin: 1,
			handsMax: 2,
			defaultHands: 1,
			sortOrder: 41,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.polearm,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 2,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.push, INTENTS.pin],
					sortOrder: 0
				}),
				attackProfile({
					kind: 'ranged',
					name: 'Бросок',
					skill: SKILLS.throwing,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 6,
					combatIntents: [INTENTS.wound, INTENTS.knockdown, INTENTS.pin],
					sortOrder: 1
				})
			]
		}),
		filledTemplate({
			name: 'Среднее древковое оружие',
			slug: 'srednee-drevkovoe-oruzhie',
			skill: SKILLS.polearm,
			hands: 2,
			sortOrder: 42,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.polearm,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 2,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.push, INTENTS.pin],
					sortOrder: 0
				}),
				attackProfile({
					kind: 'ranged',
					name: 'Бросок',
					skill: SKILLS.throwing,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 8,
					combatIntents: [INTENTS.wound, INTENTS.knockdown, INTENTS.pin],
					sortOrder: 1
				})
			]
		}),
		filledTemplate({
			name: 'Длинное древковое оружие',
			slug: 'dlinnoe-drevkovoe-oruzhie',
			skill: SKILLS.polearm,
			hands: 2,
			sortOrder: 43,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.polearm,
					characteristic: POWER,
					baseCost: 2,
					baseDamage: 3,
					rangeMeters: 3,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.push, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Тяжёлое древковое оружие',
			slug: 'tyazheloe-drevkovoe-oruzhie',
			skill: SKILLS.polearm,
			hands: 2,
			sortOrder: 44,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.polearm,
					characteristic: POWER,
					baseCost: 3,
					baseDamage: 4,
					rangeMeters: 3,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.push, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Сверхдлинное древковое оружие',
			slug: 'sverhdlinnoe-drevkovoe-oruzhie',
			skill: SKILLS.polearm,
			hands: 2,
			sortOrder: 45,
			attackProfiles: [
				attackProfile({
					kind: 'melee',
					name: 'Ближняя атака',
					skill: SKILLS.polearm,
					characteristic: POWER,
					baseCost: 3,
					baseDamage: 3,
					rangeMeters: 4,
					combatIntents: [INTENTS.wound, INTENTS.knockdown, INTENTS.disarm, INTENTS.push, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),

		filledTemplate({
			name: 'Малое метательное оружие',
			slug: 'maloe-metatelnoe-oruzhie',
			skill: SKILLS.throwing,
			hands: 1,
			sortOrder: 50,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.throwing,
					characteristic: REFLEXES,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 5,
					combatIntents: [INTENTS.wound, INTENTS.disarm, INTENTS.blind, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Лёгкое метательное оружие',
			slug: 'legkoe-metatelnoe-oruzhie',
			skill: SKILLS.throwing,
			hands: 1,
			sortOrder: 51,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.throwing,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 8,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.disarm, INTENTS.blind, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Тяжёлое метательное оружие',
			slug: 'tyazheloe-metatelnoe-oruzhie',
			skill: SKILLS.throwing,
			hands: 1,
			sortOrder: 52,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.throwing,
					characteristic: POWER,
					baseCost: 2,
					baseDamage: 3,
					rangeMeters: 6,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.push, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Метательная сеть',
			slug: 'metatelnaya-set',
			skill: SKILLS.throwing,
			hands: 2,
			sortOrder: 53,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.throwing,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 0,
					rangeMeters: 5,
					combatIntents: [INTENTS.knockdown, INTENTS.disarm, INTENTS.grab],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Праща',
			slug: 'prascha',
			skill: SKILLS.throwing,
			hands: 1,
			sortOrder: 54,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.throwing,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 1,
					rangeMeters: 15,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.blind],
					sortOrder: 0
				})
			]
		}),

		filledTemplate({
			name: 'Короткий лук',
			slug: 'korotkiy-luk',
			skill: SKILLS.bow,
			hands: 2,
			sortOrder: 60,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.bow,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 1,
					rangeMeters: 20,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.disarm, INTENTS.blind, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Длинный лук',
			slug: 'dlinnyy-luk',
			skill: SKILLS.bow,
			hands: 2,
			sortOrder: 61,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.bow,
					characteristic: POWER,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 30,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.knockdown, INTENTS.disarm, INTENTS.blind, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Лёгкий арбалет',
			slug: 'legkiy-arbalet',
			skill: SKILLS.bow,
			hands: 2,
			sortOrder: 62,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.bow,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 25,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.disarm, INTENTS.blind, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Тяжёлый арбалет',
			slug: 'tyazhelyy-arbalet',
			skill: SKILLS.bow,
			hands: 2,
			sortOrder: 63,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.bow,
					characteristic: REFLEXES,
					baseCost: 3,
					baseDamage: 3,
					rangeMeters: 35,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.knockdown, INTENTS.disarm, INTENTS.blind, INTENTS.push, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),

		filledTemplate({
			name: 'Малое одноручное огнестрельное оружие',
			slug: 'maloe-odnoruchnoe-ognestrelnoe-oruzhie',
			skill: SKILLS.firearm,
			hands: 1,
			sortOrder: 70,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.firearm,
					characteristic: REFLEXES,
					baseCost: 1,
					baseDamage: 1,
					rangeMeters: 10,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.disarm, INTENTS.blind],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Стандартное одноручное огнестрельное оружие',
			slug: 'standartnoe-odnoruchnoe-ognestrelnoe-oruzhie',
			skill: SKILLS.firearm,
			hands: 1,
			sortOrder: 71,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.firearm,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 20,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.disarm, INTENTS.blind],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Компактное двуручное огнестрельное оружие',
			slug: 'kompaktnoe-dvuruchnoe-ognestrelnoe-oruzhie',
			skill: SKILLS.firearm,
			hands: 2,
			sortOrder: 72,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.firearm,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 2,
					rangeMeters: 25,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.disarm, INTENTS.blind],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Длинноствольное огнестрельное оружие',
			slug: 'dlinnostvolnoe-ognestrelnoe-oruzhie',
			skill: SKILLS.firearm,
			hands: 2,
			sortOrder: 73,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.firearm,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 3,
					rangeMeters: 40,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.disarm, INTENTS.blind, INTENTS.pin],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Дробовое огнестрельное оружие',
			slug: 'drobovoe-ognestrelnoe-oruzhie',
			skill: SKILLS.firearm,
			hands: 2,
			sortOrder: 74,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.firearm,
					characteristic: REFLEXES,
					baseCost: 2,
					baseDamage: 3,
					rangeMeters: 15,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.push],
					sortOrder: 0
				})
			]
		}),
		filledTemplate({
			name: 'Тяжёлое огнестрельное оружие',
			slug: 'tyazheloe-ognestrelnoe-oruzhie',
			skill: SKILLS.firearm,
			hands: 2,
			sortOrder: 75,
			attackProfiles: [
				attackProfile({
					kind: 'ranged',
					name: 'Дистанционная атака',
					skill: SKILLS.firearm,
					characteristic: REFLEXES,
					baseCost: 3,
					baseDamage: 4,
					rangeMeters: 50,
					usesAmmo: true,
					combatIntents: [INTENTS.wound, INTENTS.stun, INTENTS.knockdown, INTENTS.push, INTENTS.pin],
					sortOrder: 0
				})
			]
		})
	]
} satisfies ContentDocument<{ weaponTemplates: WeaponTemplateContent[] }>;
