import { randomUUID } from 'crypto';
import { Prisma, SystemValueOwnerType } from '../__generated__/index.js';
import { createCharacterInputGraph } from '../../backend/src/app/shared/system-value-graph.factory';
import { ATTRIBUTE_SEEDS } from './data';
import { createSumGraph } from './graphs';
import {
	ensureAvailablePoolValue,
	ensureSystemValue,
	findAttributeByName,
	findRequiredMapValue,
	nullable
} from './helpers';
import {
	SeedAttribute,
	SeedCharacteristic,
	SeedSystemValue
} from './types';

export async function seedAttributes(tx: Prisma.TransactionClient) {
	const attributes: SeedAttribute[] = [];

	for (const seed of ATTRIBUTE_SEEDS) {
		const existing = await findAttributeByName(tx, seed.name);
		const id = existing?.id ?? randomUUID();
		const systemValueId = existing?.systemValueId ?? id;

		await ensureSystemValue(tx, {
			id: systemValueId,
			name: seed.name,
			description: nullable(seed.description),
			primaryOwnerType: SystemValueOwnerType.ATTRIBUTE,
			primaryOwnerId: id,
			calculationGraph: createCharacterInputGraph(),
			isSystemManaged: false,
			isActive: true,
			sortOrder: seed.sortOrder,
			link: {
				targetType: SystemValueOwnerType.ATTRIBUTE,
				targetId: id,
				label: null,
				sortOrder: seed.sortOrder
			}
		});

		const attribute = existing
			? await tx.attribute.update({
					where: { id },
					data: {
						name: seed.name,
						description: nullable(seed.description),
						isActive: true,
						sortOrder: seed.sortOrder,
						systemValueId
					}
			  })
			: await tx.attribute.create({
					data: {
						id,
						name: seed.name,
						description: nullable(seed.description),
						isActive: true,
						sortOrder: seed.sortOrder,
						systemValueId
					}
			  });

		attributes.push(attribute);
	}

	return attributes;
}

export async function seedAttributeGraphs(
	tx: Prisma.TransactionClient,
	attributes: SeedAttribute[],
	characteristics: SeedCharacteristic[]
) {
	for (const attribute of attributes) {
		const sourceValueIds = characteristics
			.filter(characteristic => characteristic.attributeId === attribute.id)
			.sort((first, second) => first.sortOrder - second.sortOrder)
			.map(characteristic => characteristic.systemValueId);

		await tx.systemValue.update({
			where: { id: attribute.systemValueId },
			data: {
				calculationGraph: createSumGraph(sourceValueIds) as Prisma.InputJsonValue
			}
		});
	}
}

export async function seedAttributePoolRules(
	tx: Prisma.TransactionClient,
	params: {
		attributes: SeedAttribute[];
		consequenceValues: Map<string, SeedSystemValue>;
	}
) {
	const fatiguePoints = findRequiredMapValue(
		params.consequenceValues,
		'Очки усталости'
	);
	const stressPoints = findRequiredMapValue(
		params.consequenceValues,
		'Очки стресса'
	);

	for (const attribute of params.attributes) {
		const penaltyValue =
			attribute.name === 'Тело'
				? fatiguePoints
				: attribute.name === 'Разум'
					? stressPoints
					: null;

		if (!penaltyValue) {
			continue;
		}

		const updated = await tx.attribute.update({
			where: { id: attribute.id },
			data: { poolPenaltyValueId: penaltyValue.id }
		});

		await ensureAvailablePoolValue(tx, {
			attribute: updated,
			penaltyValueId: penaltyValue.id
		});
	}
}
