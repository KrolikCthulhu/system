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

export const SKILL_CATEGORY_SEEDS = [
	{
		name: 'Боевые навыки',
		description: '',
		sortOrder: 0
	},
	{
		name: 'Магические навыки',
		description: '',
		sortOrder: 1
	}
] as const;

export const SKILL_SEEDS = [
	{
		name: 'Рукопашный бой',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Мощь',
		rollConsequenceName: 'Усталость',
		sortOrder: 0
	},
	{
		name: 'Метательное оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Рефлексы',
		rollConsequenceName: 'Усталость',
		sortOrder: 1
	},
	{
		name: 'Древковое оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Мощь',
		rollConsequenceName: 'Усталость',
		sortOrder: 2
	},
	{
		name: 'Клинковое оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Мощь',
		rollConsequenceName: 'Усталость',
		sortOrder: 3
	},
	{
		name: 'Ударное оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Мощь',
		rollConsequenceName: 'Усталость',
		sortOrder: 4
	},
	{
		name: 'Огнестрельное оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Рефлексы',
		rollConsequenceName: 'Усталость',
		sortOrder: 5
	},
	{
		name: 'Стрелковое оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Рефлексы',
		rollConsequenceName: 'Усталость',
		sortOrder: 6
	},
	{
		name: 'Уклонение',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Рефлексы',
		rollConsequenceName: 'Усталость',
		sortOrder: 7
	},
	{
		name: 'Понимание Сущности',
		categoryName: 'Магические навыки',
		rollCharacteristicName: 'Душа',
		rollConsequenceName: 'Стресс',
		sortOrder: 0
	},
	{
		name: 'Понимание Сознания',
		categoryName: 'Магические навыки',
		rollCharacteristicName: 'Душа',
		rollConsequenceName: 'Стресс',
		sortOrder: 1
	},
	{
		name: 'Понимание Формы',
		categoryName: 'Магические навыки',
		rollCharacteristicName: 'Душа',
		rollConsequenceName: 'Стресс',
		sortOrder: 2
	},
	{
		name: 'Понимание Потока',
		categoryName: 'Магические навыки',
		rollCharacteristicName: 'Душа',
		rollConsequenceName: 'Стресс',
		sortOrder: 3
	},
	{
		name: 'Понимание Порядка',
		categoryName: 'Магические навыки',
		rollCharacteristicName: 'Душа',
		rollConsequenceName: 'Стресс',
		sortOrder: 4
	}
] as const;

