import { Prisma } from '../__generated__/index.js';
import type {
	ContentDocument,
	CreatureSizeContent
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const CREATURE_SIZE_SEEDS = readContent<
	ContentDocument<{ creatureSizes: CreatureSizeContent[] }>
>('dictionaries/creature-sizes.ts').creatureSizes;

export async function seedCreatureSizes(tx: Prisma.TransactionClient) {
	for (const seed of CREATURE_SIZE_SEEDS) {
		const slug = seedSlug(seed);
		const existing = await tx.creatureSize.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }, { rank: seed.rank }]
			}
		});

		if (existing) {
			await tx.creatureSize.update({
				where: { id: existing.id },
				data: {
					slug,
					name: seed.name,
					description: seed.description ?? null,
					rank: seed.rank,
					isActive: seed.isActive ?? true,
					sortOrder: seed.sortOrder
				}
			});
			continue;
		}

		await tx.creatureSize.create({
			data: {
				slug,
				name: seed.name,
				description: seed.description ?? null,
				rank: seed.rank,
				isActive: seed.isActive ?? true,
				sortOrder: seed.sortOrder
			}
		});
	}
}
