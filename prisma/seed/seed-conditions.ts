import { Prisma } from '../__generated__/index.js';
import type { ConditionContent, ContentDocument } from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const CONDITION_SEEDS = readContent<
	ContentDocument<{ conditions: ConditionContent[] }>
>(
	'dictionaries/conditions.ts'
).conditions;

export async function seedConditions(tx: Prisma.TransactionClient) {
	for (const seed of CONDITION_SEEDS) {
		const slug = seedSlug(seed);
		const existing = await tx.condition.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});

		if (existing) {
			await tx.condition.update({
				where: { id: existing.id },
				data: {
					slug,
					sortOrder: seed.sortOrder,
					isActive: true
				}
			});
			continue;
		}

		await tx.condition.create({
			data: {
				slug,
				name: seed.name,
				isActive: true,
				sortOrder: seed.sortOrder
			}
		});
	}
}
