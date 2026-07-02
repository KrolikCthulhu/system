import { Prisma } from '../__generated__/index.js';
import type {
	ContentDocument,
	CreatureTypeContent
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const CREATURE_TYPE_SEEDS = readContent<
	ContentDocument<{ creatureTypes: CreatureTypeContent[] }>
>('dictionaries/creature-types.ts').creatureTypes;

export async function seedCreatureTypes(tx: Prisma.TransactionClient) {
	for (const seed of CREATURE_TYPE_SEEDS) {
		const slug = seedSlug(seed);
		const existing = await tx.creatureType.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});

		if (existing) {
			await tx.creatureType.update({
				where: { id: existing.id },
				data: {
					slug,
					sortOrder: seed.sortOrder,
					isActive: true
				}
			});
			continue;
		}

		await tx.creatureType.create({
			data: {
				slug,
				name: seed.name,
				isActive: true,
				sortOrder: seed.sortOrder
			}
		});
	}
}
