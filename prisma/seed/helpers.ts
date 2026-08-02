import { randomUUID } from 'crypto';
import { Prisma, SystemValueOwnerType } from '../__generated__/index.js';
import { createAvailablePoolGraph } from '../../backend/src/app/shared/system-value-graph.factory';
import { createSlug } from './slug';
import { SeedAttribute } from './types';

export async function ensureSystemValue(
	tx: Prisma.TransactionClient,
	params: {
		id: string;
		slug?: string;
		name: string;
		description: string | null;
		primaryOwnerType: SystemValueOwnerType;
		primaryOwnerId: string | null;
		coreKey?: string | null;
		displaySection?: string | null;
		calculationGraph: object;
		isSystemManaged: boolean;
		isActive: boolean;
		sortOrder: number;
		link?: {
			targetType: SystemValueOwnerType;
			targetId: string;
			label: string | null;
			sortOrder: number;
		};
	}
) {
	const existing = await tx.systemValue.findUnique({
		where: { id: params.id }
	});
	const data = {
		slug: params.slug ?? createSlug(params.name),
		name: params.name,
		description: params.description,
		primaryOwnerType: params.primaryOwnerType,
		primaryOwnerId: params.primaryOwnerId,
		coreKey: params.coreKey ?? null,
		displaySection: params.displaySection ?? null,
		calculationGraph: params.calculationGraph as Prisma.InputJsonValue,
		isSystemManaged: params.isSystemManaged,
		isActive: params.isActive,
		sortOrder: params.sortOrder
	};
	const value = existing
		? await tx.systemValue.update({
				where: { id: params.id },
				data
			})
		: await tx.systemValue.create({
				data: {
					id: params.id,
					...data
				}
			});

	if (params.link) {
		await tx.systemValueLink.upsert({
			where: {
				systemValueId_targetType_targetId: {
					systemValueId: value.id,
					targetType: params.link.targetType,
					targetId: params.link.targetId
				}
			},
			create: {
				id: randomUUID(),
				systemValueId: value.id,
				targetType: params.link.targetType,
				targetId: params.link.targetId,
				label: params.link.label,
				sortOrder: params.link.sortOrder
			},
			update: {
				label: params.link.label,
				sortOrder: params.link.sortOrder
			}
		});
	}

	return value;
}

export async function ensureAvailablePoolValue(
	tx: Prisma.TransactionClient,
	params: {
		attribute: SeedAttribute;
		penaltyValueId: string | null;
	}
) {
	const existingValueId =
		params.attribute.availablePoolValueId ??
		(
			await tx.systemValue.findFirst({
				select: { id: true },
				where: {
					name: `Доступный пул ${params.attribute.name}`,
					primaryOwnerType: SystemValueOwnerType.ATTRIBUTE,
					primaryOwnerId: params.attribute.id,
					isSystemManaged: true
				}
			})
		)?.id ??
		randomUUID();
	const value = await ensureSystemValue(tx, {
		id: existingValueId,
		name: `Доступный пул ${params.attribute.name}`,
		description:
			'Системное значение: ограничивает кубы характеристик этим атрибутом с учётом штрафа пула.',
		primaryOwnerType: SystemValueOwnerType.ATTRIBUTE,
		primaryOwnerId: params.attribute.id,
		calculationGraph: createAvailablePoolGraph(
			params.attribute.systemValueId,
			params.penaltyValueId
		),
		isSystemManaged: true,
		isActive: params.attribute.isActive,
		sortOrder: params.attribute.sortOrder,
		link: {
			targetType: SystemValueOwnerType.ATTRIBUTE,
			targetId: params.attribute.id,
			label: 'Доступный пул кубов',
			sortOrder: params.attribute.sortOrder
		}
	});

	await tx.attribute.update({
		where: { id: params.attribute.id },
		data: { availablePoolValueId: value.id }
	});

	return value;
}

export async function findAttributeByName(
	tx: Prisma.TransactionClient,
	name: string
) {
	const values = await tx.attribute.findMany();
	return findByName(values, name);
}

export async function findCharacteristicByName(
	tx: Prisma.TransactionClient,
	name: string
) {
	const values = await tx.characteristic.findMany();
	return findByName(values, name);
}

export async function findRollConsequenceByName(
	tx: Prisma.TransactionClient,
	name: string
) {
	const values = await tx.rollConsequence.findMany();
	return findByName(values, name);
}

export async function findSkillCategoryByName(
	tx: Prisma.TransactionClient,
	name: string
) {
	const values = await tx.skillCategory.findMany();
	return findByName(values, name);
}

export async function findSkillByName(
	tx: Prisma.TransactionClient,
	name: string
) {
	const values = await tx.skill.findMany();
	return findByName(values, name);
}

export function findByName<T extends { name: string }>(
	items: T[],
	name: string
) {
	const normalized = normalizeName(name);
	return items.find(item => normalizeName(item.name) === normalized) ?? null;
}

export function findRequiredByName<T extends { name: string }>(
	items: T[],
	name: string,
	entityLabel: string
) {
	const item = findByName(items, name);

	if (!item) {
		throw new Error(`Не найдена сущность "${name}" (${entityLabel}).`);
	}

	return item;
}

export function findRequiredMapValue<T>(items: Map<string, T>, key: string) {
	const item = items.get(key);

	if (!item) {
		throw new Error(`Не найдено значение "${key}".`);
	}

	return item;
}

export function normalizeName(name: string) {
	return name.trim().toLocaleLowerCase('ru');
}

export function nullable(value: string | null | undefined) {
	const normalized = value?.trim() ?? '';
	return normalized ? normalized : null;
}
