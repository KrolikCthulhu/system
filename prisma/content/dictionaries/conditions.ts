import type { ConditionContent, ContentDocument } from '../content-types';

const automatic = ['automatic'] as const;

const grabbedDescription =
	'Захват ограничивает перемещение цели и не даёт ей свободно разорвать дистанцию с источником.';

const holdingDescription =
	'Источник удерживает цель. Удерживающая часть тела, предмет или эффект считаются занятыми, пока захват не прекращён.';

const holdingRuleText =
	'Удерживающий может отпустить цель без затрат Потенциала, если конкретный захват не указывает обратное. Удерживающий может выполнять действия, специально разрешённые во время удержания.';

const holdingEndText =
	'Захват прекращается, если удерживающий отпускает цель, теряет сознание или погибает, удерживающая часть тела становится недоступна, удерживающий предмет уничтожен или удалён, специальный эффект снимает захват, либо участники принудительно разнесены дальше допустимой дистанции. При прекращении захвата состояние «Захвачен» снимается с цели, состояние «Удерживает» снимается с источника, а занятые части тела или предметы освобождаются.';

function condition(
	name: string,
	slug: string,
	sortOrder: number,
	overrides: Partial<Omit<ConditionContent, 'name' | 'slug' | 'sortOrder'>> = {}
): ConditionContent {
	return {
		name,
		slug,
		sortOrder,
		description: overrides.description ?? '',
		durationType: overrides.durationType ?? 'until_next_round_start',
		repeatLevelMode: overrides.repeatLevelMode ?? 'keep_highest',
		repeatDurationMode: overrides.repeatDurationMode ?? 'keep_highest',
		instanceMode: overrides.instanceMode ?? 'single',
		instanceLimitMode: overrides.instanceLimitMode ?? 'fixed',
		maxInstances: overrides.maxInstances ?? 1,
		instanceOverflowMode: overrides.instanceOverflowMode ?? 'reject_new',
		instanceUniquenessMode: overrides.instanceUniquenessMode ?? 'none',
		duplicateInstanceMode: overrides.duplicateInstanceMode ?? 'update_existing',
		maxLevel: overrides.maxLevel ?? 1,
		removalMethods: overrides.removalMethods ?? [...automatic],
		effects: overrides.effects ?? [],
		parameters: overrides.parameters ?? [],
		textBlocks: overrides.textBlocks ?? [
			{ kind: 'token', token: 'description', sortOrder: 0 },
			{ kind: 'text', text: ' ', sortOrder: 1 },
			{ kind: 'token', token: 'effects', sortOrder: 2 },
			{ kind: 'text', text: ' Длительность: ', sortOrder: 3 },
			{ kind: 'token', token: 'duration', sortOrder: 4 }
		],
		isActive: overrides.isActive ?? true
	};
}

