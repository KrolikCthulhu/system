import type {
	CombatIntentContent,
	CombatIntentTextBlockContent,
	ContentDocument
} from '../content-types';

const CATEGORIES = {
	damage: 'Урон и травмы',
	conditions: 'Состояния',
	movement: 'Перемещение',
	restraint: 'Удержание',
	equipment: 'Снаряжение и предметы',
	suppression: 'Подавление'
};

function intent(
	name: string,
	slug: string,
	category: string,
	sortOrder: number,
	isActive = true,
	textBlocks?: CombatIntentTextBlockContent[]
): CombatIntentContent {
	return {
		name,
		slug,
		category,
		sortOrder,
		isActive,
		textBlocks
	};
}

const woundTextBlocks: CombatIntentTextBlockContent[] = [
	{
		kind: 'text',
		text: 'Вы совершаете ',
		sortOrder: 0
	},
	{
		kind: 'token',
		token: 'damageTypes',
		sortOrder: 1
	},
	{
		kind: 'text',
		text: ' атаку выбранным оружием по цели в пределах ',
		sortOrder: 2
	},
	{
		kind: 'token',
		token: 'rangeMeters',
		sortOrder: 3
	},
	{
		kind: 'text',
		text: ' м.\n\nЦель может защититься: ',
		sortOrder: 4
	},
	{
		kind: 'token',
		token: 'defenseOptions',
		sortOrder: 5
	},
	{
		kind: 'text',
		text: '.\n\nПри попадании цель получает ',
		sortOrder: 6
	},
	{
		kind: 'token',
		token: 'selectedDamageType',
		sortOrder: 7
	},
	{
		kind: 'text',
		text: ' урон, равный ',
		sortOrder: 8
	},
	{
		kind: 'token',
		token: 'damageFormula',
		sortOrder: 9
	},
	{
		kind: 'text',
		text: '. Если после защиты не осталось ни одного чистого успеха, атака не наносит урона, и базовый урон оружия не применяется.\n\nПри попадании зона ранения определяется случайно: ',
		sortOrder: 10
	},
	{
		kind: 'token',
		token: 'randomHitZones',
		sortOrder: 11
	},
	{
		kind: 'text',
		text: '. После расчёта итогового урона применяется броня выпавшей зоны. Оставшийся урон снимает здоровье и может вызвать травму.',
		sortOrder: 12
	}
];

export default {
	schemaVersion: 1,
	combatIntents: [
		intent('Ранить', 'ranit', CATEGORIES.damage, 0, true, woundTextBlocks),
		intent('Прицельно ранить', 'pricelno-ranit', CATEGORIES.damage, 1),
		intent(
			'Поразить уязвимое место',
			'porazit-uyazvimoe-mesto',
			CATEGORIES.damage,
			2
		),
		intent(
			'Вызвать кровотечение',
			'vyzvat-krovotechenie',
			CATEGORIES.damage,
			3
		),

		intent('Оглушить', 'oglushit', CATEGORIES.conditions, 100),
		intent('Ослепить', 'oslepit', CATEGORIES.conditions, 101),

		intent('Оттолкнуть', 'ottolknut', CATEGORIES.movement, 200),
		intent('Притянуть', 'prityanut', CATEGORIES.movement, 201),
		intent('Сбить с ног', 'sbit-s-nog', CATEGORIES.movement, 202),
		intent('Бросить', 'brosit', CATEGORIES.movement, 203),
		intent('Развернуть', 'razvernut', CATEGORIES.movement, 204),
		intent(
			'Поменяться местами',
			'pomenyatsya-mestami',
			CATEGORIES.movement,
			205
		),

		intent('Захватить', 'zahvatit', CATEGORIES.restraint, 300),
		intent('Обездвижить', 'obezdvizhit', CATEGORIES.restraint, 301),
		intent('Пригвоздить', 'prigvozdit', CATEGORIES.restraint, 302),
		intent('Опутать', 'oputat', CATEGORIES.restraint, 303),
		intent('Удушить', 'udushit', CATEGORIES.restraint, 304),

		intent('Обезоружить', 'obezoruzhit', CATEGORIES.equipment, 400),
		intent('Выбить щит', 'vybit-schit', CATEGORIES.equipment, 401),
		intent('Сорвать предмет', 'sorvat-predmet', CATEGORIES.equipment, 402),
		intent('Сбить прицел', 'sbit-pricel', CATEGORIES.equipment, 403),
		intent('Сломать оружие', 'slomat-oruzhie', CATEGORIES.equipment, 404),
		intent('Разбить щит', 'razbit-schit', CATEGORIES.equipment, 405),
		intent('Повредить броню', 'povredit-bronyu', CATEGORIES.equipment, 406),
		intent('Разрушить предмет', 'razrushit-predmet', CATEGORIES.equipment, 407),

		intent('Напугать', 'napugat', CATEGORIES.suppression, 500),
		intent('Вынудить сдаться', 'vynudit-sdatsya', CATEGORIES.suppression, 501)
	]
} satisfies ContentDocument<{ combatIntents: CombatIntentContent[] }>;
