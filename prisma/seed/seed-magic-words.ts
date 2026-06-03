import {
	MagicWordType,
	Prisma
} from '../__generated__/index.js';
import {
	MAGIC_MODIFIER_GESTURE_RESTRICTION_SEEDS,
	MAGIC_WORD_SEEDS
} from './data';

export async function seedMagicWords(tx: Prisma.TransactionClient) {
	for (const seed of MAGIC_WORD_SEEDS) {
		const type = magicWordType(seed.type);
		const existing = await tx.magicWord.findUnique({
			select: { id: true },
			where: {
				type_name: {
					type,
					name: seed.name
				}
			}
		});

		if (existing) {
			await tx.magicWord.update({
				where: { id: existing.id },
				data: {
					sortOrder: seed.sortOrder,
					isActive: true
				}
			});
			continue;
		}

		await tx.magicWord.create({
			data: {
				type,
				name: seed.name,
				isActive: true,
				sortOrder: seed.sortOrder
			}
		});
	}

	await seedModifierGestureRestrictions(tx);
}

async function seedModifierGestureRestrictions(tx: Prisma.TransactionClient) {
	for (const seed of MAGIC_MODIFIER_GESTURE_RESTRICTION_SEEDS) {
		const modifier = await tx.magicWord.findUnique({
			select: { id: true },
			where: {
				type_name: {
					type: MagicWordType.MODIFIER,
					name: seed.modifierName
				}
			}
		});

		if (!modifier) {
			throw new Error(`Magic modifier seed not found: ${seed.modifierName}`);
		}

		await tx.magicWordGestureRestriction.deleteMany({
			where: { modifierId: modifier.id }
		});

		for (const gestureName of seed.gestureNames) {
			const gesture = await tx.magicWord.findUnique({
				select: { id: true },
				where: {
					type_name: {
						type: MagicWordType.GESTURE,
						name: gestureName
					}
				}
			});

			if (!gesture) {
				throw new Error(`Magic gesture seed not found: ${gestureName}`);
			}

			await tx.magicWordGestureRestriction.create({
				data: {
					modifierId: modifier.id,
					gestureId: gesture.id
				}
			});
		}
	}
}

function magicWordType(type: (typeof MAGIC_WORD_SEEDS)[number]['type']) {
	switch (type) {
		case 'ACTION':
			return MagicWordType.ACTION;
		case 'ESSENCE':
			return MagicWordType.ESSENCE;
		case 'GESTURE':
			return MagicWordType.GESTURE;
		case 'MODIFIER':
			return MagicWordType.MODIFIER;
	}
}