export const MAGIC_WORD_SEEDS = [
	{ type: 'ACTION', name: 'Создать', sortOrder: 0 },
	{ type: 'ACTION', name: 'Уничтожить', sortOrder: 1 },
	{ type: 'ACTION', name: 'Изменить', sortOrder: 2 },
	{ type: 'ACTION', name: 'Управлять', sortOrder: 3 },
	{ type: 'ACTION', name: 'Запечатать', sortOrder: 4 },
	{ type: 'ACTION', name: 'Обнаружить', sortOrder: 5 },
	{ type: 'ACTION', name: 'Скрыть', sortOrder: 6 },
	{ type: 'ACTION', name: 'Поднимать', sortOrder: 7 },
	{ type: 'ACTION', name: 'Ускорить', sortOrder: 8 },
	{ type: 'ACTION', name: 'Замедлить', sortOrder: 9 },
	{ type: 'ACTION', name: 'Усилить', sortOrder: 10 },
	{ type: 'ACTION', name: 'Ослабить', sortOrder: 11 },
	{ type: 'ACTION', name: 'Исцелить', sortOrder: 12 },
	{ type: 'ESSENCE', name: 'Огонь', sortOrder: 0 },
	{ type: 'ESSENCE', name: 'Вода', sortOrder: 1 },
	{ type: 'ESSENCE', name: 'Земля', sortOrder: 2 },
	{ type: 'ESSENCE', name: 'Воздух', sortOrder: 3 },
	{ type: 'ESSENCE', name: 'Смерть', sortOrder: 4 },
	{ type: 'ESSENCE', name: 'Жизнь', sortOrder: 5 },
	{ type: 'ESSENCE', name: 'Свет', sortOrder: 6 },
	{ type: 'ESSENCE', name: 'Тьма', sortOrder: 7 },
	{ type: 'ESSENCE', name: 'Тень', sortOrder: 8 },
	{ type: 'ESSENCE', name: 'Разум', sortOrder: 9 },
	{ type: 'ESSENCE', name: 'Кровь', sortOrder: 10 },
	{ type: 'ESSENCE', name: 'Яд', sortOrder: 11 },
	{ type: 'ESSENCE', name: 'Гром', sortOrder: 12 },
	{ type: 'ESSENCE', name: 'Туман', sortOrder: 13 },
	{ type: 'ESSENCE', name: 'Барьер', sortOrder: 14 },
	{ type: 'ESSENCE', name: 'Разложение', sortOrder: 15 },
	{ type: 'GESTURE', name: 'Снаряд', sortOrder: 0 },
	{ type: 'GESTURE', name: 'Касание', sortOrder: 1 },
	{ type: 'GESTURE', name: 'Закрепление', sortOrder: 2 },
	{ type: 'GESTURE', name: 'Материализация', sortOrder: 3 },
	{ type: 'GESTURE', name: 'Точка', sortOrder: 4 },
	{ type: 'GESTURE', name: 'Линия', sortOrder: 5 },
	{ type: 'GESTURE', name: 'Конус', sortOrder: 6 },
	{ type: 'GESTURE', name: 'Кольцо', sortOrder: 7 },
	{ type: 'GESTURE', name: 'Сфера', sortOrder: 8 },
	{ type: 'GESTURE', name: 'Куб', sortOrder: 9 },
	{ type: 'GESTURE', name: 'Цилиндр', sortOrder: 10 },
	{ type: 'MODIFIER', name: 'Продолжительный', sortOrder: 0 },
	{ type: 'MODIFIER', name: 'Прикрепленный', sortOrder: 1 },
	{ type: 'MODIFIER', name: 'Отложенный', sortOrder: 2 },
	{ type: 'MODIFIER', name: 'Отскакивающий', sortOrder: 3 },
	{ type: 'MODIFIER', name: 'Безмолвное', sortOrder: 4 }
] as const;

export const MAGIC_MODIFIER_GESTURE_RESTRICTION_SEEDS = [
	{
		modifierName: 'Прикрепленный',
		gestureNames: ['Сфера', 'Кольцо'] as const
	},
	{
		modifierName: 'Отскакивающий',
		gestureNames: ['Снаряд'] as const
	}
] as const;

