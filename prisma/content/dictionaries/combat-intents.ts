import type {
	CombatIntentContent,
	CombatIntentTextBlockContent,
	ContentDocument
} from '../content-types';

const CATEGORIES = {
	damage: 'Урон и травмы',
	conditions: 'Состояния',
	movement: 'Перемещение',
	restraint: 'Удержание',
	equipment: 'Снаряжение и предметы',
	suppression: 'Подавление'
};

function intent(
	name: string,
	slug: string,
	category: string,
	sortOrder: number,
	isActive = true,
	textBlocks?: CombatIntentTextBlockContent[]
): CombatIntentContent {
	return {
		name,
		slug,
		category,
		sortOrder,
		isActive,
		textBlocks
	};
}

const woundTextBlocks: CombatIntentTextBlockContent[] = [
	{
		kind: 'text',
		text: 'Вы совершаете ',
		sortOrder: 0
	},
	{
		kind: 'token',
		token: 'damageTypes',
		sortOrder: 1
	},
	{
		kind: 'text',
		text: ' атаку выбранным оружием по цели в пределах ',
		sortOrder: 2
	},
	{
		kind: 'token',
		token: 'rangeMeters',
		sortOrder: 3
	},
	{
		kind: 'text',
		text: ' м.\n\nЦель может защититься: ',
		sortOrder: 4
	},
	{
		kind: 'token',
		token: 'defenseOptions',
		sortOrder: 5
	},
	{
		kind: 'text',
		text: '.\n\nПри попадании цель получает ',
		sortOrder: 6
	},
	{
		kind: 'token',
		token: 'selectedDamageType',
		sortOrder: 7
	},
	{
		kind: 'text',
		text: ' урон, равный ',
		sortOrder: 8
	},
	{
		kind: 'token',
		token: 'damageFormula',
		sortOrder: 9
	},
	{
		kind: 'text',
		text: '. Если после защиты не осталось ни одного чистого успеха, атака не наносит урона, и базовый урон оружия не применяется.\n\nПри попадании зона ранения определяется случайно: ',
		sortOrder: 10
	},
	{
		kind: 'token',
		token: 'randomHitZones',
		sortOrder: 11
	},
	{
		kind: 'text',
		text: '. После расчёта итогового урона применяется броня выпавшей зоны. Оставшийся урон снимает здоровье и может вызвать травму.',
		sortOrder: 12
	}
];

const woundMechanic = {
	version: 1,
	inputs: {
		required: [
			'attacker',
			'target',
			'attackProfile',
			'attackSkill',
			'attackCharacteristic',
			'damageTypes',
			'selectedDamageType',
			'defenseOptions',
			'targetAnatomy',
			'targetArmorByZone'
		],
		optional: ['weapon', 'naturalAttack', 'cleanSuccesses']
	},
	actions: [
		{
			kind: 'attack_roll',
			label: 'Бросок и защита',
			rollKind: 'opposed_attack',
			attackDicePool: {
				characteristic: 'from_attack_profile',
				skill: 'from_attack_profile'
			},
			defense: {
				kind: 'physical',
				options: ['dodge', 'parry'],
				parry: {
					requiresAttackProfileCanBeParried: true,
					dicePool: {
						skill: 'from_parrying_weapon_profile',
						characteristic: 'from_parrying_weapon_profile'
					}
				}
			},
			isActive: true,
			sortOrder: 0
		},
		{
			kind: 'hit_check',
			label: 'Попадание',
			minCleanSuccesses: 1,
			defaultMinCleanSuccesses: 1,
			onNoCleanSuccesses: 'miss',
			isActive: true,
			sortOrder: 1
		},
		{
			kind: 'damage',
			label: 'Урон',
			formula: 'cleanSuccesses + attackProfile.baseDamage',
			baseDamageAppliesOnlyOnHit: true,
			damageType: 'selectedDamageType',
			armor: {
				applies: true,
				source: 'targetArmorByHitZone',
				timing: 'after_total_damage'
			},
			isActive: true,
			sortOrder: 2
		},
		{
			kind: 'hit_zone',
			label: 'Зона попадания',
			zoneKind: 'random_main_zone',
			source: 'targetAnatomy',
			eligibleZones: 'main_random_hit_eligible',
			usesWeights: true,
			isActive: true,
			sortOrder: 3
		},
		{
			kind: 'result',
			label: 'Результат',
			healthDamage: true,
			canCauseZoneTrauma: true,
			isActive: true,
			sortOrder: 4
		}
	]
};

