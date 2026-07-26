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

const grab = {
	name: 'Захватить',
	slug: 'zahvatit'
};

const grabbed = {
	name: 'Захвачен',
	slug: 'zahvachen'
};

const holding = {
	name: 'Удерживает',
	slug: 'uderzhivaet'
};

const bleeding = {
	name: 'Кровотечение',
	slug: 'krovotechenie'
};

const markedTarget = {
	name: 'Отмеченная цель',
	slug: 'otmechennaya-cel'
};

const mouthFreeRule = {
	type: 'resource_free',
	label: 'Пасть свободна',
	resourceKey: 'mouth',
	unavailableText: 'Недоступно: пасть занята'
} as const;

const activeGrabRule = {
	type: 'active_condition',
	label: 'Активный захват',
	condition: holding,
	unavailableText: 'Доступно при активном захвате'
} as const;

function biteDamageOverride(
	damageModifier: number
): NonNullable<CreatureContent['tiers'][number]['attackOverrides']> {
	return [
		{
			naturalAttack: bite,
			profileKind: 'melee',
			profileName: 'Ближняя атака',
			damageModifier,
			sortOrder: 0
		}
	];
}

function wolfActions(
	baseDamage: number,
	options: { includeAssignPrey?: boolean } = {}
): NonNullable<CreatureContent['tiers'][number]['actions']> {
	const actions: NonNullable<CreatureContent['tiers'][number]['actions']> = [
		{
			slug: 'ukus-ranit',
			name: 'Укус — Ранить',
			kind: 'attack',
			source: {
				type: 'natural_attack',
				name: bite.name,
				slug: bite.slug,
				profileName: 'Ближняя атака',
				intent: wound
			},
			cost: { mode: 'fixed', potential: 2 },
			target: {
				type: 'hostile_creature',
				visibility: 'any',
				description: 'Одна враждебная цель в дистанции укуса.'
			},
			availabilityRules: [mouthFreeRule],
			roll: {
				type: 'attack_profile',
				characteristic: power,
				skill: unarmed
			},
			defense: {
				type: 'target_physical_defense',
				canDodge: true,
				canParry: false
			},
			effects: [
				{
					type: 'damage',
					damageMode: 'clean_successes_plus_base',
					damageType: piercing,
					value: baseDamage,
					appliesArmor: true,
					sortOrder: 0
				}
			],
			playerText: '{существо} кусает цель. {защита}. {эффекты}',
			sortOrder: 0
		},
		{
			slug: 'ukus-zahvatit',
			name: 'Укус — Захватить',
			kind: 'attack',
			source: {
				type: 'natural_attack',
				name: bite.name,
				slug: bite.slug,
				profileName: 'Ближняя атака',
				intent: grab
			},
			cost: { mode: 'fixed', potential: 3 },
			target: {
				type: 'hostile_creature',
				visibility: 'any',
				description: 'Одна враждебная цель в дистанции укуса.'
			},
			availabilityRules: [mouthFreeRule],
			roll: {
				type: 'attack_profile',
				characteristic: power,
				skill: unarmed
			},
			defense: {
				type: 'target_physical_defense',
				canDodge: true,
				canParry: false
			},
			effects: [
				{
					type: 'damage',
					damageMode: 'clean_successes',
					damageType: piercing,
					appliesArmor: true,
					sortOrder: 0
				},
				{
					type: 'create_grab',
					condition: grabbed,
					requiresDamageAfterArmor: true,
					text: 'Если после брони прошёл хотя бы 1 урон, создаётся захват. Пасть становится занятой.',
					sortOrder: 1
				}
			],
			playerText: '{существо} пытается вцепиться в цель. {защита}. {эффекты}',
			sortOrder: 1
		},
		{
			slug: 'otpustit',
			name: 'Отпустить',
			kind: 'grab_action',
			source: {
				type: 'condition',
				name: holding.name,
				slug: holding.slug
			},
			cost: { mode: 'free', potential: 0 },
			target: {
				type: 'held_target',
				visibility: 'any',
				description: 'Одна цель, которую волк удерживает.'
			},
			availabilityRules: [activeGrabRule],
			roll: { type: 'none' },
			defense: { type: 'none' },
			effects: [
				{
					type: 'release_grab',
					text: 'Прекращает выбранный захват.',
					sortOrder: 0
				}
			],
			playerText:
				'{существо} может использовать действие, пока удерживает цель. {эффекты}',
			sortOrder: 2
		},
		{
			slug: 'utaschit',
			name: 'Утащить',
			kind: 'grab_action',
			source: {
				type: 'condition',
				name: holding.name,
				slug: holding.slug
			},
			cost: { mode: 'per_meter', perMeter: 1 },
			target: {
				type: 'held_target',
				visibility: 'any',
				description: 'Одна цель, которую волк удерживает.'
			},
			availabilityRules: [activeGrabRule],
			roll: { type: 'none' },
			defense: { type: 'none' },
			effects: [
				{
					type: 'move_with_grab',
					value: 1,
					text: '{существо} перемещается вместе с удерживаемой целью на одинаковое расстояние. Перемещение не может проходить через препятствия и не прекращает захват.',
					sortOrder: 0
				}
			],
			playerText:
				'{существо} может использовать действие, пока удерживает цель. {стоимость}. {эффекты}',
			sortOrder: 3
		},
		{
			slug: 'trepat',
			name: 'Трепать',
			kind: 'grab_action',
			source: {
				type: 'condition',
				name: holding.name,
				slug: holding.slug
			},
			cost: { mode: 'fixed', potential: 2 },
			target: {
				type: 'held_target',
				visibility: 'any',
				description: 'Одна цель, которую волк удерживает пастью.'
			},
			availabilityRules: [activeGrabRule],
			roll: { type: 'none' },
			defense: { type: 'none' },
			effects: [
				{
					type: 'damage',
					damageMode: 'base_damage',
					damageType: piercing,
					value: baseDamage,
					appliesArmor: true,
					sortOrder: 0
				},
				{
					type: 'apply_condition',
					condition: bleeding,
					conditionLevel: 1,
					requiresDamageAfterArmor: true,
					text: 'Если цель получила хотя бы 1 урон после брони, она получает 1 уровень Кровотечения.',
					sortOrder: 1
				}
			],
			playerText:
				'{существо} может использовать действие, пока удерживает цель пастью. {стоимость}. {бросок}. {защита}. {эффекты}',
			sortOrder: 4
		}
	];

	if (options.includeAssignPrey) {
		actions.push({
			slug: 'naznachit-dobychu',
			name: 'Назначить добычу',
			kind: 'active_ability',
			source: {
				type: 'ability',
				name: 'Назначить добычу',
				slug: 'naznachit-dobychu'
			},
			cost: { mode: 'fixed', potential: 2 },
			target: {
				type: 'hostile_creature',
				visibility: 'visible',
				description: 'Одно видимое вожаку враждебное существо.'
			},
			roll: { type: 'none' },
			defense: { type: 'none' },
			effects: [
				{
					type: 'apply_condition',
					condition: markedTarget,
					conditionDisplayName: 'Добыча стаи',
					targetScope: 'source_group_against_holder',
					value: 1,
					text: 'Волки этой стаи получают +1 кубик к атакам против Добычи и считают её приоритетной целью.',
					sortOrder: 0
				},
				{
					type: 'special_rule',
					text: 'У стаи может быть только одна Добыча. Отметка снимается, если вожак назначает новую цель, теряет сознание или покидает столкновение.',
					sortOrder: 1
				}
			],
			playerText:
				'{существо} тратит 2 Потенциала и выбирает одно видимое враждебное существо. {эффекты}',
			sortOrder: actions.length
		});
	}

	return actions;
}

