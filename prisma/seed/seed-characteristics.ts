import { randomUUID } from 'crypto';
import { Prisma, SystemValueOwnerType } from '../__generated__/index.js';
import { createCharacterInputGraph } from '../../backend/src/app/shared/system-value-graph.factory';
import { CHARACTERISTIC_SEEDS } from './data';
import {
	ensureSystemValue,
	findCharacteristicByName,
	findRequiredByName,
	nullable
} from './helpers';
import { SeedAttribute, SeedCharacteristic } from './types';

export async function seedCharacteristics(
	tx: Prisma.TransactionClient,
	attributes: SeedAttribute[]
) {
	const characteristics: SeedCharacteristic[] = [];

	for (const seed of CHARACTERISTIC_SEEDS) {
		const attribute = findRequiredByName(attributes, seed.attributeName, 'атрибут');
		const existing = await findCharacteristicByName(tx, seed.name);
		const id = existing?.id ?? randomUUID();
		const systemValueId = existing?.systemValueId ?? id;

		await ensureSystemValue(tx, {
			id: systemValueId,
			name: seed.name,
			description: nullable(seed.description),
			primaryOwnerType: SystemValueOwnerType.CHARACTERISTIC,
			primaryOwnerId: id,
			calculationGraph: createCharacterInputGraph(),
			isSystemManaged: false,
			isActive: true,
			sortOrder: seed.sortOrder,
			link: {
				targetType: SystemValueOwnerType.CHARACTERISTIC,
				targetId: id,
				label: null,
				sortOrder: seed.sortOrder
			}
		});

		const characteristic = existing
			? await tx.characteristic.update({
					where: { id },
					data: {
						name: seed.name,
						attributeId: attribute.id,
						description: nullable(seed.description),
						minValue: seed.minValue,
						maxValue: seed.maxValue,
						defaultValue: seed.defaultValue,
						isActive: true,
						sortOrder: seed.sortOrder,
						systemValueId
					}
			  })
			: await tx.characteristic.create({
					data: {
						id,
						name: seed.name,
						attributeId: attribute.id,
						description: nullable(seed.description),
						minValue: seed.minValue,
						maxValue: seed.maxValue,
						defaultValue: seed.defaultValue,
						isActive: true,
						sortOrder: seed.sortOrder,
						systemValueId
					}
			  });

		characteristics.push(characteristic);
	}

	return characteristics;
}
