import type { ContentDocument, MagicModifierGestureRestrictionContent, MagicWordContent, MagicWordEssenceProfileContent, MagicWordLinkContent } from '../content-types';

export default {
	"words": [
		{
			"type": "ACTION",
			"name": "Создать",
			"sortOrder": 0,
			"slug": "sozdat"
		},
		{
			"type": "ACTION",
			"name": "Уничтожить",
			"sortOrder": 1,
			"slug": "unichtozhit"
		},
		{
			"type": "ACTION",
			"name": "Изменить",
			"sortOrder": 2,
			"slug": "izmenit"
		},
		{
			"type": "ACTION",
			"name": "Управлять",
			"sortOrder": 3,
			"slug": "upravlyat"
		},
		{
			"type": "ACTION",
			"name": "Запечатать",
			"sortOrder": 4,
			"slug": "zapechatat"
		},
		{
			"type": "ACTION",
			"name": "Обнаружить",
			"sortOrder": 5,
			"slug": "obnaruzhit"
		},
		{
			"type": "ACTION",
			"name": "Скрыть",
			"sortOrder": 6,
			"slug": "skryt"
		},
		{
			"type": "ACTION",
			"name": "Поднимать",
			"sortOrder": 7,
			"slug": "podnimat"
		},
		{
			"type": "ACTION",
			"name": "Ускорить",
			"sortOrder": 8,
			"slug": "uskorit"
		},
		{
			"type": "ACTION",
			"name": "Замедлить",
			"sortOrder": 9,
			"slug": "zamedlit"
		},
		{
			"type": "ACTION",
			"name": "Усилить",
			"sortOrder": 10,
			"slug": "usilit"
		},
		{
			"type": "ACTION",
			"name": "Ослабить",
			"sortOrder": 11,
			"slug": "oslabit"
		},
		{
			"type": "ACTION",
			"name": "Исцелить",
			"sortOrder": 12,
			"slug": "istselit"
		},
		{
			"type": "ESSENCE",
			"name": "Огонь",
			"sortOrder": 0,
			"slug": "ogon"
		},
		{
			"type": "ESSENCE",
			"name": "Вода",
			"sortOrder": 1,
			"slug": "voda"
		},
		{
			"type": "ESSENCE",
			"name": "Земля",
			"sortOrder": 2,
			"slug": "zemlya"
		},
		{
			"type": "ESSENCE",
			"name": "Воздух",
			"sortOrder": 3,
			"slug": "vozduh"
		},
		{
			"type": "ESSENCE",
			"name": "Смерть",
			"sortOrder": 4,
			"slug": "smert"
		},
		{
			"type": "ESSENCE",
			"name": "Жизнь",
			"sortOrder": 5,
			"slug": "zhizn"
		},
		{
			"type": "ESSENCE",
			"name": "Свет",
			"sortOrder": 6,
			"slug": "svet"
		},
		{
			"type": "ESSENCE",
			"name": "Тьма",
			"sortOrder": 7,
			"slug": "tma"
		},
		{
			"type": "ESSENCE",
			"name": "Тень",
			"sortOrder": 8,
			"slug": "ten"
		},
		{
			"type": "ESSENCE",
			"name": "Разум",
			"sortOrder": 9,
			"slug": "razum"
		},
		{
			"type": "ESSENCE",
			"name": "Кровь",
			"sortOrder": 10,
			"slug": "krov"
		},
		{
			"type": "ESSENCE",
			"name": "Яд",
			"sortOrder": 11,
			"slug": "yad"
		},
		{
			"type": "ESSENCE",
			"name": "Гром",
			"sortOrder": 12,
			"slug": "grom"
		},
		{
			"type": "ESSENCE",
			"name": "Туман",
			"sortOrder": 13,
			"slug": "tuman"
		},
		{
			"type": "ESSENCE",
			"name": "Барьер",
			"sortOrder": 14,
			"slug": "barer"
		},
		{
			"type": "ESSENCE",
			"name": "Разложение",
			"sortOrder": 15,
			"slug": "razlozhenie"
		},
		{
			"type": "GESTURE",
			"name": "Снаряд",
			"sortOrder": 0,
			"slug": "snaryad"
		},
		{
			"type": "GESTURE",
			"name": "Касание",
			"sortOrder": 1,
			"slug": "kasanie"
		},
		{
			"type": "GESTURE",
			"name": "Закрепление",
			"sortOrder": 2,
			"slug": "zakreplenie"
		},
		{
			"type": "GESTURE",
			"name": "Материализация",
			"sortOrder": 3,
			"slug": "materializatsiya"
		},
		{
			"type": "GESTURE",
			"name": "Точка",
			"sortOrder": 4,
			"slug": "tochka"
		},
		{
			"type": "GESTURE",
			"name": "Линия",
			"sortOrder": 5,
			"slug": "liniya"
		},
		{
			"type": "GESTURE",
			"name": "Плоскость",
			"sortOrder": 6,
			"slug": "ploskost"
		},
		{
			"type": "GESTURE",
			"name": "Конус",
			"sortOrder": 7,
			"slug": "konus"
		},
		{
			"type": "GESTURE",
			"name": "Кольцо",
			"sortOrder": 8,
			"slug": "koltso"
		},
		{
			"type": "GESTURE",
			"name": "Сфера",
			"sortOrder": 9,
			"slug": "sfera"
		},
		{
			"type": "GESTURE",
			"name": "Куб",
			"sortOrder": 10,
			"slug": "kub"
		},
		{
			"type": "GESTURE",
			"name": "Цилиндр",
			"sortOrder": 11,
			"slug": "tsilindr"
		},
		{
			"type": "MODIFIER",
			"name": "Продолжительный",
			"sortOrder": 0,
			"slug": "prodolzhitelnyy"
		},
		{
			"type": "MODIFIER",
			"name": "Прикрепленный",
			"sortOrder": 1,
			"slug": "prikreplennyy"
		},
		{
			"type": "MODIFIER",
			"name": "Отложенный",
			"sortOrder": 2,
			"slug": "otlozhennyy"
		},
		{
			"type": "MODIFIER",
			"name": "Отскакивающий",
			"sortOrder": 3,
			"slug": "otskakivayuschiy"
		},
		{
			"type": "MODIFIER",
			"name": "Безмолвное",
			"sortOrder": 4,
			"slug": "bezmolvnoe"
		}
	],
	"modifierGestureRestrictions": [
		{
			"modifierName": "Прикрепленный",
			"gestureNames": [
				"Сфера",
				"Кольцо"
			],
			"modifierSlug": "prikreplennyy",
			"gestureSlugs": [
				"sfera",
				"koltso"
			]
		},
		{
			"modifierName": "Отскакивающий",
			"gestureNames": [
				"Снаряд"
			],
			"modifierSlug": "otskakivayuschiy",
			"gestureSlugs": [
				"snaryad"
			]
		}
	],
	"essenceProfiles": [
		{
			"name": "Огонь",
			"damageAffinity": 0.9,
			"rangeAffinity": 0.6,
			"controlAffinity": 0.35,
			"durationAffinity": 0.35,
			"areaAffinity": 0.55,
			"stabilityAffinity": 0.4,
			"slug": "ogon"
		},
		{
			"name": "Вода",
			"damageAffinity": 0.45,
			"rangeAffinity": 0.55,
			"controlAffinity": 0.8,
			"durationAffinity": 0.7,
			"areaAffinity": 0.6,
			"stabilityAffinity": 0.65,
			"slug": "voda"
		},
		{
			"name": "Земля",
			"damageAffinity": 0.85,
			"rangeAffinity": 0.3,
			"controlAffinity": 0.45,
			"durationAffinity": 0.75,
			"areaAffinity": 0.45,
			"stabilityAffinity": 0.9,
			"slug": "zemlya"
		},
		{
			"name": "Воздух",
			"damageAffinity": 0.35,
			"rangeAffinity": 0.9,
			"controlAffinity": 0.7,
			"durationAffinity": 0.45,
			"areaAffinity": 0.8,
			"stabilityAffinity": 0.35,
			"slug": "vozduh"
		},
		{
			"name": "Смерть",
			"damageAffinity": 0.8,
			"rangeAffinity": 0.5,
			"controlAffinity": 0.55,
			"durationAffinity": 0.75,
			"areaAffinity": 0.45,
			"stabilityAffinity": 0.6,
			"slug": "smert"
		},
		{
			"name": "Жизнь",
			"damageAffinity": 0.25,
			"rangeAffinity": 0.45,
			"controlAffinity": 0.75,
			"durationAffinity": 0.8,
			"areaAffinity": 0.55,
			"stabilityAffinity": 0.8,
			"slug": "zhizn"
		},
		{
			"name": "Свет",
			"damageAffinity": 0.6,
			"rangeAffinity": 0.8,
			"controlAffinity": 0.55,
			"durationAffinity": 0.45,
			"areaAffinity": 0.65,
			"stabilityAffinity": 0.55,
			"slug": "svet"
		},
		{
			"name": "Тьма",
			"damageAffinity": 0.55,
			"rangeAffinity": 0.55,
			"controlAffinity": 0.75,
			"durationAffinity": 0.8,
			"areaAffinity": 0.7,
			"stabilityAffinity": 0.45,
			"slug": "tma"
		},
		{
			"name": "Тень",
			"damageAffinity": 0.4,
			"rangeAffinity": 0.75,
			"controlAffinity": 0.85,
			"durationAffinity": 0.65,
			"areaAffinity": 0.5,
			"stabilityAffinity": 0.35,
			"slug": "ten"
		},
		{
			"name": "Разум",
			"damageAffinity": 0.45,
			"rangeAffinity": 0.65,
			"controlAffinity": 0.95,
			"durationAffinity": 0.7,
			"areaAffinity": 0.4,
			"stabilityAffinity": 0.55,
			"slug": "razum"
		},
		{
			"name": "Кровь",
			"damageAffinity": 0.7,
			"rangeAffinity": 0.35,
			"controlAffinity": 0.8,
			"durationAffinity": 0.75,
			"areaAffinity": 0.3,
			"stabilityAffinity": 0.7,
			"slug": "krov"
		},
		{
			"name": "Яд",
			"damageAffinity": 0.65,
			"rangeAffinity": 0.45,
			"controlAffinity": 0.6,
			"durationAffinity": 0.9,
			"areaAffinity": 0.55,
			"stabilityAffinity": 0.55,
			"slug": "yad"
		},
		{
			"name": "Гром",
			"damageAffinity": 0.8,
			"rangeAffinity": 0.75,
			"controlAffinity": 0.3,
			"durationAffinity": 0.25,
			"areaAffinity": 0.7,
			"stabilityAffinity": 0.25,
			"slug": "grom"
		},
		{
			"name": "Туман",
			"damageAffinity": 0.25,
			"rangeAffinity": 0.65,
			"controlAffinity": 0.85,
			"durationAffinity": 0.8,
			"areaAffinity": 0.85,
			"stabilityAffinity": 0.45,
			"slug": "tuman"
		},
		{
			"name": "Барьер",
			"damageAffinity": 0.2,
			"rangeAffinity": 0.45,
			"controlAffinity": 0.65,
			"durationAffinity": 0.85,
			"areaAffinity": 0.65,
			"stabilityAffinity": 0.95,
			"slug": "barer"
		},
		{
			"name": "Разложение",
			"damageAffinity": 0.75,
			"rangeAffinity": 0.4,
			"controlAffinity": 0.55,
			"durationAffinity": 0.85,
			"areaAffinity": 0.55,
			"stabilityAffinity": 0.35,
			"slug": "razlozhenie"
		}
	],
	"links": [
		{
			"magicWordName": "Огонь",
			"skillNames": [
				"Понимание Потока"
			],
			"damageTypeNames": [
				"Огонь"
			],
			"conditionNames": [
				"Горение"
			],
			"magicWordSlug": "ogon",
			"skillSlugs": [
				"ponimanie-potoka"
			],
			"damageTypeSlugs": [
				"ogon"
			],
			"conditionSlugs": [
				"gorenie"
			]
		},
		{
			"magicWordName": "Вода",
			"skillNames": [
				"Понимание Формы"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "voda",
			"skillSlugs": [
				"ponimanie-formy"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Земля",
			"skillNames": [
				"Понимание Формы"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "zemlya",
			"skillSlugs": [
				"ponimanie-formy"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Воздух",
			"skillNames": [
				"Понимание Формы"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "vozduh",
			"skillSlugs": [
				"ponimanie-formy"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Смерть",
			"skillNames": [
				"Понимание Сущности"
			],
			"damageTypeNames": [
				"Некротический"
			],
			"conditionNames": [],
			"magicWordSlug": "smert",
			"skillSlugs": [
				"ponimanie-suschnosti"
			],
			"damageTypeSlugs": [
				"nekroticheskiy"
			],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Жизнь",
			"skillNames": [
				"Понимание Сущности"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "zhizn",
			"skillSlugs": [
				"ponimanie-suschnosti"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Свет",
			"skillNames": [
				"Понимание Потока"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "svet",
			"skillSlugs": [
				"ponimanie-potoka"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Тьма",
			"skillNames": [
				"Понимание Порядка"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "tma",
			"skillSlugs": [
				"ponimanie-poryadka"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Тень",
			"skillNames": [
				"Понимание Сознания"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "ten",
			"skillSlugs": [
				"ponimanie-soznaniya"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Разум",
			"skillNames": [
				"Понимание Сознания"
			],
			"damageTypeNames": [
				"Психический"
			],
			"conditionNames": [],
			"magicWordSlug": "razum",
			"skillSlugs": [
				"ponimanie-soznaniya"
			],
			"damageTypeSlugs": [
				"psihicheskiy"
			],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Кровь",
			"skillNames": [
				"Понимание Сущности"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "krov",
			"skillSlugs": [
				"ponimanie-suschnosti"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Яд",
			"skillNames": [
				"Понимание Сущности"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "yad",
			"skillSlugs": [
				"ponimanie-suschnosti"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Гром",
			"skillNames": [
				"Понимание Потока"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "grom",
			"skillSlugs": [
				"ponimanie-potoka"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Туман",
			"skillNames": [
				"Понимание Формы"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "tuman",
			"skillSlugs": [
				"ponimanie-formy"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Барьер",
			"skillNames": [
				"Понимание Формы"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "barer",
			"skillSlugs": [
				"ponimanie-formy"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		},
		{
			"magicWordName": "Разложение",
			"skillNames": [
				"Понимание Сущности"
			],
			"damageTypeNames": [],
			"conditionNames": [],
			"magicWordSlug": "razlozhenie",
			"skillSlugs": [
				"ponimanie-suschnosti"
			],
			"damageTypeSlugs": [],
			"conditionSlugs": []
		}
	],
	"schemaVersion": 1
} satisfies ContentDocument<{ words: MagicWordContent[]; modifierGestureRestrictions: MagicModifierGestureRestrictionContent[]; essenceProfiles: MagicWordEssenceProfileContent[]; links: MagicWordLinkContent[] }>;
