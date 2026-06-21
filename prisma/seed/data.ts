const D6_SIDES_COUNT = 6;

export const SKILL_LEVEL_SEEDS = [
	{
		level: 0,
		name: 'Недоступно',
		canRoll: false,
		successMin: null,
		doubleSuccessMin: null,
		ignoreOnesCount: 0,
		ruleText: 'Действие недоступно.'
	},
	{
		level: 1,
		name: 'Только 6',
		canRoll: true,
		successMin: 6,
		doubleSuccessMin: null,
		ignoreOnesCount: 0,
		ruleText: 'Успех только на 6.'
	},
	{
		level: 2,
		name: '5-6',
		canRoll: true,
		successMin: 5,
		doubleSuccessMin: null,
		ignoreOnesCount: 0,
		ruleText: 'Успехи на 5-6.'
	},
	{
		level: 3,
		name: '5-6 и игнор 1',
		canRoll: true,
		successMin: 5,
		doubleSuccessMin: null,
		ignoreOnesCount: 1,
		ruleText: 'Успехи на 5-6, можно игнорировать одну выпавшую 1.'
	},
	{
		level: 4,
		name: '4-6 и игнор 1',
		canRoll: true,
		successMin: 4,
		doubleSuccessMin: null,
		ignoreOnesCount: 1,
		ruleText: 'Успехи на 4-6, можно игнорировать одну выпавшую 1.'
	},
	{
		level: 5,
		name: '4-6, 6 = 2 успеха, игнор 1',
		canRoll: true,
		successMin: 4,
		doubleSuccessMin: 6,
		ignoreOnesCount: 1,
		ruleText: 'Успехи на 4-6, 6 даёт 2 успеха, можно игнорировать одну выпавшую 1.'
	},
	{
		level: 6,
		name: '4-6, 5-6 = 2 успеха, игнор 1',
		canRoll: true,
		successMin: 4,
		doubleSuccessMin: 5,
		ignoreOnesCount: 1,
		ruleText: 'Успехи на 4-6, 5-6 дают 2 успеха, можно игнорировать одну выпавшую 1.'
	}
] as const;

export const ATTRIBUTE_SEEDS = [
	{
		name: 'Тело',
		description: 'Физический запас кубов персонажа.',
		sortOrder: 0
	},
	{
		name: 'Разум',
		description: 'Ментальный запас кубов персонажа.',
		sortOrder: 1
	}
] as const;

export const CHARACTERISTIC_SEEDS = [
	{
		name: 'Мощь',
		attributeName: 'Тело',
		description: '',
		minValue: 0,
		maxValue: 10,
		defaultValue: 0,
		sortOrder: 0
	},
	{
		name: 'Рефлексы',
		attributeName: 'Тело',
		description: '',
		minValue: 0,
		maxValue: 10,
		defaultValue: 0,
		sortOrder: 1
	},
	{
		name: 'Душа',
		attributeName: 'Разум',
		description: '',
		minValue: 0,
		maxValue: 10,
		defaultValue: 0,
		sortOrder: 0
	},
	{
		name: 'Память',
		attributeName: 'Разум',
		description: '',
		minValue: 0,
		maxValue: 10,
		defaultValue: 0,
		sortOrder: 1
	}
] as const;

export const ROLL_CONSEQUENCE_SEEDS = [
	{
		name: 'Усталость',
		description: 'Последствия физического напряжения.',
		sortOrder: 0,
		values: ['Очки усталости', 'Уровень усталости'] as const
	},
	{
		name: 'Стресс',
		description: 'Последствия ментального напряжения.',
		sortOrder: 1,
		values: ['Очки стресса', 'Уровень стресса'] as const
	},
	{
		name: 'Осложнение',
		description: 'Нарративное или ситуационное осложнение.',
		sortOrder: 2,
		values: [] as const
	}
] as const;

export function calculateExpectedSuccessPerDie(params: {
	canRoll: boolean;
	successMin: number | null;
	doubleSuccessMin: number | null;
}) {
	if (!params.canRoll || params.successMin === null) {
		return 0;
	}

	let totalSuccesses = 0;

	for (let face = 1; face <= D6_SIDES_COUNT; face += 1) {
		if (face >= params.successMin) {
			totalSuccesses += 1;
		}

		if (
			params.doubleSuccessMin !== null &&
			face >= params.doubleSuccessMin
		) {
			totalSuccesses += 1;
		}
	}

	return Number((totalSuccesses / D6_SIDES_COUNT).toFixed(4));
}