export default {
	conditions: [
		condition('Горение', 'gorenie', 0, {
			durationType: 'round_count',
			repeatDurationMode: 'add',
			removalMethods: ['automatic', 'healing', 'remove_source'],
			effects: [
				{
					type: 'periodic_damage',
					scope: 'all_checks',
					value: 1,
					sortOrder: 0
				}
			]
		}),
		condition('Мокрый', 'mokryy', 1, {
			durationType: 'until_removed',
			removalMethods: ['automatic', 'remove_source']
		}),
		condition('Заморозка', 'zamorozka', 2, {
			durationType: 'round_count',
			repeatLevelMode: 'add',
			maxLevel: 3,
			removalMethods: ['automatic', 'healing', 'remove_source'],
			effects: [
				{
					type: 'speed_modifier',
					scope: 'movement',
					value: -1,
					sortOrder: 0
				}
			]
		}),
		condition('Отмеченная цель', 'otmechennaya-cel', 4, {
			description:
				'Существо отмечено источником эффекта. Указанные получатели эффекта получают преимущество против отмеченной цели.',
			durationType: 'until_removed',
			repeatLevelMode: 'keep_current',
			repeatDurationMode: 'keep_current',
			removalMethods: ['remove_source'],
			effects: [
				{
					type: 'dice_pool_modifier',
					scope: 'attacks',
					targetScope: 'source_group_against_holder',
					value: 1,
					sortOrder: 0
				},
				{
					type: 'special_rule',
					scope: 'attacks',
					targetScope: 'source_group_against_holder',
					value: 1,
					config: {
						text: 'Получатели эффекта получают +1 кубик к атакам против отмеченной цели. Конкретная способность может задать отображаемое название, группу получателей и условия снятия.'
					},
					sortOrder: 1
				}
			],
			textBlocks: [
				{
					kind: 'token',
					token: 'conditionName',
					isActive: true,
					sortOrder: 0
				},
				{
					kind: 'text',
					text: '\n\nСущество отмечено источником эффекта. Получатели эффекта получают +1 кубик к атакам против отмеченной цели. Конкретное отображаемое название, группа получателей и условия снятия определяются источником состояния.',
					isActive: true,
					sortOrder: 1
				}
			]
		}),
		condition('Кровотечение', 'krovotechenie', 3, {
			description:
				'Открытая рана продолжает причинять урон, пока кровотечение не будет остановлено.',
			durationType: 'until_removed',
			repeatLevelMode: 'add',
			repeatDurationMode: 'keep_highest',
			maxLevel: 5,
			removalMethods: ['successful_check', 'healing'],
			effects: [
				{
					type: 'periodic_damage',
					scope: 'all_checks',
					value: 1,
					config: {
						timing: 'round_end'
					},
					sortOrder: 0
				}
			],
			textBlocks: [
				{
					kind: 'token',
					token: 'conditionName',
					isActive: true,
					sortOrder: 0
				},
				{
					kind: 'text',
					text: ' ',
					isActive: true,
					sortOrder: 1
				},
				{
					kind: 'token',
					token: 'currentLevel',
					isActive: true,
					sortOrder: 2
				},
				{
					kind: 'text',
					text: '\n\nОткрытая рана продолжает причинять урон. В конце каждого раунда существо получает урон, равный текущему уровню Кровотечения. Повторное наложение складывает уровни состояния, но не выше максимального. Кровотечение можно остановить перевязкой или лечением. Перевязка требует подходящего материала: каждый потраченный Потенциал уменьшает уровень Кровотечения на 1. При снижении уровня до 0 состояние снимается.\n\nУровень: ',
					isActive: true,
					sortOrder: 3
				},
				{
					kind: 'token',
					token: 'currentLevel',
					isActive: true,
					sortOrder: 4
				},
				{
					kind: 'text',
					text: ' из ',
					isActive: true,
					sortOrder: 5
				},
				{
					kind: 'token',
					token: 'maxLevel',
					isActive: true,
					sortOrder: 6
				}
			]
		}),
		condition('Отравление', 'otravlenie', 4, {
			durationType: 'until_healed',
			repeatDurationMode: 'add',
			removalMethods: ['healing', 'rest'],
			effects: [
				{
					type: 'periodic_damage',
					scope: 'body_checks',
					value: 1,
					sortOrder: 0
				}
			]
		}),
		condition('Ослепление', 'osleplenie', 5, {
			durationType: 'until_next_round_start',
			removalMethods: ['automatic', 'successful_check'],
			effects: [
				{
					type: 'dice_pool_modifier',
					scope: 'attacks',
					value: -2,
					sortOrder: 0
				},
				{
					type: 'dice_pool_modifier',
					scope: 'dodge',
					value: -2,
					sortOrder: 1
				}
			]
		}),
		condition('Оглушение', 'oglushenie', 6, {
			durationType: 'until_owner_next_activation',
			removalMethods: ['automatic', 'spend_potential'],
			effects: [
				{
					type: 'reaction_forbidden',
					scope: 'all_checks',
					sortOrder: 0
				}
			]
		}),
		condition('Обездвиживание', 'obezdvizhivanie', 7, {
			durationType: 'until_removed',
			removalMethods: ['successful_check', 'remove_source'],
			effects: [
				{
					type: 'speed_modifier',
					scope: 'movement',
					value: 0,
					sortOrder: 0
				}
			]
		}),
		condition('Лежит', 'lezhit', 8, {
			description:
				'Существо находится на земле и может перемещаться только ползком, расходуя 2 Потенциала за каждый метр. Защита от атак ближнего боя получает штраф -1 кубик: в лежачем положении сложнее уклоняться и парировать. Защита от дистанционных атак с расстояния более 1 метра получает бонус +1 кубик благодаря меньшему силуэту цели. Чтобы подняться, необходимо потратить 2 Потенциала, после чего состояние снимается.',
			durationType: 'until_removed',
			repeatLevelMode: 'keep_current',
			repeatDurationMode: 'keep_current',
			maxLevel: 1,
			removalMethods: ['spend_potential'],
			effects: [
				{
					type: 'potential_cost_modifier',
					scope: 'movement',
					value: 1,
					sortOrder: 0
				},
				{
					type: 'special_rule',
					scope: 'all_checks',
					value: 1,
					config: {
						text: 'Защита от атак ближнего боя получает штраф -1 кубик. Защита от дистанционных атак с расстояния более 1 метра получает бонус +1 кубик.'
					},
					sortOrder: 1
				},
				{
					type: 'special_rule',
					scope: 'movement',
					value: 1,
					config: {
						text: 'Существо может перемещаться только ползком. Ползание стоит 2 Потенциала за каждый метр. Чтобы подняться, необходимо потратить 2 Потенциала, после чего состояние снимается.'
					},
					sortOrder: 2
				}
			],
			textBlocks: [
				{
					kind: 'token',
					token: 'description',
					isActive: true,
					sortOrder: 0
				}
			]
		}),
		condition('Захвачен', 'zahvachen', 9, {
			description: grabbedDescription,
			durationType: 'until_removed',
			repeatLevelMode: 'keep_highest',
			repeatDurationMode: 'keep_highest',
			instanceMode: 'multiple_independent',
			instanceLimitMode: 'none',
			maxInstances: 1,
			instanceOverflowMode: 'reject_new',
			instanceUniquenessMode: 'holding_part',
			duplicateInstanceMode: 'reject_duplicate',
			maxLevel: 5,
			removalMethods: ['successful_check', 'remove_source'],
			effects: [
				{
					type: 'special_rule',
					scope: 'movement',
					value: 1,
					config: {
						text: 'Захваченное существо не может самостоятельно увеличить расстояние до источника захвата больше допустимого. Обычное перемещение захваченного существа недоступно, пока захват не прекращён.'
					},
					sortOrder: 0
				}
			],
			parameters: [
				{
					key: 'source_name',
					label: 'Источник захвата',
					type: 'combat_participant',
					valueSource: 'source',
					isRequired: true,
					defaultValue: 'источник захвата',
					sortOrder: 0
				},
				{
					key: 'holding_part',
					label: 'Способ удержания',
					type: 'text',
					valueSource: 'attack',
					isRequired: true,
					defaultValue: 'удерживающая часть или предмет',
					sortOrder: 1
				},
				{
					key: 'distance_rule',
					label: 'Правило дистанции',
					type: 'rule',
					valueSource: 'attack',
					isRequired: true,
					defaultValue:
						'Цель не может самостоятельно разорвать дистанцию больше допустимого значения.',
					sortOrder: 2
				},
				{
					key: 'movement_rule',
					label: 'Правило перемещения',
					type: 'rule',
					valueSource: 'attack',
					isRequired: true,
					defaultValue:
						'Обычное перемещение цели недоступно, пока захват не прекращён.',
					sortOrder: 3
				},
				{
					key: 'escape_rule',
					label: 'Правило освобождения',
					type: 'rule_template',
					valueSource: 'attack',
					isRequired: true,
					defaultValue: {
						template: 'opposed_check',
						checkName: 'проверка освобождения',
						potentialCost: 1,
						difficulty: 1
					},
					sortOrder: 4
				}
			],
			textBlocks: [
				{
					kind: 'text',
					text: 'Захват удерживает цель ',
					isActive: true,
					sortOrder: 0
				},
				{
					kind: 'token',
					token: 'ownerName',
					isActive: true,
					sortOrder: 1
				},
				{
					kind: 'text',
					text: '. Источник захвата: ',
					isActive: true,
					sortOrder: 2
				},
				{
					kind: 'token',
					token: 'parameter:source_name',
					isActive: true,
					sortOrder: 3
				},
				{
					kind: 'text',
					text: '. Способ удержания: ',
					isActive: true,
					sortOrder: 4
				},
				{
					kind: 'token',
					token: 'parameter:holding_part',
					isActive: true,
					sortOrder: 5
				},
				{
					kind: 'text',
					text: '. ',
					isActive: true,
					sortOrder: 6
				},
				{
					kind: 'token',
					token: 'parameter:distance_rule',
					isActive: true,
					sortOrder: 7
				},
				{
					kind: 'text',
					text: '. ',
					isActive: true,
					sortOrder: 8
				},
				{
					kind: 'token',
					token: 'parameter:movement_rule',
					isActive: true,
					sortOrder: 9
				},
				{
					kind: 'text',
					text: ' ',
					isActive: true,
					sortOrder: 10
				},
				{
					kind: 'token',
					token: 'parameter:escape_rule',
					isActive: true,
					sortOrder: 11
				}
			]
		}),
		condition('Удерживает', 'uderzhivaet', 10, {
			description: holdingDescription,
			durationType: 'until_removed',
			repeatLevelMode: 'keep_highest',
			repeatDurationMode: 'keep_highest',
			maxLevel: 5,
			removalMethods: ['remove_source'],
			effects: [
				{
					type: 'special_rule',
					scope: 'all_checks',
					value: 1,
					config: {
						text: 'Указанные части тела или предметы считаются занятыми. Все атаки и действия, требующие занятую часть тела или предмет, недоступны, пока захват не прекращён.'
					},
					sortOrder: 0
				},
				{
					type: 'special_rule',
					scope: 'all_checks',
					value: 1,
					config: {
						text: holdingRuleText
					},
					sortOrder: 1
				},
				{
					type: 'special_rule',
					scope: 'all_checks',
					value: 1,
					config: {
						text: holdingEndText
					},
					sortOrder: 2
				}
			],
			parameters: [
				{
					key: 'target_name',
					label: 'Цель захвата',
					type: 'combat_participant',
					valueSource: 'target',
					isRequired: true,
					defaultValue: 'цель',
					sortOrder: 0
				},
				{
					key: 'holding_part',
					label: 'Способ удержания',
					type: 'text',
					valueSource: 'attack',
					isRequired: true,
					defaultValue: 'удерживающая часть или предмет',
					sortOrder: 1
				},
				{
					key: 'distance_rule',
					label: 'Правило дистанции',
					type: 'rule',
					valueSource: 'attack',
					isRequired: true,
					defaultValue: 'Дистанция захвата определяется источником захвата.',
					sortOrder: 2
				},
				{
					key: 'movement_rule',
					label: 'Правило перемещения',
					type: 'rule',
					valueSource: 'attack',
					isRequired: true,
					defaultValue:
						'Удерживающий может перемещаться только по правилам источника захвата.',
					sortOrder: 3
				}
			],
			textBlocks: [
				{
					kind: 'text',
					text: 'Источник захвата ',
					isActive: true,
					sortOrder: 0
				},
				{
					kind: 'token',
					token: 'ownerName',
					isActive: true,
					sortOrder: 1
				},
				{
					kind: 'text',
					text: ' удерживает цель ',
					isActive: true,
					sortOrder: 2
				},
				{
					kind: 'token',
					token: 'parameter:target_name',
					isActive: true,
					sortOrder: 3
				},
				{
					kind: 'text',
					text: '. Способ удержания: ',
					isActive: true,
					sortOrder: 4
				},
				{
					kind: 'token',
					token: 'parameter:holding_part',
					isActive: true,
					sortOrder: 5
				},
				{
					kind: 'text',
					text: '. ',
					isActive: true,
					sortOrder: 6
				},
				{
					kind: 'token',
					token: 'parameter:distance_rule',
					isActive: true,
					sortOrder: 7
				},
				{
					kind: 'text',
					text: '. ',
					isActive: true,
					sortOrder: 8
				},
				{
					kind: 'token',
					token: 'parameter:movement_rule',
					isActive: true,
					sortOrder: 9
				}
			]
		})
	],
	schemaVersion: 1
} satisfies ContentDocument<{ conditions: ConditionContent[] }>;
