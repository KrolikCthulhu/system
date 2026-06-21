import type { ContentDocument, DamageTypeContent } from '../content-types';

export default {
	"damageTypes": [
		{
			"name": "Режущий",
			"sortOrder": 0,
			"slug": "rezhuschiy"
		},
		{
			"name": "Дробящий",
			"sortOrder": 1,
			"slug": "drobyaschiy"
		},
		{
			"name": "Колющий",
			"sortOrder": 2,
			"slug": "kolyuschiy"
		},
		{
			"name": "Огонь",
			"sortOrder": 3,
			"slug": "ogon"
		},
		{
			"name": "Холод",
			"sortOrder": 4,
			"slug": "holod"
		},
		{
			"name": "Молния",
			"sortOrder": 5,
			"slug": "molniya"
		},
		{
			"name": "Яд",
			"sortOrder": 6,
			"slug": "yad"
		},
		{
			"name": "Психический",
			"sortOrder": 7,
			"slug": "psihicheskiy"
		},
		{
			"name": "Некротический",
			"sortOrder": 8,
			"slug": "nekroticheskiy"
		},
		{
			"name": "Силовой",
			"sortOrder": 9,
			"slug": "silovoy"
		}
	],
	"schemaVersion": 1
} satisfies ContentDocument<{ damageTypes: DamageTypeContent[] }>;
