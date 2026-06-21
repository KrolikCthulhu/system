import type { ContentDocument, ProgressionContent } from '../content-types';

export default {
	"progressions": [
		{
			"name": "Линейная",
			"description": "Равномерный рост на каждом шаге входного значения.",
			"kind": "LINEAR",
			"config": {
				"base": 0,
				"step": 1,
				"roundingMode": "round"
			},
			"sortOrder": 0,
			"slug": "lineynaya"
		},
		{
			"name": "Ступенчатая",
			"description": "Значение растёт дискретными ступенями через заданный интервал.",
			"kind": "STEP",
			"config": {
				"base": 0,
				"step": 1,
				"interval": 2,
				"roundingMode": "floor"
			},
			"sortOrder": 1,
			"slug": "stupenchataya"
		},
		{
			"name": "Квадратичная",
			"description": "Медленный старт с заметным усилением на высоких значениях.",
			"kind": "QUADRATIC",
			"config": {
				"base": 0,
				"multiplier": 1,
				"roundingMode": "round"
			},
			"sortOrder": 2,
			"slug": "kvadratichnaya"
		},
		{
			"name": "Корневая",
			"description": "Быстрый старт с постепенным замедлением роста.",
			"kind": "SQUARE_ROOT",
			"config": {
				"base": 0,
				"multiplier": 2,
				"roundingMode": "round"
			},
			"sortOrder": 3,
			"slug": "kornevaya"
		},
		{
			"name": "Логарифмическая",
			"description": "Сильно замедляющийся рост для значений с жёстким контролем масштаба.",
			"kind": "LOGARITHMIC",
			"config": {
				"base": 0,
				"multiplier": 3,
				"roundingMode": "round"
			},
			"sortOrder": 4,
			"slug": "logarifmicheskaya"
		},
		{
			"name": "Насыщение",
			"description": "Быстрый рост в начале с приближением к верхней границе.",
			"kind": "SATURATION",
			"config": {
				"min": 0,
				"max": 10,
				"speed": 0.35,
				"roundingMode": "round"
			},
			"sortOrder": 5,
			"slug": "nasyschenie"
		},
		{
			"name": "Процентная",
			"description": "Масштабирование базового значения на процент от входного значения.",
			"kind": "PERCENT",
			"config": {
				"base": 10,
				"percent": 0.1,
				"roundingMode": "round"
			},
			"sortOrder": 6,
			"slug": "protsentnaya"
		}
	],
	"schemaVersion": 1
} satisfies ContentDocument<{ progressions: ProgressionContent[] }>;