function wolfTargetSelection(
	_description: string,
	scoringRules: NonNullable<
		CreatureContent['tiers'][number]['targetSelection']
	>['scoringRules']
): NonNullable<CreatureContent['tiers'][number]['targetSelection']> {
	return {
		title: '',
		description: '',
		tacticText: '',
		positionChecklist: [],
		scoringRules
	};
}

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
							baseCost: 2,
							baseDamage: 1,
							rangeMeters: 1,
							usesAmmo: false,
							canBeParried: false,
							damageTypes: [piercing],
							availabilityRules: [mouthFreeRule],
							combatIntents: [
								{
									...wound,
									ruleText:
										'Чистые успехи наносят урон. При наличии хотя бы одного чистого успеха добавляется полный базовый урон укуса.'
								},
								{
									...grab,
									costModifier: 1,
									damageModifier: -1,
									ruleText:
										'Наносит только урон от чистых успехов, базовый урон укуса не добавляется. Если после брони прошёл хотя бы 1 урон, создаётся захват. Пасть становится занятой: существо теряет доступ к обычному укусу, пока не отпустит цель.'
								}
							],
							sortOrder: 0
						}
					]
				}
			],
			actions: wolfActions(1),
			tiers: [
				{
					tier: 1,
					name: 'Молодой волк',
					hp: 3,
					size: smallSize,
					armorPreset: noArmor,
					attackOverrides: biteDamageOverride(0),
					targetSelection: wolfTargetSelection(
						'Молодой волк действует просто: выбирает ближайшую доступную цель, замечает явную слабость, но редко поддерживает сложную фокусировку стаи.',
						[
							{
								key: 'nearest_available',
								label: 'Ближайшая доступная',
								points: 3,
								sortOrder: 0
							},
							{
								key: 'health_below_half',
								label: 'Здоровье ниже половины',
								points: 1,
								sortOrder: 1
							},
							{ key: 'prone', label: 'Лежит', points: 1, sortOrder: 2 }
						]
					),
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
					attackOverrides: biteDamageOverride(0),
					targetSelection: wolfTargetSelection(
						'Волк поддерживает атаку стаи: предпочитает Добычу стаи, захваченную, раненую или лежащую цель.',
						[
							{
								key: 'pack_prey',
								label: 'Добыча стаи',
								points: 5,
								sortOrder: 0
							},
							{
								key: 'grabbed_by_pack',
								label: 'Захвачена членом стаи',
								points: 3,
								sortOrder: 1
							},
							{
								key: 'bleeding',
								label: 'Кровотечение',
								points: 2,
								sortOrder: 2
							},
							{
								key: 'health_below_half',
								label: 'Здоровье ниже половины',
								points: 2,
								sortOrder: 3
							},
							{ key: 'prone', label: 'Лежит', points: 2, sortOrder: 4 }
						]
					),
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
					attackOverrides: biteDamageOverride(1),
					actionOverrides: wolfActions(2),
					targetSelection: wolfTargetSelection(
						'Матёрый волк лучше оценивает уязвимость: может игнорировать ближайшую цель ради истекающей кровью, сильно раненой или изолированной добычи.',
						[
							{
								key: 'pack_prey',
								label: 'Добыча стаи',
								points: 5,
								sortOrder: 0
							},
							{
								key: 'bleeding',
								label: 'Кровотечение',
								points: 4,
								sortOrder: 1
							},
							{
								key: 'health_below_half',
								label: 'Здоровье ниже половины',
								points: 3,
								sortOrder: 2
							},
							{
								key: 'grabbed_by_pack',
								label: 'Захвачена членом стаи',
								points: 3,
								sortOrder: 3
							},
							{ key: 'prone', label: 'Лежит', points: 2, sortOrder: 4 }
						]
					),
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
					attackOverrides: biteDamageOverride(1),
					actionOverrides: wolfActions(2, { includeAssignPrey: true }),
					targetSelection: wolfTargetSelection(
						'Вожак ориентирует стаю на Добычу стаи и выбирает цель так, чтобы общий фокус стаи был очевиден для остальных волков.',
						[
							{
								key: 'pack_prey',
								label: 'Добыча стаи',
								points: 8,
								sortOrder: 0
							},
							{
								key: 'attacked_by_pack',
								label: 'Цель, атакуемая стаей',
								points: 4,
								sortOrder: 1
							},
							{
								key: 'bleeding',
								label: 'Кровотечение',
								points: 3,
								sortOrder: 2
							},
							{
								key: 'grabbed_by_pack',
								label: 'Захвачена членом стаи',
								points: 3,
								sortOrder: 3
							}
						]
					),
					abilities: [
						{
							name: 'Назначить добычу',
							costPotential: 2,
							target: 'Одно видимое вожаку враждебное существо.',
							duration:
								'Пока вожак не назначит другую добычу, не потеряет сознание или не покинет столкновение.',
							description:
								'Вожак выделяет одну цель для согласованной охоты. Цель получает состояние «Отмеченная цель» с отображаемым названием «Добыча стаи», связанное со стаей вожака.',
							effectText:
								'Вожак тратит 2 Потенциала и выбирает одно видимое враждебное существо. Выбранное существо становится Добычей стаи. Волки этой стаи получают +1 кубик к атакам против Добычи и считают её приоритетной целью. У стаи может быть только одна Добыча. Отметка снимается, если вожак назначает новую цель, теряет сознание или покидает столкновение.',
							appliesCondition: markedTarget,
							conditionDisplayName: 'Добыча стаи',
							sortOrder: 0
						}
					],
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
					attackOverrides: biteDamageOverride(2),
					actionOverrides: wolfActions(3),
					targetSelection: wolfTargetSelection(
						'Лютый волк давит самую уязвимую добычу и чаще выбирает кровоточащую, захваченную или тяжело раненую цель, если позиция позволяет атаковать без окружения.',
						[
							{
								key: 'pack_prey',
								label: 'Добыча стаи',
								points: 6,
								sortOrder: 0
							},
							{
								key: 'bleeding',
								label: 'Кровотечение',
								points: 4,
								sortOrder: 1
							},
							{
								key: 'grabbed_by_pack',
								label: 'Захвачена членом стаи',
								points: 4,
								sortOrder: 2
							},
							{
								key: 'health_below_quarter',
								label: 'Здоровье ниже четверти',
								points: 3,
								sortOrder: 3
							},
							{
								key: 'health_below_half',
								label: 'Здоровье ниже половины',
								points: 2,
								sortOrder: 4
							},
							{ key: 'prone', label: 'Лежит', points: 2, sortOrder: 5 }
						]
					),
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
