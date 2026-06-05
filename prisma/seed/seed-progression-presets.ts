import { Prisma, ProgressionPresetKind } from '../__generated__/index.js';
import { PROGRESSION_PRESET_SEEDS } from './data';

export async function seedProgressionPresets(tx: Prisma.TransactionClient) {
	for (const seed of PROGRESSION_PRESET_SEEDS) {
		const existing = await tx.progressionPreset.findUnique({
			where: { name: seed.name }
		});

		const data = {
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
				name: seed.name,
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
