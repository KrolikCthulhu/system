import type { ContentDocument, WeaponContent } from '../content-types';

const POWER = { name: 'Мощь', slug: 'mosch' };
const REFLEXES = { name: 'Рефлексы', slug: 'refleksy' };

const SKILLS = {
	blade: { name: 'Клинковое оружие', slug: 'klinkovoe-oruzhie' }
};

const TEMPLATES = {
	smallOneHandedBlade: {
		name: 'Малый одноручный клинок',
		slug: 'malyy-odnoruchnyy-klinok'
	},
	lightOneHandedBlade: {
		name: 'Лёгкий одноручный клинок',
		slug: 'legkiy-odnoruchnyy-klinok'
	},
	mediumOneHandedBlade: {
		name: 'Средний одноручный клинок',
		slug: 'sredniy-odnoruchnyy-klinok'
	},
	heavyOneHandedBlade: {
		name: 'Тяжёлый одноручный клинок',
		slug: 'tyazhelyy-odnoruchnyy-klinok'
	},
	bastardBlade: {
		name: 'Полуторный клинок',
		slug: 'polutornyy-klinok'
	},
	twoHandedBlade: {
		name: 'Двуручный клинок',
		slug: 'dvuruchnyy-klinok'
	}
};

const DAMAGE_TYPES = {
	slashing: { name: 'Режущий', slug: 'rezhuschiy' },
	piercing: { name: 'Колющий', slug: 'kolyuschiy' }
};

const INTENTS = {
	wound: { name: 'Ранить', slug: 'ranit' },
	stun: { name: 'Оглушить', slug: 'oglushit' },
	knockdown: { name: 'Сбить с ног', slug: 'sbit-s-nog' },
	disarm: { name: 'Обезоружить', slug: 'obezoruzhit' },
	push: { name: 'Оттолкнуть', slug: 'ottolknut' },
	blind: { name: 'Ослепить', slug: 'oslepit' },
	pin: { name: 'Пригвоздить', slug: 'prigvozdit' }
};

const smallBladeMeleeIntents = [
	INTENTS.wound,
	INTENTS.stun,
	INTENTS.disarm,
	INTENTS.blind,
	INTENTS.pin
];

const smallBladeMeleeIntentsWithoutDisarm = [
	INTENTS.wound,
	INTENTS.stun,
	INTENTS.blind,
	INTENTS.pin
];

const mediumBladeMeleeIntentsWithoutPin = [
	INTENTS.wound,
	INTENTS.stun,
	INTENTS.knockdown,
	INTENTS.disarm,
	INTENTS.push,
	INTENTS.blind
];

const bastardBladeMeleeIntentsWithoutBlind = [
	INTENTS.wound,
	INTENTS.stun,
	INTENTS.knockdown,
	INTENTS.disarm,
	INTENTS.push,
	INTENTS.pin
];

function inheritedWeapon(params: {
	name: string;
	slug: string;
	template: (typeof TEMPLATES)[keyof typeof TEMPLATES];
	damageTypes: WeaponContent['damageTypes'];
	sortOrder: number;
}): WeaponContent {
	return {
		name: params.name,
		slug: params.slug,
		skill: SKILLS.blade,
		template: params.template,
		extraDamage: 0,
		damageTypes: params.damageTypes,
		sortOrder: params.sortOrder
	};
}

function smallBladeMeleeOnlyWeapon(params: {
	name: string;
	slug: string;
	damageTypes: WeaponContent['damageTypes'];
	combatIntents?: WeaponContent['attackProfiles'][number]['combatIntents'];
	sortOrder: number;
}): WeaponContent {
	return {
		name: params.name,
		slug: params.slug,
		skill: SKILLS.blade,
		template: TEMPLATES.smallOneHandedBlade,
		extraDamage: 0,
		damageTypes: params.damageTypes,
		sortOrder: params.sortOrder,
		attackProfiles: [
			{
				kind: 'melee',
				name: 'Ближняя атака',
				skill: SKILLS.blade,
				characteristic: REFLEXES,
				baseCost: 1,
				baseDamage: 1,
				rangeMeters: 1,
				usesAmmo: false,
				damageTypes: params.damageTypes,
				combatIntents: params.combatIntents ?? smallBladeMeleeIntents,
				sortOrder: 0
			}
		]
	};
}

