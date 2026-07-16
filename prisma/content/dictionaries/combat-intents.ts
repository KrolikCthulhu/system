import type { CombatIntentContent, ContentDocument } from '../content-types';

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
	isActive = true
): CombatIntentContent {
	return {
		name,
		slug,
		category,
		sortOrder,
		isActive
	};
}

export default {
	schemaVersion: 1,
	combatIntents: [
		intent('Ранить', 'ranit', CATEGORIES.damage, 0),
		intent('Вызвать кровотечение', 'vyzvat-krovotechenie', CATEGORIES.damage, 1),
		intent('Повредить руку', 'povredit-ruku', CATEGORIES.damage, 2),
		intent('Повредить ногу', 'povredit-nogu', CATEGORIES.damage, 3),
		intent('Повредить глаз', 'povredit-glaz', CATEGORIES.damage, 4),
		intent('Повредить крыло', 'povredit-krylo', CATEGORIES.damage, 5),
		intent('Повредить хвост', 'povredit-hvost', CATEGORIES.damage, 6),

		intent('Оглушить', 'oglushit', CATEGORIES.conditions, 100),
		intent('Ослепить', 'oslepit', CATEGORIES.conditions, 101),

		intent('Оттолкнуть', 'ottolknut', CATEGORIES.movement, 200),
		intent('Притянуть', 'prityanut', CATEGORIES.movement, 201),
		intent('Сбить с ног', 'sbit-s-nog', CATEGORIES.movement, 202),
		intent('Бросить', 'brosit', CATEGORIES.movement, 203),
		intent('Развернуть', 'razvernut', CATEGORIES.movement, 204),
		intent('Поменяться местами', 'pomenyatsya-mestami', CATEGORIES.movement, 205),

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
