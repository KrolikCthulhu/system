import { randomUUID } from 'crypto';
import { Prisma, SystemValueOwnerType } from '../__generated__/index.js';
import { createCharacterInputGraph } from '../../backend/src/app/shared/system-value-graph.factory';
import { createPotentialGraph } from './graphs';
import {
	ensureSystemValue,
	findRequiredByName,
	findRequiredMapValue
} from './helpers';
import { SeedAttribute, SeedSystemValue } from './types';

export async function seedSourceValue(tx: Prisma.TransactionClient) {
	const existing = await tx.systemValue.findFirst({
		where: {
			name: 'Источник',
			primaryOwnerType: SystemValueOwnerType.MANUAL,
			primaryOwnerId: null
		}
	});

	return ensureSystemValue(tx, {
		id: existing?.id ?? randomUUID(),
		name: 'Источник',
		description:
			'Ресурс персонажа: начисляется за выпавшие шестерки при броске.',
		primaryOwnerType: SystemValueOwnerType.MANUAL,
		primaryOwnerId: null,
		displaySection: 'Ресурсы персонажа',
		calculationGraph: createCharacterInputGraph(),
		isSystemManaged: false,
		isActive: true,
		sortOrder: 0
	});
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
	const existing = await tx.systemValue.findFirst({
		where: {
			name: 'Здоровье',
			primaryOwnerType: SystemValueOwnerType.MANUAL,
			primaryOwnerId: null
		}
	});

	return ensureSystemValue(tx, {
		id: existing?.id ?? randomUUID(),
		name: 'Здоровье',
		description: 'Ресурс персонажа: запас состояния, который изменяется уроном и восстановлением.',
		primaryOwnerType: SystemValueOwnerType.MANUAL,
		primaryOwnerId: null,
		displaySection: 'Ресурсы персонажа',
		calculationGraph: createCharacterInputGraph(),
		isSystemManaged: false,
		isActive: true,
		sortOrder: 2
	});
}
