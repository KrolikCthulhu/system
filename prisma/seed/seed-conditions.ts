import { Prisma } from '../__generated__/index.js';
import { CONDITION_SEEDS } from './data';

export async function seedConditions(tx: Prisma.TransactionClient) {
	for (const seed of CONDITION_SEEDS) {
		const existing = await tx.condition.findUnique({
			select: { id: true },
			where: { name: seed.name }
		});

		if (existing) {
			await tx.condition.update({
				where: { id: existing.id },
				data: {
					sortOrder: seed.sortOrder,
					isActive: true
				}
			});
			continue;
		}

		await tx.condition.create({
			data: {
				name: seed.name,
				isActive: true,
				sortOrder: seed.sortOrder
			}
		});
	}
}