const woundDescription =
	'Атакующий совершает проверку атаки характеристикой и навыком выбранного профиля атаки. Цель выбирает один из доступных способов защиты. Если после защиты не осталось чистых успехов, атака не попадает и не наносит урон. Если остался хотя бы 1 чистый успех, зона ранения случайно определяется по анатомической схеме цели. Урон равен чистым успехам атаки + базовый урон профиля атаки. После расчета урона применяется броня пораженной зоны. Оставшийся урон снимает здоровье цели и может вызвать травму пораженной зоны.';

const knockdownMechanic = {
	version: 1,
	inputs: {
		required: [
			'attacker',
			'target',
			'attackProfile',
			'attackSkill',
			'attackCharacteristic',
			'defenseOptions',
			'attackerSize',
			'targetSize'
		],
		optional: ['weapon', 'naturalAttack', 'cleanSuccesses', 'sizeDifference']
	},
	actions: [
		{
			kind: 'target_size_limit',
			label: 'Ограничение по размеру',
			source: 'creature_size_rank',
			attackerRank: 'attackerSize.rank',
			targetRank: 'targetSize.rank',
			differenceFormula: 'targetSize.rank - attackerSize.rank',
			unavailableIfTargetLargerBy: 2,
			minCleanSuccessesIfTargetSameOrSmaller: 1,
			minCleanSuccessesIfTargetLargerByOne: 2,
			isActive: true,
			sortOrder: 0
		},
		{
			kind: 'target_condition_absence',
			label: 'Цель не имеет состояние',
			condition: 'lezhit',
			isActive: true,
			sortOrder: 1
		},
		{
			kind: 'attack_roll',
			label: 'Бросок и защита',
			rollKind: 'opposed_attack',
			attackDicePool: {
				characteristic: 'from_attack_profile',
				skill: 'from_attack_profile'
			},
			defense: {
				kind: 'physical',
				options: ['dodge', 'parry'],
				parry: {
					requiresAttackProfileCanBeParried: true,
					dicePool: {
						skill: 'from_parrying_weapon_profile',
						characteristic: 'from_parrying_weapon_profile'
					}
				}
			},
			isActive: true,
			sortOrder: 2
		},
		{
			kind: 'hit_check',
			label: 'Попадание',
			minCleanSuccesses: 'by_size_difference',
			defaultMinCleanSuccesses: 1,
			onNoCleanSuccesses: 'miss',
			isActive: true,
			sortOrder: 3
		},
		{
			kind: 'result',
			label: 'Результат',
			condition: 'lezhit',
			conditionName: 'Лежит',
			damage: 'only_if_attack_also_has_damage_rule',
			isActive: true,
			sortOrder: 4
		}
	]
};

const knockdownDescription =
	'Атакующий совершает проверку атаки характеристикой и навыком выбранного профиля атаки. Цель выбирает один из доступных способов защиты. Если после защиты остался хотя бы 1 чистый успех, цель получает состояние «Лежит». Если цель крупнее атакующего на 1 категорию, требуется минимум 2 чистых успеха. Если цель крупнее атакующего на 2 или более категории, намерение недоступно без особого правила.';