export const MAGIC_WORD_ESSENCE_PROFILE_SEEDS = [
	{
		name: 'Огонь',
		damageAffinity: 0.9,
		rangeAffinity: 0.6,
		controlAffinity: 0.35,
		durationAffinity: 0.35,
		areaAffinity: 0.55,
		stabilityAffinity: 0.4
	},
	{
		name: 'Вода',
		damageAffinity: 0.45,
		rangeAffinity: 0.55,
		controlAffinity: 0.8,
		durationAffinity: 0.7,
		areaAffinity: 0.6,
		stabilityAffinity: 0.65
	},
	{
		name: 'Земля',
		damageAffinity: 0.85,
		rangeAffinity: 0.3,
		controlAffinity: 0.45,
		durationAffinity: 0.75,
		areaAffinity: 0.45,
		stabilityAffinity: 0.9
	},
	{
		name: 'Воздух',
		damageAffinity: 0.35,
		rangeAffinity: 0.9,
		controlAffinity: 0.7,
		durationAffinity: 0.45,
		areaAffinity: 0.8,
		stabilityAffinity: 0.35
	},
	{
		name: 'Смерть',
		damageAffinity: 0.8,
		rangeAffinity: 0.5,
		controlAffinity: 0.55,
		durationAffinity: 0.75,
		areaAffinity: 0.45,
		stabilityAffinity: 0.6
	},
	{
		name: 'Жизнь',
		damageAffinity: 0.25,
		rangeAffinity: 0.45,
		controlAffinity: 0.75,
		durationAffinity: 0.8,
		areaAffinity: 0.55,
		stabilityAffinity: 0.8
	},
	{
		name: 'Свет',
		damageAffinity: 0.6,
		rangeAffinity: 0.8,
		controlAffinity: 0.55,
		durationAffinity: 0.45,
		areaAffinity: 0.65,
		stabilityAffinity: 0.55
	},
	{
		name: 'Тьма',
		damageAffinity: 0.55,
		rangeAffinity: 0.55,
		controlAffinity: 0.75,
		durationAffinity: 0.8,
		areaAffinity: 0.7,
		stabilityAffinity: 0.45
	},
	{
		name: 'Тень',
		damageAffinity: 0.4,
		rangeAffinity: 0.75,
		controlAffinity: 0.85,
		durationAffinity: 0.65,
		areaAffinity: 0.5,
		stabilityAffinity: 0.35
	},
	{
		name: 'Разум',
		damageAffinity: 0.45,
		rangeAffinity: 0.65,
		controlAffinity: 0.95,
		durationAffinity: 0.7,
		areaAffinity: 0.4,
		stabilityAffinity: 0.55
	},
	{
		name: 'Кровь',
		damageAffinity: 0.7,
		rangeAffinity: 0.35,
		controlAffinity: 0.8,
		durationAffinity: 0.75,
		areaAffinity: 0.3,
		stabilityAffinity: 0.7
	},
	{
		name: 'Яд',
		damageAffinity: 0.65,
		rangeAffinity: 0.45,
		controlAffinity: 0.6,
		durationAffinity: 0.9,
		areaAffinity: 0.55,
		stabilityAffinity: 0.55
	},
	{
		name: 'Гром',
		damageAffinity: 0.8,
		rangeAffinity: 0.75,
		controlAffinity: 0.3,
		durationAffinity: 0.25,
		areaAffinity: 0.7,
		stabilityAffinity: 0.25
	},
	{
		name: 'Туман',
		damageAffinity: 0.25,
		rangeAffinity: 0.65,
		controlAffinity: 0.85,
		durationAffinity: 0.8,
		areaAffinity: 0.85,
		stabilityAffinity: 0.45
	},
	{
		name: 'Барьер',
		damageAffinity: 0.2,
		rangeAffinity: 0.45,
		controlAffinity: 0.65,
		durationAffinity: 0.85,
		areaAffinity: 0.65,
		stabilityAffinity: 0.95
	},
	{
		name: 'Разложение',
		damageAffinity: 0.75,
		rangeAffinity: 0.4,
		controlAffinity: 0.55,
		durationAffinity: 0.85,
		areaAffinity: 0.55,
		stabilityAffinity: 0.35
	}
] as const;

