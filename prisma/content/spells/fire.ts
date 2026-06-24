import type { GroupedContentDocument, SpellContent } from '../content-types';

export default {
	"schemaVersion": 1,
	"group": "fire",
	"spells": [
		{
			"name": "Создать Огонь: Снаряд",
			"formulaName": "Создать + Огонь + Снаряд",
			"description": "Кастер создаёт огненный снаряд и направляет его в существо или объект в пределах дальности. Если целью является существо, кастер совершает атаку заклинанием, а цель может защититься Уклонением. Если целью является объект, мастер может использовать шкалу воспламенения, чтобы определить, какие предметы загораются от попадания.",
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
							"scale": "tiny",
							"growth": "smooth",
							"startLevel": 1,
							"minimum": 0,
							"maximum": null,
							"rangeMode": "none",
							"finalScale": 0.5,
							"sourceMode": "advanced",
							"sources": [
								{
									"sourceKind": "mechanicParameter",
									"sourceKey": "navyk-ataki",
									"transform": "value",
									"transformSourceKey": "",
									"transformDivisor": 2,
									"target": "growth",
									"weight": 2.4,
									"curve": "smooth"
								},
								{
									"sourceKind": "systemValue",
									"sourceKey": "uroven-zaklinatelya",
									"transform": "aboveSource",
									"transformSourceKey": "navyk-ataki",
									"transformDivisor": 2,
									"target": "growth",
									"weight": 0.27,
									"curve": "smooth"
								},
								{
									"sourceKind": "essenceProfile",
									"sourceKey": "range",
									"transform": "value",
									"transformSourceKey": "",
									"transformDivisor": 2,
									"target": "multiplier",
									"weight": 0.25,
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
							"scale": "tiny",
							"growth": "smooth",
							"startLevel": 1,
							"minimum": 0,
							"maximum": 6,
							"rangeMode": "none",
							"finalScale": 1,
							"sourceMode": "advanced",
							"sources": [
								{
									"sourceKind": "mechanicParameter",
									"sourceKey": "navyk-ataki",
									"transform": "aboveStart",
									"transformSourceKey": "",
									"transformDivisor": 2,
									"target": "growth",
									"weight": 0.7,
									"curve": "smooth"
								},
								{
									"sourceKind": "systemValue",
									"sourceKey": "uroven-zaklinatelya",
									"transform": "divide",
									"transformSourceKey": "",
									"transformDivisor": 8,
									"target": "growth",
									"weight": 0.5,
									"curve": "smooth"
								},
								{
									"sourceKind": "essenceProfile",
									"sourceKey": "damage",
									"transform": "value",
									"transformSourceKey": "",
									"transformDivisor": 2,
									"target": "multiplier",
									"weight": 0.3,
									"curve": "weak"
								},
								{
									"sourceKind": "mechanicParameter",
									"sourceKey": "navyk-ataki",
									"transform": "value",
									"transformSourceKey": "",
									"transformDivisor": 2,
									"target": "maximum",
									"weight": 0.8,
									"curve": "smooth"
								},
								{
									"sourceKind": "systemValue",
									"sourceKey": "uroven-zaklinatelya",
									"transform": "divide",
									"transformSourceKey": "",
									"transformDivisor": 10,
									"target": "maximum",
									"weight": 1,
									"curve": "smooth"
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
				},
				{
					"mechanicRef": {
						"slug": "shkala-effekta",
						"name": "Шкала эффекта"
					},
					"parameters": {
						"tsel": {
							"kind": "targetConfigRef",
							"target": "tsel-ataki",
							"name": "Цель атаки"
						},
						"navyk-proverki": {
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
						}
					},
					"config": {
						"effectScale": {
							"mode": "choice",
							"resultName": "Эффект воспламенения",
							"isSpellConfigured": true,
							"allowCustomItems": true,
							"source": {
								"kind": "actionResult",
								"resultName": "Успехи проверки",
								"actionSlug": "proverka-effekta"
							},
							"items": [
								{
									"requirement": "automatic",
									"threshold": 0,
									"name": "Легкогорючий крупный объект",
									"description": "Снаряд может поджечь крупный объект, который легко воспламеняется и не требует точного попадания (стог сена, сухая трава, охапка соломы, сухие ветки, рыхлая бумага).",
									"actions": []
								},
								{
									"requirement": "successes",
									"threshold": 1,
									"name": "Легкогорючий небольшой объект",
									"description": "Снаряд может поджечь небольшой или менее удобный легкогорючий объект, если попадание достаточно точное (факел, сухая тряпка, лист бумаги, пучок сухой травы, тонкая лучина).",
									"actions": []
								},
								{
									"requirement": "successes",
									"threshold": 2,
									"name": "Обычный горючий объект",
									"description": "Снаряд может поджечь обычный горючий предмет, которому нужно короткое устойчивое пламя (деревянная доска, сухое полено, тканевая занавеска, верёвка, кожаный ремень).",
									"actions": []
								},
								{
									"requirement": "successes",
									"threshold": 3,
									"name": "Плотный или плохо подготовленный объект",
									"description": "Снаряд может поджечь плотный, частично сырой или плохо подготовленный горючий предмет (толстое полено, сырая ткань, деревянная дверь, плотная книга, обивка мебели).",
									"actions": []
								},
								{
									"requirement": "successes",
									"threshold": 4,
									"name": "Трудно воспламеняемый объект",
									"description": "Снаряд может поджечь предмет, который обычно загорается только от сильного и точного воздействия (влажное дерево, плотная кожа, смолёная доска, пропитанная ткань, закрытый деревянный сундук).",
									"isOpenEnded": true,
									"actions": []
								}
							]
						}
					}
				}
			],
			"textBlocks": [
				{
					"kind": "text",
					"text": "Вы создаёте огненный снаряд и направляете его в существо или объект в пределах дальности."
				},
				{
					"kind": "mechanicText",
					"mechanic": "ataka-zaklinaniem"
				},
				{
					"kind": "mechanicText",
					"mechanic": "shkala-effekta"
				}
			]
		}
	]
} satisfies GroupedContentDocument<{ spells: SpellContent[] }>;
