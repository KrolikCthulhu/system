import type { ContentDocument, SpellMechanicCategoryContent, SpellMechanicContent } from '../content-types';

export default {
	"categories": [
		{
			"name": "Урон",
			"sortOrder": 0,
			"slug": "uron"
		},
		{
			"name": "Состояния",
			"sortOrder": 1,
			"slug": "sostoyaniya"
		},
		{
			"name": "Значения",
			"sortOrder": 2,
			"slug": "znacheniya"
		},
		{
			"name": "Эффекты",
			"sortOrder": 3,
			"slug": "effekty"
		}
	],
	"mechanics": [
		{
			"categoryName": "Урон",
			"name": "Атака заклинанием",
			"description": "Эта механика описывает заклинание, которым кастер пытается попасть по цели. Сначала кастер бросает кубы на атаку заклинанием. После этого цель может попытаться защититься и бросить кубы на защиту. Затем сравниваются успехи: если у кастера успехов больше, атака попала; если успехов столько же или меньше, атака не попала. Если атака попала, лишние успехи кастера становятся базовым уроном. Например, если у кастера 4 успеха, а у цели 2 успеха защиты, разница равна 2. К этой разнице добавляется дополнительный урон, указанный в заклинании. Получившееся число вычитается из здоровья цели. Тип урона берётся из настройки заклинания или из связанной сущности магического слова.",
			"sortOrder": 0,
			"configSchema": {
				"defaultApplication": {
					"visibilityRequired": true,
					"lineOfEffectRequired": true
				}
			},
			"parameters": [
				{
					"name": "Цель",
					"kind": "target",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": false,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"defaultTargetConfig": {
						"name": "Цель атаки",
						"source": "selected",
						"relation": "enemy",
						"countMode": "one",
						"countValueMode": "fixed",
						"countValue": 1,
						"countFormula": "",
						"isRequired": true
					},
					"slug": "tsel"
				},
				{
					"name": "Навык атаки",
					"kind": "skill",
					"required": true,
					"configuredBySpell": false,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "fromMagicWord",
						"value": ""
					},
					"slug": "navyk-ataki"
				},
				{
					"name": "Навык защиты",
					"kind": "skill",
					"required": true,
					"configuredBySpell": false,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "static",
						"value": "Уклонение"
					},
					"slug": "navyk-zaschity"
				},
				{
					"name": "Дальность",
					"kind": "number",
					"numericRole": "range",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "dalnost"
				},
				{
					"name": "Дополнительный урон",
					"kind": "number",
					"numericRole": "damage",
					"required": false,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "static",
						"value": "0"
					},
					"slug": "dopolnitelnyy-uron"
				},
				{
					"name": "Тип урона",
					"kind": "damageType",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "fromMagicWord",
						"value": ""
					},
					"slug": "tip-urona"
				}
			],
			"actions": [
				{
					"name": "Бросок кастера",
					"kind": "roll",
					"config": {
						"actor": {
							"kind": "caster"
						},
						"skill": {
							"kind": "mechanicParameter",
							"parameterSlug": "navyk-ataki"
						},
						"resultName": "Успехи кастера"
					},
					"slug": "brosok-kastera"
				},
				{
					"name": "Бросок защиты",
					"kind": "roll",
					"config": {
						"actor": {
							"kind": "mechanicParameter",
							"parameterSlug": "tsel"
						},
						"skill": {
							"kind": "mechanicParameter",
							"parameterSlug": "navyk-zaschity"
						},
						"optional": true,
						"resultName": "Успехи защиты"
					},
					"slug": "brosok-zaschity"
				},
				{
					"name": "Сравнить успехи",
					"kind": "comparison",
					"config": {
						"left": {
							"kind": "actionResult",
							"resultName": "Успехи кастера",
							"actionSlug": "brosok-kastera"
						},
						"right": {
							"kind": "actionResult",
							"resultName": "Успехи защиты",
							"actionSlug": "brosok-zaschity"
						},
						"operator": "gt",
						"resultName": "Атака успешна",
						"marginResultName": "Незащищённые успехи"
					},
					"slug": "sravnit-uspehi"
				},
				{
					"name": "Если атака успешна",
					"kind": "branch",
					"config": {
						"condition": {
							"kind": "actionResult",
							"resultName": "Атака успешна",
							"actionSlug": "sravnit-uspehi"
						},
						"thenActions": [
							{
								"name": "Расчёт урона",
								"kind": "calculation",
								"config": {
									"resultName": "Количество урона",
									"graph": {
										"nodes": [
											{
												"id": "source-unprotected-successes",
												"kind": "source",
												"x": 120,
												"y": 120,
												"sourceId": {
													"kind": "actionResult",
													"resultName": "Незащищённые успехи",
													"actionSlug": "sravnit-uspehi"
												}
											},
											{
												"id": "source-extra-damage",
												"kind": "source",
												"x": 120,
												"y": 260,
												"sourceId": {
													"kind": "mechanicParameter",
													"parameterSlug": "dopolnitelnyy-uron"
												}
											},
											{
												"id": "operation-damage-sum",
												"kind": "operation",
												"x": 420,
												"y": 190,
												"operation": "sum"
											},
											{
												"id": "result-damage",
												"kind": "result",
												"x": 720,
												"y": 190
											}
										],
										"edges": [
											{
												"id": "edge-unprotected-to-sum",
												"source": "source-unprotected-successes",
												"target": "operation-damage-sum",
												"sourceHandle": "out",
												"targetHandle": "in"
											},
											{
												"id": "edge-extra-to-sum",
												"source": "source-extra-damage",
												"target": "operation-damage-sum",
												"sourceHandle": "out",
												"targetHandle": "in"
											},
											{
												"id": "edge-sum-to-result",
												"source": "operation-damage-sum",
												"target": "result-damage",
												"sourceHandle": "out",
												"targetHandle": "in"
											}
										]
									}
								},
								"slug": "raschet-urona"
							},
							{
								"name": "Нанести урон",
								"kind": "valueChange",
								"config": {
									"target": {
										"kind": "mechanicParameter",
										"parameterSlug": "tsel"
									},
									"systemValueName": "Здоровье",
									"operation": "decrease",
									"amount": {
										"kind": "actionResult",
										"resultName": "Количество урона",
										"actionSlug": "raschet-urona"
									}
								},
								"slug": "nanesti-uron"
							}
						],
						"elseActions": []
					},
					"slug": "esli-ataka-uspeshna"
				}
			],
			"textTemplate": {
				"segments": [
					{
						"kind": "text",
						"text": "Совершите атаку заклинанием "
					},
					{
						"kind": "parameter",
						"parameterSlug": "tsel"
					},
					{
						"kind": "text",
						"text": " в пределах "
					},
					{
						"kind": "parameter",
						"parameterSlug": "dalnost"
					},
					{
						"kind": "text",
						"text": ", "
					},
					{
						"kind": "applicationText"
					},
					{
						"kind": "text",
						"text": ". Цель может защититься. При попадании цель получает урон типа "
					},
					{
						"kind": "parameter",
						"parameterSlug": "tip-urona"
					},
					{
						"kind": "text",
						"text": ", равный разнице между успехами атаки и защиты + "
					},
					{
						"kind": "parameter",
						"parameterSlug": "dopolnitelnyy-uron"
					},
					{
						"kind": "text",
						"text": "."
					}
				]
			},
			"slug": "ataka-zaklinaniem"
		},
		{
			"categoryName": "Состояния",
			"name": "Наложение состояния",
			"sortOrder": 0,
			"configSchema": {},
			"parameters": [
				{
					"name": "Цель",
					"kind": "target",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": false,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "tsel"
				},
				{
					"name": "Состояние",
					"kind": "condition",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "fromMagicWord",
						"value": ""
					},
					"slug": "sostoyanie"
				}
			],
			"actions": [
				{
					"name": "Наложить состояние",
					"kind": "conditionAdd",
					"config": {
						"target": {
							"kind": "mechanicParameter",
							"parameterSlug": "tsel"
						},
						"condition": {
							"kind": "mechanicParameter",
							"parameterSlug": "sostoyanie"
						}
					},
					"slug": "nalozhit-sostoyanie"
				}
			],
			"textTemplate": "Цель получает выбранное состояние.",
			"slug": "nalozhenie-sostoyaniya"
		},
		{
			"categoryName": "Состояния",
			"name": "Снятие состояния",
			"sortOrder": 1,
			"configSchema": {},
			"parameters": [
				{
					"name": "Цель",
					"kind": "target",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": false,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "tsel"
				},
				{
					"name": "Состояние",
					"kind": "condition",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "fromMagicWord",
						"value": ""
					},
					"slug": "sostoyanie"
				}
			],
			"actions": [
				{
					"name": "Снять состояние",
					"kind": "conditionRemove",
					"config": {
						"target": {
							"kind": "mechanicParameter",
							"parameterSlug": "tsel"
						},
						"condition": {
							"kind": "mechanicParameter",
							"parameterSlug": "sostoyanie"
						}
					},
					"slug": "snyat-sostoyanie"
				}
			],
			"textTemplate": "Снимает выбранное состояние с цели.",
			"slug": "snyatie-sostoyaniya"
		},
		{
			"categoryName": "Значения",
			"name": "Исцеление",
			"description": "Механика восстанавливает выбранное системное значение цели. По умолчанию используется для очков здоровья, но может применяться к любому ресурсу, который нужно восстановить.",
			"sortOrder": 0,
			"configSchema": {},
			"parameters": [
				{
					"name": "Цель",
					"kind": "target",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": false,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "tsel"
				},
				{
					"name": "Значение",
					"kind": "systemValue",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "static",
						"value": "Здоровье"
					},
					"slug": "znachenie"
				},
				{
					"name": "Величина",
					"kind": "number",
					"numericRole": "custom",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "velichina"
				}
			],
			"actions": [
				{
					"name": "Восстановить значение",
					"kind": "valueChange",
					"config": {
						"target": {
							"kind": "mechanicParameter",
							"parameterSlug": "tsel"
						},
						"systemValue": {
							"kind": "mechanicParameter",
							"parameterSlug": "znachenie"
						},
						"systemValueName": "Здоровье",
						"operation": "increase",
						"amount": {
							"kind": "mechanicParameter",
							"parameterSlug": "velichina"
						}
					},
					"slug": "vosstanovit-znachenie"
				}
			],
			"textTemplate": {
				"segments": [
					{
						"kind": "text",
						"text": "Восстановите "
					},
					{
						"kind": "parameter",
						"parameterSlug": "tsel"
					},
					{
						"kind": "text",
						"text": " "
					},
					{
						"kind": "parameter",
						"parameterSlug": "velichina"
					},
					{
						"kind": "text",
						"text": " "
					},
					{
						"kind": "parameter",
						"parameterSlug": "znachenie"
					},
					{
						"kind": "text",
						"text": "."
					}
				]
			},
			"slug": "istselenie"
		},
		{
			"categoryName": "Значения",
			"name": "Нанесение вреда",
			"description": "Механика уменьшает выбранное системное значение цели без отдельной проверки атаки. Подходит для прямого вреда, истощения ресурса и похожих эффектов.",
			"sortOrder": 1,
			"configSchema": {},
			"parameters": [
				{
					"name": "Цель",
					"kind": "target",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": false,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "tsel"
				},
				{
					"name": "Значение",
					"kind": "systemValue",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "static",
						"value": "Здоровье"
					},
					"slug": "znachenie"
				},
				{
					"name": "Величина",
					"kind": "number",
					"numericRole": "damage",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "velichina"
				}
			],
			"actions": [
				{
					"name": "Уменьшить значение",
					"kind": "valueChange",
					"config": {
						"target": {
							"kind": "mechanicParameter",
							"parameterSlug": "tsel"
						},
						"systemValue": {
							"kind": "mechanicParameter",
							"parameterSlug": "znachenie"
						},
						"systemValueName": "Здоровье",
						"operation": "decrease",
						"amount": {
							"kind": "mechanicParameter",
							"parameterSlug": "velichina"
						}
					},
					"slug": "umenshit-znachenie"
				}
			],
			"textTemplate": {
				"segments": [
					{
						"kind": "parameter",
						"parameterSlug": "tsel"
					},
					{
						"kind": "text",
						"text": " теряет "
					},
					{
						"kind": "parameter",
						"parameterSlug": "velichina"
					},
					{
						"kind": "text",
						"text": " "
					},
					{
						"kind": "parameter",
						"parameterSlug": "znachenie"
					},
					{
						"kind": "text",
						"text": "."
					}
				]
			},
			"slug": "nanesenie-vreda"
		},
		{
			"categoryName": "Значения",
			"name": "Усиление значения",
			"description": "Механика временно или постоянно увеличивает выбранное системное значение цели.",
			"sortOrder": 2,
			"configSchema": {},
			"parameters": [
				{
					"name": "Цель",
					"kind": "target",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": false,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "tsel"
				},
				{
					"name": "Значение",
					"kind": "systemValue",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "znachenie"
				},
				{
					"name": "Величина",
					"kind": "number",
					"numericRole": "custom",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "velichina"
				}
			],
			"actions": [
				{
					"name": "Усилить значение",
					"kind": "valueChange",
					"config": {
						"target": {
							"kind": "mechanicParameter",
							"parameterSlug": "tsel"
						},
						"systemValue": {
							"kind": "mechanicParameter",
							"parameterSlug": "znachenie"
						},
						"operation": "increase",
						"amount": {
							"kind": "mechanicParameter",
							"parameterSlug": "velichina"
						}
					},
					"slug": "usilit-znachenie"
				}
			],
			"textTemplate": "Цель получает бонус к выбранному значению.",
			"slug": "usilenie-znacheniya"
		},
		{
			"categoryName": "Значения",
			"name": "Ослабление значения",
			"description": "Механика временно или постоянно уменьшает выбранное системное значение цели.",
			"sortOrder": 3,
			"configSchema": {},
			"parameters": [
				{
					"name": "Цель",
					"kind": "target",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": false,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "tsel"
				},
				{
					"name": "Значение",
					"kind": "systemValue",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "znachenie"
				},
				{
					"name": "Величина",
					"kind": "number",
					"numericRole": "custom",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "velichina"
				}
			],
			"actions": [
				{
					"name": "Ослабить значение",
					"kind": "valueChange",
					"config": {
						"target": {
							"kind": "mechanicParameter",
							"parameterSlug": "tsel"
						},
						"systemValue": {
							"kind": "mechanicParameter",
							"parameterSlug": "znachenie"
						},
						"operation": "decrease",
						"amount": {
							"kind": "mechanicParameter",
							"parameterSlug": "velichina"
						}
					},
					"slug": "oslabit-znachenie"
				}
			],
			"textTemplate": "Цель получает штраф к выбранному значению.",
			"slug": "oslablenie-znacheniya"
		},
		{
			"categoryName": "Эффекты",
			"name": "Шкала эффекта",
			"description": "Эта механика позволяет привязать результат проверки к таблице эффектов. Кастер делает бросок выбранным навыком, после чего система смотрит, какие пункты шкалы доступны по количеству успехов. В зависимости от режима можно автоматически выбрать лучший доступный пункт, выполнить все доступные пункты, потребовать точное совпадение или дать администратору/игроку выбрать один из доступных вариантов. Конкретные пункты шкалы и их эффекты настраиваются в заклинании.",
			"sortOrder": 0,
			"configSchema": {
				"defaultApplication": {
					"visibilityRequired": true,
					"lineOfEffectRequired": false
				}
			},
			"parameters": [
				{
					"name": "Цель",
					"kind": "target",
					"required": false,
					"configuredBySpell": true,
					"overrideAllowed": false,
					"defaultValue": {
						"mode": "empty",
						"value": ""
					},
					"slug": "tsel"
				},
				{
					"name": "Навык проверки",
					"kind": "skill",
					"required": true,
					"configuredBySpell": true,
					"overrideAllowed": true,
					"defaultValue": {
						"mode": "fromMagicWord",
						"value": ""
					},
					"slug": "navyk-proverki"
				}
			],
			"actions": [
				{
					"name": "Проверка эффекта",
					"kind": "roll",
					"config": {
						"actor": {
							"kind": "caster"
						},
						"skill": {
							"kind": "mechanicParameter",
							"parameterSlug": "navyk-proverki"
						},
						"resultName": "Успехи проверки"
					},
					"slug": "proverka-effekta"
				},
				{
					"name": "Шкала эффекта",
					"kind": "effectScale",
					"config": {
						"source": {
							"kind": "actionResult",
							"resultName": "Успехи проверки",
							"actionSlug": "proverka-effekta"
						},
						"mode": "choice",
						"resultName": "Выбранный эффект",
						"isSpellConfigured": true,
						"allowCustomItems": true,
						"items": [
							{
								"id": "effect-scale-item-0",
								"threshold": 0,
								"name": "0 успехов",
								"description": "",
								"actions": []
							},
							{
								"id": "effect-scale-item-1",
								"threshold": 1,
								"name": "1 успех",
								"description": "",
								"actions": []
							},
							{
								"id": "effect-scale-item-2",
								"threshold": 2,
								"name": "2 успеха",
								"description": "",
								"actions": []
							},
							{
								"id": "effect-scale-item-3",
								"threshold": 3,
								"name": "3 успеха",
								"description": "",
								"actions": []
							},
							{
								"id": "effect-scale-item-4",
								"threshold": 4,
								"name": "4+ успеха",
								"description": "",
								"isOpenEnded": true,
								"actions": []
							}
						]
					},
					"slug": "shkala-effekta"
				}
			],
			"textTemplate": {
				"segments": [
					{
						"kind": "text",
						"text": "Совершите проверку навыком "
					},
					{
						"kind": "parameter",
						"parameterSlug": "navyk-proverki"
					},
					{
						"kind": "text",
						"text": " "
					},
					{
						"kind": "applicationText"
					},
					{
						"kind": "text",
						"text": ". По количеству успехов выберите доступный пункт шкалы эффекта."
					}
				]
			},
			"slug": "shkala-effekta"
		}
	],
	"schemaVersion": 1
} satisfies ContentDocument<{ categories: SpellMechanicCategoryContent[]; mechanics: SpellMechanicContent[] }>;
