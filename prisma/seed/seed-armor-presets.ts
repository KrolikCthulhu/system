import { Prisma } from '../__generated__/index.js';
import type {
	ArmorPresetContent,
	ContentDocument
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const ARMOR_PRESET_SEEDS = readContent<
	ContentDocument<{ armorPresets: ArmorPresetContent[] }>
>('dictionaries/armor-presets.ts').armorPresets;

export async function seedArmorPresets(tx: Prisma.TransactionClient) {
	for (const seed of ARMOR_PRESET_SEEDS) {
		const slug = seedSlug(seed);
		const existing = await tx.armorPreset.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});

		if (existing) {
			await tx.armorPreset.update({
				where: { id: existing.id },
				data: {
					slug,
					points: seed.points,
					protection: seed.protection,
					sortOrder: seed.sortOrder,
					isActive: true
				}
			});
			continue;
		}

		await tx.armorPreset.create({
			data: {
				slug,
				name: seed.name,
				points: seed.points,
				protection: seed.protection,
				isActive: true,
				sortOrder: seed.sortOrder
			}
		});
	}
}
