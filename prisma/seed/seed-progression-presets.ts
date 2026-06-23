import { Prisma, ProgressionPresetKind } from '../__generated__/index.js';
import type { ContentDocument, ProgressionContent } from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const PROGRESSION_PRESET_SEEDS = readContent<
	ContentDocument<{ progressions: ProgressionContent[] }>
>(
	'dictionaries/progressions.ts'
).progressions;

export async function seedProgressionPresets(tx: Prisma.TransactionClient) {
	for (const seed of PROGRESSION_PRESET_SEEDS) {
		const slug = seedSlug(seed);
		const existing = await tx.progressionPreset.findFirst({
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});

		const data = {
			slug,
			name: seed.name,
			description: seed.description,
			kind: toProgressionPresetKind(seed.kind),
			config: seed.config,
			isActive: true,
			sortOrder: seed.sortOrder
		};

		if (existing) {
			await tx.progressionPreset.update({
				where: { id: existing.id },
				data
			});
			continue;
		}

		await tx.progressionPreset.create({
			data: {
				...data
			}
		});
	}
}

function toProgressionPresetKind(kind: string): ProgressionPresetKind {
	switch (kind) {
		case 'LINEAR':
			return ProgressionPresetKind.LINEAR;
		case 'STEP':
			return ProgressionPresetKind.STEP;
		case 'QUADRATIC':
			return ProgressionPresetKind.QUADRATIC;
		case 'SQUARE_ROOT':
			return ProgressionPresetKind.SQUARE_ROOT;
		case 'LOGARITHMIC':
			return ProgressionPresetKind.LOGARITHMIC;
		case 'SATURATION':
			return ProgressionPresetKind.SATURATION;
		case 'PERCENT':
			return ProgressionPresetKind.PERCENT;
		default:
			throw new Error(`Unsupported progression preset kind: ${kind}`);
	}
}
