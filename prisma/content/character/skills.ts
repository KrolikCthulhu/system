import type { ContentDocument, SkillCategoryContent } from '../content-types';

export default {
	"categories": [
		{
			"name": "Боевые навыки",
			"description": "",
			"sortOrder": 0,
			"skills": [
				{
					"name": "Рукопашный бой",
					"rollCharacteristicName": "Мощь",
					"rollConsequenceName": "Усталость",
					"sortOrder": 0,
					"slug": "rukopashnyy-boy"
				},
				{
					"name": "Метательное оружие",
					"rollCharacteristicName": "Рефлексы",
					"rollConsequenceName": "Усталость",
					"sortOrder": 1,
					"slug": "metatelnoe-oruzhie"
				},
				{
					"name": "Древковое оружие",
					"rollCharacteristicName": "Мощь",
					"rollConsequenceName": "Усталость",
					"sortOrder": 2,
					"slug": "drevkovoe-oruzhie"
				},
				{
					"name": "Клинковое оружие",
					"rollCharacteristicName": "Мощь",
					"rollConsequenceName": "Усталость",
					"sortOrder": 3,
					"slug": "klinkovoe-oruzhie"
				},
				{
					"name": "Ударное оружие",
					"rollCharacteristicName": "Мощь",
					"rollConsequenceName": "Усталость",
					"sortOrder": 4,
					"slug": "udarnoe-oruzhie"
				},
				{
					"name": "Огнестрельное оружие",
					"rollCharacteristicName": "Рефлексы",
					"rollConsequenceName": "Усталость",
					"sortOrder": 5,
					"slug": "ognestrelnoe-oruzhie"
				},
				{
					"name": "Стрелковое оружие",
					"rollCharacteristicName": "Рефлексы",
					"rollConsequenceName": "Усталость",
					"sortOrder": 6,
					"slug": "strelkovoe-oruzhie"
				},
				{
					"name": "Уклонение",
					"rollCharacteristicName": "Рефлексы",
					"rollConsequenceName": "Усталость",
					"sortOrder": 7,
					"slug": "uklonenie"
				}
			],
			"slug": "boevye-navyki"
		},
		{
			"name": "Магические навыки",
			"description": "",
			"sortOrder": 1,
			"skills": [
				{
					"name": "Понимание Сущности",
					"rollCharacteristicName": "Душа",
					"rollConsequenceName": "Стресс",
					"sortOrder": 0,
					"slug": "ponimanie-suschnosti"
				},
				{
					"name": "Понимание Сознания",
					"rollCharacteristicName": "Душа",
					"rollConsequenceName": "Стресс",
					"sortOrder": 1,
					"slug": "ponimanie-soznaniya"
				},
				{
					"name": "Понимание Формы",
					"rollCharacteristicName": "Душа",
					"rollConsequenceName": "Стресс",
					"sortOrder": 2,
					"slug": "ponimanie-formy"
				},
				{
					"name": "Понимание Потока",
					"rollCharacteristicName": "Душа",
					"rollConsequenceName": "Стресс",
					"sortOrder": 3,
					"slug": "ponimanie-potoka"
				},
				{
					"name": "Понимание Порядка",
					"rollCharacteristicName": "Душа",
					"rollConsequenceName": "Стресс",
					"sortOrder": 4,
					"slug": "ponimanie-poryadka"
				}
			],
			"slug": "magicheskie-navyki"
		}
	],
	"schemaVersion": 1
} satisfies ContentDocument<{ categories: SkillCategoryContent[] }>;
