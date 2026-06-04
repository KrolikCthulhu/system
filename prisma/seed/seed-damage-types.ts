import { Prisma } from '../__generated__/index.js';
import { DAMAGE_TYPE_SEEDS } from './data';

export async function seedDamageTypes(tx: Prisma.TransactionClient) {
	for (const seed of DAMAGE_TYPE_SEEDS) {
		const existing = await tx.damageType.findUnique({
			select: { id: true },
			where: { name: seed.name }
		});

		if (existing) {
			await tx.damageType.update({
				where: { id: existing.id },
				data: {
					sortOrder: seed.sortOrder,
					isActive: true
				}
			});
			continue;
		}

		await tx.damageType.create({
			data: {
				name: seed.name,
				isActive: true,
				sortOrder: seed.sortOrder
			}
		});
	}
}
