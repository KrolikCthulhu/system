import type { ContentDocument, ConditionContent } from '../content-types';

export default {
	"conditions": [
		{
			"name": "Горение",
			"sortOrder": 0,
			"slug": "gorenie"
		},
		{
			"name": "Мокрый",
			"sortOrder": 1,
			"slug": "mokryy"
		},
		{
			"name": "Заморозка",
			"sortOrder": 2,
			"slug": "zamorozka"
		},
		{
			"name": "Кровотечение",
			"sortOrder": 3,
			"slug": "krovotechenie"
		},
		{
			"name": "Отравление",
			"sortOrder": 4,
			"slug": "otravlenie"
		},
		{
			"name": "Ослепление",
			"sortOrder": 5,
			"slug": "osleplenie"
		},
		{
			"name": "Оглушение",
			"sortOrder": 6,
			"slug": "oglushenie"
		},
		{
			"name": "Обездвиживание",
			"sortOrder": 7,
			"slug": "obezdvizhivanie"
		}
	],
	"schemaVersion": 1
} satisfies ContentDocument<{ conditions: ConditionContent[] }>;
