import type { ConditionContent, ContentDocument } from '../content-types';

const automatic = ['automatic'] as const;

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
		maxLevel: overrides.maxLevel ?? 1,
		removalMethods: overrides.removalMethods ?? [...automatic],
		effects: overrides.effects ?? [],
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
		})
	],
	schemaVersion: 1
} satisfies ContentDocument<{ conditions: ConditionContent[] }>;
