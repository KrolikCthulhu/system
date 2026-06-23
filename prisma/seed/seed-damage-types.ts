import { Prisma } from '../__generated__/index.js';
import type { ContentDocument, DamageTypeContent } from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const DAMAGE_TYPE_SEEDS = readContent<
	ContentDocument<{ damageTypes: DamageTypeContent[] }>
>(
	'dictionaries/damage-types.ts'
).damageTypes;

export async function seedDamageTypes(tx: Prisma.TransactionClient) {
	for (const seed of DAMAGE_TYPE_SEEDS) {
		const slug = seedSlug(seed);
		const existing = await tx.damageType.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});

		if (existing) {
			await tx.damageType.update({
				where: { id: existing.id },
				data: {
					slug,
					sortOrder: seed.sortOrder,
					isActive: true
				}
			});
			continue;
		}

		await tx.damageType.create({
			data: {
				slug,
				name: seed.name,
				isActive: true,
				sortOrder: seed.sortOrder
			}
		});
	}
}