function mediumBladeWithoutPinWeapon(params: {
	name: string;
	slug: string;
	damageTypes: WeaponContent['damageTypes'];
	sortOrder: number;
}): WeaponContent {
	return {
		name: params.name,
		slug: params.slug,
		skill: SKILLS.blade,
		template: TEMPLATES.mediumOneHandedBlade,
		extraDamage: 0,
		damageTypes: params.damageTypes,
		sortOrder: params.sortOrder,
		attackProfiles: [
			{
				kind: 'melee',
				name: 'Ближняя атака',
				skill: SKILLS.blade,
				characteristic: REFLEXES,
				baseCost: 2,
				baseDamage: 2,
				rangeMeters: 1,
				usesAmmo: false,
				damageTypes: params.damageTypes,
				combatIntents: mediumBladeMeleeIntentsWithoutPin,
				sortOrder: 0
			}
		]
	};
}

function bastardBladeWithoutBlindWeapon(params: {
	name: string;
	slug: string;
	damageTypes: WeaponContent['damageTypes'];
	sortOrder: number;
}): WeaponContent {
	return {
		name: params.name,
		slug: params.slug,
		skill: SKILLS.blade,
		template: TEMPLATES.bastardBlade,
		extraDamage: 0,
		damageTypes: params.damageTypes,
		sortOrder: params.sortOrder,
		attackProfiles: [
			{
				kind: 'melee',
				name: 'Ближняя атака',
				skill: SKILLS.blade,
				characteristic: POWER,
				baseCost: 2,
				baseDamage: 3,
				rangeMeters: 1,
				usesAmmo: false,
				damageTypes: params.damageTypes,
				combatIntents: bastardBladeMeleeIntentsWithoutBlind,
				sortOrder: 0
			}
		]
	};
}

const slashingAndPiercing = [DAMAGE_TYPES.slashing, DAMAGE_TYPES.piercing];
const piercingOnly = [DAMAGE_TYPES.piercing];
const slashingOnly = [DAMAGE_TYPES.slashing];