export const MAGIC_WORD_LINK_SEEDS = [
	{
		magicWordName: 'Огонь',
		skillNames: ['Понимание Потока'] as const,
		damageTypeNames: ['Огонь'] as const,
		conditionNames: ['Горение'] as const
	},
	{
		magicWordName: 'Вода',
		skillNames: ['Понимание Формы'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Земля',
		skillNames: ['Понимание Формы'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Воздух',
		skillNames: ['Понимание Формы'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Смерть',
		skillNames: ['Понимание Сущности'] as const,
		damageTypeNames: ['Некротический'] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Жизнь',
		skillNames: ['Понимание Сущности'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Свет',
		skillNames: ['Понимание Потока'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Тьма',
		skillNames: ['Понимание Порядка'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Тень',
		skillNames: ['Понимание Сознания'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Разум',
		skillNames: ['Понимание Сознания'] as const,
		damageTypeNames: ['Психический'] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Кровь',
		skillNames: ['Понимание Сущности'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Яд',
		skillNames: ['Понимание Сущности'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Гром',
		skillNames: ['Понимание Потока'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Туман',
		skillNames: ['Понимание Формы'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Барьер',
		skillNames: ['Понимание Формы'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	},
	{
		magicWordName: 'Разложение',
		skillNames: ['Понимание Сущности'] as const,
		damageTypeNames: [] as const,
		conditionNames: [] as const
	}
] as const;

export const DAMAGE_TYPE_SEEDS = [
	{ name: 'Режущий', sortOrder: 0 },
	{ name: 'Дробящий', sortOrder: 1 },
	{ name: 'Колющий', sortOrder: 2 },
	{ name: 'Огонь', sortOrder: 3 },
	{ name: 'Холод', sortOrder: 4 },
	{ name: 'Молния', sortOrder: 5 },
	{ name: 'Яд', sortOrder: 6 },
	{ name: 'Психический', sortOrder: 7 },
	{ name: 'Некротический', sortOrder: 8 },
	{ name: 'Силовой', sortOrder: 9 }
] as const;

export const CONDITION_SEEDS = [
	{ name: 'Горение', sortOrder: 0 },
	{ name: 'Мокрый', sortOrder: 1 },
	{ name: 'Заморозка', sortOrder: 2 },
	{ name: 'Кровотечение', sortOrder: 3 },
	{ name: 'Отравление', sortOrder: 4 },
	{ name: 'Ослепление', sortOrder: 5 },
	{ name: 'Оглушение', sortOrder: 6 },
	{ name: 'Обездвиживание', sortOrder: 7 }
] as const;

export const PROGRESSION_PRESET_SEEDS = [
	{
		name: 'Линейная',
		description: 'Равномерный рост на каждом шаге входного значения.',
		kind: 'LINEAR',
		config: { base: 0, step: 1, roundingMode: 'round' },
		sortOrder: 0
	},
	{
		name: 'Ступенчатая',
		description: 'Значение растёт дискретными ступенями через заданный интервал.',
		kind: 'STEP',
		config: { base: 0, step: 1, interval: 2, roundingMode: 'floor' },
		sortOrder: 1
	},
	{
		name: 'Квадратичная',
		description: 'Медленный старт с заметным усилением на высоких значениях.',
		kind: 'QUADRATIC',
		config: { base: 0, multiplier: 1, roundingMode: 'round' },
		sortOrder: 2
	},
	{
		name: 'Корневая',
		description: 'Быстрый старт с постепенным замедлением роста.',
		kind: 'SQUARE_ROOT',
		config: { base: 0, multiplier: 2, roundingMode: 'round' },
		sortOrder: 3
	},
	{
		name: 'Логарифмическая',
		description: 'Сильно замедляющийся рост для значений с жёстким контролем масштаба.',
		kind: 'LOGARITHMIC',
		config: { base: 0, multiplier: 3, roundingMode: 'round' },
		sortOrder: 4
	},
	{
		name: 'Насыщение',
		description: 'Быстрый рост в начале с приближением к верхней границе.',
		kind: 'SATURATION',
		config: { min: 0, max: 10, speed: 0.35, roundingMode: 'round' },
		sortOrder: 5
	},
	{
		name: 'Процентная',
		description: 'Масштабирование базового значения на процент от входного значения.',
		kind: 'PERCENT',
		config: { base: 10, percent: 0.1, roundingMode: 'round' },
		sortOrder: 6
	}
] as const;

export const SPELL_MECHANIC_CATEGORY_SEEDS = [
	{ name: 'Урон', sortOrder: 0 },
	{ name: 'Состояния', sortOrder: 1 }
] as const;

export const SPELL_MECHANIC_SEEDS = [
	{
		categoryName: 'Урон',
		name: 'Атака заклинанием',
		description:
			'Эта механика описывает заклинание, которым кастер пытается попасть по цели. Сначала кастер бросает кубы на атаку заклинанием. После этого цель может попытаться защититься и бросить кубы на защиту. Затем сравниваются успехи: если у кастера успехов больше, атака попала; если успехов столько же или меньше, атака не попала. Если атака попала, лишние успехи кастера становятся базовым уроном. Например, если у кастера 4 успеха, а у цели 2 успеха защиты, разница равна 2. К этой разнице добавляется дополнительный урон, указанный в заклинании. Получившееся число вычитается из здоровья цели. Тип урона берётся из настройки заклинания или из связанной сущности магического слова.',
		sortOrder: 0,
		configSchema: {},
		parameters: [
			{
				name: 'Цель',
				kind: 'target',
				required: true,
				configuredBySpell: true,
				overrideAllowed: false,
				defaultValue: { mode: 'empty', value: '' },
				defaultTargetConfig: {
					name: 'Цель атаки',
					source: 'selected',
					relation: 'enemy',
					countMode: 'one',
					countValueMode: 'fixed',
					countValue: 1,
					countFormula: '',
					isRequired: true
				}
			},
			{
				name: 'Навык атаки',
				kind: 'skill',
				required: true,
				configuredBySpell: false,
				overrideAllowed: true,
				defaultValue: { mode: 'fromMagicWord', value: '' }
			},
			{
				name: 'Навык защиты',
				kind: 'skill',
				required: true,
				configuredBySpell: false,
				overrideAllowed: true,
				defaultValue: { mode: 'static', value: 'Уклонение' }
			},
			{
				name: 'Дальность',
				kind: 'number',
				numericRole: 'range',
				required: true,
				configuredBySpell: true,
				overrideAllowed: true,
				defaultValue: { mode: 'empty', value: '' }
			},
			{
				name: 'Дополнительный урон',
				kind: 'number',
				numericRole: 'damage',
				required: false,
				configuredBySpell: true,
				overrideAllowed: true,
				defaultValue: { mode: 'static', value: '0' }
			},
			{
				name: 'Тип урона',
				kind: 'damageType',
				required: true,
				configuredBySpell: true,
				overrideAllowed: true,
				defaultValue: { mode: 'fromMagicWord', value: '' }
			}
		],
		actions: [
			{
				name: 'Бросок кастера',
				kind: 'roll',
				config: {
					actor: { kind: 'caster' },
					skill: {
						kind: 'mechanicParameterByName',
						parameterName: 'Навык атаки'
					},
					resultName: 'Успехи кастера'
				}
			},
			{
				name: 'Бросок защиты',
				kind: 'roll',
				config: {
					actor: {
						kind: 'mechanicParameterByName',
						parameterName: 'Цель'
					},
					skill: {
						kind: 'mechanicParameterByName',
						parameterName: 'Навык защиты'
					},
					optional: true,
					resultName: 'Успехи защиты'
				}
			},
			{
				name: 'Сравнить успехи',
				kind: 'comparison',
				config: {
					left: {
						kind: 'actionResultByName',
						actionName: 'Бросок кастера',
						resultName: 'Успехи кастера'
					},
					right: {
						kind: 'actionResultByName',
						actionName: 'Бросок защиты',
						resultName: 'Успехи защиты'
					},
					operator: 'gt',
					resultName: 'Атака успешна',
					marginResultName: 'Незащищённые успехи'
				}
			},
			{
				name: 'Если атака успешна',
				kind: 'branch',
				config: {
					condition: {
						kind: 'actionResultByName',
						actionName: 'Сравнить успехи',
						resultName: 'Атака успешна'
					},
					thenActions: [
						{
							name: 'Расчёт урона',
							kind: 'calculation',
							config: {
								resultName: 'Количество урона',
								graph: {
									nodes: [
										{
											id: 'source-unprotected-successes',
											kind: 'source',
											x: 120,
											y: 120,
											sourceId: {
												kind: 'actionResultByName',
												actionName: 'Сравнить успехи',
												resultName: 'Незащищённые успехи'
											}
										},
										{
											id: 'source-extra-damage',
											kind: 'source',
											x: 120,
											y: 260,
											sourceId: {
												kind: 'mechanicParameterByName',
												parameterName: 'Дополнительный урон'
											}
										},
										{
											id: 'operation-damage-sum',
											kind: 'operation',
											x: 420,
											y: 190,
											operation: 'sum'
										},
										{
											id: 'result-damage',
											kind: 'result',
											x: 720,
											y: 190
										}
									],
									edges: [
										{
											id: 'edge-unprotected-to-sum',
											source: 'source-unprotected-successes',
											target: 'operation-damage-sum',
											sourceHandle: 'out',
											targetHandle: 'in'
										},
										{
											id: 'edge-extra-to-sum',
											source: 'source-extra-damage',
											target: 'operation-damage-sum',
											sourceHandle: 'out',
											targetHandle: 'in'
										},
										{
											id: 'edge-sum-to-result',
											source: 'operation-damage-sum',
											target: 'result-damage',
											sourceHandle: 'out',
											targetHandle: 'in'
										}
									]
								}
							}
						},
						{
							name: 'Нанести урон',
							kind: 'valueChange',
							config: {
								target: {
									kind: 'mechanicParameterByName',
									parameterName: 'Цель'
								},
								systemValueName: 'Здоровье',
								operation: 'decrease',
								amount: {
									kind: 'actionResultByName',
									actionName: 'Расчёт урона',
									resultName: 'Количество урона'
								}
							}
						}
					],
					elseActions: []
				}
			}
		],
		textTemplate: {
			segments: [
				{
					kind: 'text',
					text: 'Совершите атаку заклинанием по цели в пределах '
				},
				{
					kind: 'mechanicParameterByName',
					parameterName: 'Дальность'
				},
				{
					kind: 'text',
					text: '. Цель может защититься. При попадании цель получает урон типа '
				},
				{
					kind: 'mechanicParameterByName',
					parameterName: 'Тип урона'
				},
				{
					kind: 'text',
					text: ', равный разнице между успехами атаки и защиты + '
				},
				{
					kind: 'mechanicParameterByName',
					parameterName: 'Дополнительный урон'
				},
				{
					kind: 'text',
					text: '.'
				}
			]
		}
	},
	{
		categoryName: 'Состояния',
		name: 'Наложение состояния',
		sortOrder: 0,
		configSchema: {},
		parameters: [
			{
				name: 'Цель',
				kind: 'target',
				required: true,
				configuredBySpell: true,
				overrideAllowed: false,
				defaultValue: { mode: 'empty', value: '' }
			},
			{
				name: 'Состояние',
				kind: 'condition',
				required: true,
				configuredBySpell: true,
				overrideAllowed: true,
				defaultValue: { mode: 'fromMagicWord', value: '' }
			}
		],
		actions: [
			{
				name: 'Наложить состояние',
				kind: 'conditionAdd',
				config: {
					targetParameter: 'Цель',
					conditionParameter: 'Состояние'
				}
			}
		],
		textTemplate: 'Цель получает выбранное состояние.'
	},
	{
		categoryName: 'Состояния',
		name: 'Снятие состояния',
		sortOrder: 1,
		configSchema: {},
		parameters: [
			{
				name: 'Цель',
				kind: 'target',
				required: true,
				configuredBySpell: true,
				overrideAllowed: false,
				defaultValue: { mode: 'empty', value: '' }
			},
			{
				name: 'Состояние',
				kind: 'condition',
				required: true,
				configuredBySpell: true,
				overrideAllowed: true,
				defaultValue: { mode: 'fromMagicWord', value: '' }
			}
		],
		actions: [
			{
				name: 'Снять состояние',
				kind: 'conditionRemove',
				config: {
					targetParameter: 'Цель',
					conditionParameter: 'Состояние'
				}
			}
		],
		textTemplate: 'Снимает выбранное состояние с цели.'
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