const knockdownTextBlocks: CombatIntentTextBlockContent[] = [
	{
		kind: 'text',
		text: 'Вы пытаетесь сбить цель с ног выбранным способом атаки в пределах ',
		sortOrder: 0
	},
	{
		kind: 'token',
		token: 'rangeMeters',
		sortOrder: 1
	},
	{
		kind: 'text',
		text: ' м.\n\nСовершите проверку ',
		sortOrder: 2
	},
	{
		kind: 'token',
		token: 'attackCharacteristic',
		sortOrder: 3
	},
	{
		kind: 'text',
		text: ' + ',
		sortOrder: 4
	},
	{
		kind: 'token',
		token: 'attackSkill',
		sortOrder: 5
	},
	{
		kind: 'text',
		text: '. Цель может защититься: ',
		sortOrder: 6
	},
	{
		kind: 'token',
		token: 'defenseOptions',
		sortOrder: 7
	},
	{
		kind: 'text',
		text: '.\n\nЕсли после защиты остался хотя бы 1 чистый успех, цель получает состояние «Лежит». Если цель крупнее атакующего на 1 категорию, требуется минимум 2 чистых успеха. Если цель крупнее атакующего на 2 или более категории, это намерение недоступно без особого правила.',
		sortOrder: 8
	}
];

export default {
	schemaVersion: 1,
	combatIntents: [
		{
			...intent('Ранить', 'ranit', CATEGORIES.damage, 0, true, woundTextBlocks),
			description: woundDescription,
			mechanic: woundMechanic
		},
		intent('Прицельно ранить', 'pricelno-ranit', CATEGORIES.damage, 1),
		intent(
			'Поразить уязвимое место',
			'porazit-uyazvimoe-mesto',
			CATEGORIES.damage,
			2
		),
		intent(
			'Вызвать кровотечение',
			'vyzvat-krovotechenie',
			CATEGORIES.damage,
			3
		),

		intent('Оглушить', 'oglushit', CATEGORIES.conditions, 100),
		intent('Ослепить', 'oslepit', CATEGORIES.conditions, 101),

		intent('Оттолкнуть', 'ottolknut', CATEGORIES.movement, 200),
		intent('Притянуть', 'prityanut', CATEGORIES.movement, 201),
		{
			...intent(
				'Сбить с ног',
				'sbit-s-nog',
				CATEGORIES.movement,
				202,
				true,
				knockdownTextBlocks
			),
			description: knockdownDescription,
			mechanic: knockdownMechanic
		},
		intent('Бросить', 'brosit', CATEGORIES.movement, 203),
		intent('Развернуть', 'razvernut', CATEGORIES.movement, 204),
		intent(
			'Поменяться местами',
			'pomenyatsya-mestami',
			CATEGORIES.movement,
			205
		),

		intent('Захватить', 'zahvatit', CATEGORIES.restraint, 300),
		intent('Обездвижить', 'obezdvizhit', CATEGORIES.restraint, 301),
		intent('Пригвоздить', 'prigvozdit', CATEGORIES.restraint, 302),
		intent('Опутать', 'oputat', CATEGORIES.restraint, 303),
		intent('Удушить', 'udushit', CATEGORIES.restraint, 304),

		intent('Обезоружить', 'obezoruzhit', CATEGORIES.equipment, 400),
		intent('Выбить щит', 'vybit-schit', CATEGORIES.equipment, 401),
		intent('Сорвать предмет', 'sorvat-predmet', CATEGORIES.equipment, 402),
		intent('Сбить прицел', 'sbit-pricel', CATEGORIES.equipment, 403),
		intent('Сломать оружие', 'slomat-oruzhie', CATEGORIES.equipment, 404),
		intent('Разбить щит', 'razbit-schit', CATEGORIES.equipment, 405),
		intent('Повредить броню', 'povredit-bronyu', CATEGORIES.equipment, 406),
		intent('Разрушить предмет', 'razrushit-predmet', CATEGORIES.equipment, 407),

		intent('Напугать', 'napugat', CATEGORIES.suppression, 500),
		intent('Вынудить сдаться', 'vynudit-sdatsya', CATEGORIES.suppression, 501)
	]
} satisfies ContentDocument<{ combatIntents: CombatIntentContent[] }>;