export default {
	schemaVersion: 1,
	weapons: [
		inheritedWeapon({
			name: 'Нож',
			slug: 'nozh',
			template: TEMPLATES.smallOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 0
		}),
		inheritedWeapon({
			name: 'Кинжал',
			slug: 'kinzhal',
			template: TEMPLATES.smallOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 1
		}),
		smallBladeMeleeOnlyWeapon({
			name: 'Стилет',
			slug: 'stilet',
			damageTypes: piercingOnly,
			combatIntents: smallBladeMeleeIntentsWithoutDisarm,
			sortOrder: 2
		}),
		smallBladeMeleeOnlyWeapon({
			name: 'Кортик',
			slug: 'kortik',
			damageTypes: piercingOnly,
			sortOrder: 3
		}),
		smallBladeMeleeOnlyWeapon({
			name: 'Рондельный кинжал',
			slug: 'rondelnyy-kinzhal',
			damageTypes: piercingOnly,
			sortOrder: 4
		}),
		smallBladeMeleeOnlyWeapon({
			name: 'Джамбия',
			slug: 'dzhambiya',
			damageTypes: slashingAndPiercing,
			sortOrder: 5
		}),
		smallBladeMeleeOnlyWeapon({
			name: 'Крис',
			slug: 'kris',
			damageTypes: slashingAndPiercing,
			sortOrder: 6
		}),
		smallBladeMeleeOnlyWeapon({
			name: 'Танто',
			slug: 'tanto',
			damageTypes: slashingAndPiercing,
			sortOrder: 7
		}),
		smallBladeMeleeOnlyWeapon({
			name: 'Кард',
			slug: 'kard',
			damageTypes: slashingAndPiercing,
			sortOrder: 8
		}),
		smallBladeMeleeOnlyWeapon({
			name: 'Мизерикордия',
			slug: 'mizerikordiya',
			damageTypes: piercingOnly,
			combatIntents: smallBladeMeleeIntentsWithoutDisarm,
			sortOrder: 9
		}),
		smallBladeMeleeOnlyWeapon({
			name: 'Баселард',
			slug: 'baselard',
			damageTypes: slashingAndPiercing,
			sortOrder: 10
		}),
		smallBladeMeleeOnlyWeapon({
			name: 'Дага',
			slug: 'daga',
			damageTypes: slashingAndPiercing,
			sortOrder: 11
		}),

		inheritedWeapon({
			name: 'Рапира',
			slug: 'rapira',
			template: TEMPLATES.lightOneHandedBlade,
			damageTypes: [DAMAGE_TYPES.piercing, DAMAGE_TYPES.slashing],
			sortOrder: 12
		}),
		inheritedWeapon({
			name: 'Шпага',
			slug: 'shpaga',
			template: TEMPLATES.lightOneHandedBlade,
			damageTypes: piercingOnly,
			sortOrder: 13
		}),
		inheritedWeapon({
			name: 'Меч-трость',
			slug: 'mech-trost',
			template: TEMPLATES.lightOneHandedBlade,
			damageTypes: piercingOnly,
			sortOrder: 14
		}),
		inheritedWeapon({
			name: 'Эспадрон',
			slug: 'espadron',
			template: TEMPLATES.lightOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 15
		}),

		inheritedWeapon({
			name: 'Одноручный меч',
			slug: 'odnoruchnyy-mech',
			template: TEMPLATES.mediumOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 16
		}),
		inheritedWeapon({
			name: 'Сабля',
			slug: 'sablya',
			template: TEMPLATES.mediumOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 17
		}),
		mediumBladeWithoutPinWeapon({
			name: 'Фальшион',
			slug: 'falshion',
			damageTypes: slashingOnly,
			sortOrder: 18
		}),
		inheritedWeapon({
			name: 'Мессер',
			slug: 'messer',
			template: TEMPLATES.mediumOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 19
		}),
		inheritedWeapon({
			name: 'Шашка',
			slug: 'shashka',
			template: TEMPLATES.mediumOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 20
		}),
		inheritedWeapon({
			name: 'Абордажный тесак',
			slug: 'abordazhnyy-tesak',
			template: TEMPLATES.mediumOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 21
		}),
		inheritedWeapon({
			name: 'Тальвар',
			slug: 'talvar',
			template: TEMPLATES.mediumOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 22
		}),
		inheritedWeapon({
			name: 'Килич',
			slug: 'kilich',
			template: TEMPLATES.mediumOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 23
		}),
		inheritedWeapon({
			name: 'Шамшир',
			slug: 'shamshir',
			template: TEMPLATES.mediumOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 24
		}),
		inheritedWeapon({
			name: 'Пэйдао',
			slug: 'peydao',
			template: TEMPLATES.mediumOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 25
		}),
		mediumBladeWithoutPinWeapon({
			name: 'Кукри',
			slug: 'kukri',
			damageTypes: slashingOnly,
			sortOrder: 26
		}),
		mediumBladeWithoutPinWeapon({
			name: 'Мачете',
			slug: 'machete',
			damageTypes: slashingOnly,
			sortOrder: 27
		}),

		inheritedWeapon({
			name: 'Корзинчатый меч',
			slug: 'korzinchatyy-mech',
			template: TEMPLATES.heavyOneHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 28
		}),

		inheritedWeapon({
			name: 'Меч-бастард',
			slug: 'mech-bastard',
			template: TEMPLATES.bastardBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 29
		}),
		bastardBladeWithoutBlindWeapon({
			name: 'Гросс-мессер',
			slug: 'gross-messer',
			damageTypes: slashingAndPiercing,
			sortOrder: 30
		}),

		inheritedWeapon({
			name: 'Длинный меч',
			slug: 'dlinnyy-mech',
			template: TEMPLATES.twoHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 31
		}),
		inheritedWeapon({
			name: 'Большой двуручный меч',
			slug: 'bolshoy-dvuruchnyy-mech',
			template: TEMPLATES.twoHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 32
		}),
		inheritedWeapon({
			name: 'Цвайхендер',
			slug: 'cvayhender',
			template: TEMPLATES.twoHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 33
		}),
		inheritedWeapon({
			name: 'Клеймор',
			slug: 'kleymor',
			template: TEMPLATES.twoHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 34
		}),
		inheritedWeapon({
			name: 'Одати',
			slug: 'odati',
			template: TEMPLATES.twoHandedBlade,
			damageTypes: slashingAndPiercing,
			sortOrder: 35
		}),
		inheritedWeapon({
			name: 'Эсток',
			slug: 'estok',
			template: TEMPLATES.twoHandedBlade,
			damageTypes: piercingOnly,
			sortOrder: 36
		})
	]
} satisfies ContentDocument<{ weapons: WeaponContent[] }>;
