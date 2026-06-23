import { randomUUID } from 'crypto';
import { Prisma, SystemValueOwnerType } from '../__generated__/index.js';
import { createCharacterInputGraph } from '../../backend/src/app/shared/system-value-graph.factory';
import { createPotentialGraph, createSumGraph } from './graphs';
import {
	ensureSystemValue,
	findRequiredByName,
	findRequiredMapValue
} from './helpers';
import { readContent } from './content';
import { SeedAttribute, SeedSystemValue } from './types';
import type { ContentDocument, SystemValueContent } from '../content/content-types';

const SYSTEM_VALUE_CONTENT = readContent<
	ContentDocument<{ values: SystemValueContent[] }>
>('system/values.ts').values;

export async function seedSourceValue(tx: Prisma.TransactionClient) {
	return seedManualSystemValue(tx, 'istochnik');
}

export async function seedPotentialValue(
	tx: Prisma.TransactionClient,
	params: {
		attributes: SeedAttribute[];
		consequenceValues: Map<string, SeedSystemValue>;
	}
) {
	const body = findRequiredByName(params.attributes, 'Тело', 'атрибут');
	const mind = findRequiredByName(params.attributes, 'Разум', 'атрибут');
	const fatigueLevel = findRequiredMapValue(
		params.consequenceValues,
		'Уровень усталости'
	);
	const existing = await tx.systemValue.findFirst({
		where: {
			name: 'Потенциал',
			primaryOwnerType: SystemValueOwnerType.MANUAL,
			primaryOwnerId: null
		}
	});

	return ensureSystemValue(tx, {
		id: existing?.id ?? randomUUID(),
		name: 'Потенциал',
		description:
			'Ресурс персонажа: очки действий в ходу, считается от базовых Тела и Разума с учетом уровня усталости.',
		primaryOwnerType: SystemValueOwnerType.MANUAL,
		primaryOwnerId: null,
		displaySection: 'Ресурсы персонажа',
		calculationGraph: createPotentialGraph({
			bodyValueId: body.systemValueId,
			mindValueId: mind.systemValueId,
			fatigueLevelValueId: fatigueLevel.id
		}),
		isSystemManaged: false,
		isActive: true,
		sortOrder: 1
	});
}

export async function seedHealthValue(tx: Prisma.TransactionClient) {
	return seedManualSystemValue(tx, 'zdorovye');
}

export async function seedSpellcasterLevelValue(tx: Prisma.TransactionClient) {
	const understandingSkills = await tx.skill.findMany({
		where: {
			name: {
				in: [
					'Понимание Сущности',
					'Понимание Сознания',
					'Понимание Формы',
					'Понимание Потока',
					'Понимание Порядка'
				]
			}
		}
	});
	const understandingSkillNames = [
		'Понимание Сущности',
		'Понимание Сознания',
		'Понимание Формы',
		'Понимание Потока',
		'Понимание Порядка'
	];
	const understandingValueIds = understandingSkillNames.map(name => {
		const skill = findRequiredByName(
			understandingSkills,
			name,
			'магический навык'
		);

		return skill.systemValueId;
	});
	const existing = await tx.systemValue.findFirst({
		where: {
			name: 'Уровень Заклинателя',
			primaryOwnerType: SystemValueOwnerType.MANUAL,
			primaryOwnerId: null
		}
	});

	return ensureSystemValue(tx, {
		id: existing?.id ?? randomUUID(),
		name: 'Уровень Заклинателя',
		description:
			'Магическое значение: сумма всех Пониманий персонажа.',
		primaryOwnerType: SystemValueOwnerType.MANUAL,
		primaryOwnerId: null,
		displaySection: 'Магия',
		calculationGraph: createSumGraph(understandingValueIds),
		isSystemManaged: false,
		isActive: true,
		sortOrder: 0
	});
}

async function seedManualSystemValue(
	tx: Prisma.TransactionClient,
	slug: string
) {
	const seed = findSystemValueContent(slug);
	const existing = await findExistingManualSystemValue(tx, seed);

	return ensureSystemValue(tx, {
		id: existing?.id ?? randomUUID(),
		slug: seed.slug,
		name: seed.name,
		description: seed.description ?? null,
		primaryOwnerType: SystemValueOwnerType[seed.primaryOwnerType],
		primaryOwnerId: null,
		displaySection: seed.displaySection,
		calculationGraph: createSystemValueGraph(seed),
		isSystemManaged: seed.isSystemManaged,
		isActive: seed.isActive,
		sortOrder: seed.sortOrder
	});
}

async function findExistingManualSystemValue(
	tx: Prisma.TransactionClient,
	seed: SystemValueContent
) {
	return tx.systemValue.findFirst({
		where: {
			primaryOwnerType: SystemValueOwnerType.MANUAL,
			primaryOwnerId: null,
			OR: [
				{ slug: seed.slug },
				{ name: seed.name }
			]
		}
	});
}

function findSystemValueContent(slug: string) {
	const seed = SYSTEM_VALUE_CONTENT.find(value => value.slug === slug);

	if (!seed) {
		throw new Error(`System value content not found: ${slug}`);
	}

	return seed;
}

function createSystemValueGraph(seed: SystemValueContent) {
	switch (seed.calculation) {
		case 'characterInput':
			return createCharacterInputGraph();
	}
}
