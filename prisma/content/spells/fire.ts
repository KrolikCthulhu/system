import type { GroupedContentDocument, SpellContent } from '../content-types';

export default {
	"schemaVersion": 1,
	"group": "fire",
	"spells": [
		{
			"name": "Создать Огонь: Снаряд",
			"formulaName": "Создать + Огонь + Снаряд",
			"description": "Кастер создаёт огненный снаряд и направляет его в одну вражескую цель в пределах дальности. Кастер совершает бросок навыком атаки, цель может защититься Уклонением. Если успехов атаки больше, цель получает урон Огнём, равный разнице между успехами атаки и защиты плюс дополнительный урон.",
			"status": "DRAFT",
			"formula": {
				"action": {
					"type": "ACTION",
					"slug": "sozdat",
					"name": "Создать"
				},
				"essence": {
					"type": "ESSENCE",
					"slug": "ogon",
					"name": "Огонь"
				},
				"gesture": {
					"type": "GESTURE",
					"slug": "snaryad",
					"name": "Снаряд"
				}
			},
			"targetConfigs": [
				{
					"slug": "tsel-ataki",
					"name": "Цель атаки",
					"source": "selected",
					"relation": "enemy",
					"countMode": "one",
					"countValueMode": "fixed",
					"countValue": 1,
					"countFormula": "",
					"isRequired": true
				}
			],
			"mechanicBlocks": [
				{
					"mechanicRef": {
						"slug": "ataka-zaklinaniem",
						"name": "Атака заклинанием"
					},
					"parameters": {
						"tsel": {
							"kind": "targetConfigRef",
							"target": "tsel-ataki",
							"name": "Цель атаки"
						},
						"navyk-ataki": {
							"kind": "magicWordLinkedSkill",
							"magicWord": {
								"type": "ESSENCE",
								"slug": "ogon",
								"name": "Огонь"
							},
							"defaultSkill": {
								"slug": "ponimanie-potoka",
								"name": "Понимание Потока"
							}
						},
						"navyk-zaschity": {
							"kind": "skillRef",
							"slug": "uklonenie",
							"name": "Уклонение"
						},
						"dalnost": {
							"mode": "auto",
							"character": "scalable",
							"scale": "large",
							"growth": "smooth",
							"startLevel": 1,
							"minimum": 0,
							"sourceMode": "advanced",
							"sources": [
								{
									"sourceKind": "systemValue",
									"sourceKey": "uroven-zaklinatelya",
									"target": "base",
									"weight": 1,
									"curve": "smooth"
								},
								{
									"sourceKind": "mechanicParameter",
									"sourceKey": "navyk-ataki",
									"target": "growth",
									"weight": 1,
									"curve": "smooth"
								},
								{
									"sourceKind": "essenceProfile",
									"sourceKey": "range",
									"target": "multiplier",
									"weight": 0.4,
									"curve": "weak"
								}
							],
							"essenceInfluence": "light",
							"essenceProfileKey": "range",
							"roundingMode": "round"
						},
						"dopolnitelnyy-uron": {
							"mode": "auto",
							"character": "elemental",
							"scale": "small",
							"growth": "smooth",
							"startLevel": 1,
							"minimum": 0,
							"sourceMode": "advanced",
							"sources": [
								{
									"sourceKind": "mechanicParameter",
									"sourceKey": "navyk-ataki",
									"target": "growth",
									"weight": 1,
									"curve": "fast"
								},
								{
									"sourceKind": "systemValue",
									"sourceKey": "uroven-zaklinatelya",
									"target": "maximum",
									"weight": 0.5,
									"curve": "smooth"
								},
								{
									"sourceKind": "essenceProfile",
									"sourceKey": "damage",
									"target": "multiplier",
									"weight": 0.3,
									"curve": "weak"
								}
							],
							"essenceInfluence": "medium",
							"essenceProfileKey": "damage",
							"roundingMode": "round"
						},
						"tip-urona": {
							"kind": "magicWordLinkedDamageType",
							"magicWord": {
								"type": "ESSENCE",
								"slug": "ogon",
								"name": "Огонь"
							},
							"defaultDamageType": {
								"slug": "ogon",
								"name": "Огонь"
							}
						}
					},
					"config": {}
				}
			],
			"textBlocks": [
				{
					"kind": "text",
					"text": "Вы создаёте огненный снаряд и направляете его в выбранную цель."
				},
				{
					"kind": "mechanicText",
					"mechanic": "ataka-zaklinaniem"
				}
			]
		}
	]
} satisfies GroupedContentDocument<{ spells: SpellContent[] }>;
