import { Prisma } from '../__generated__/index.js';
import type {
	CombatIntentContent,
	ContentDocument
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const COMBAT_INTENT_SEEDS = readContent<
	ContentDocument<{ combatIntents: CombatIntentContent[] }>
>('dictionaries/combat-intents.ts').combatIntents;

export async function seedCombatIntents(tx: Prisma.TransactionClient) {
	for (const seed of COMBAT_INTENT_SEEDS) {
		const slug = seedSlug(seed);
		const existing = await tx.combatIntent.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});

		if (existing) {
			await tx.combatIntent.update({
				where: { id: existing.id },
				data: {
					slug,
					category: seed.category,
					description: seed.description ?? null,
					mechanic: seed.mechanic ?? {},
					textBlocks: seed.textBlocks ?? [],
					sortOrder: seed.sortOrder,
					isActive: seed.isActive ?? true
				}
			});
			continue;
		}

		await tx.combatIntent.create({
			data: {
				slug,
				name: seed.name,
				category: seed.category,
				description: seed.description ?? null,
				mechanic: seed.mechanic ?? {},
				textBlocks: seed.textBlocks ?? [],
				isActive: seed.isActive ?? true,
				sortOrder: seed.sortOrder
			}
		});
	}
}
