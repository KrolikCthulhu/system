import {
	MagicWordType,
	Prisma
} from '../__generated__/index.js';
import type {
	ContentDocument,
	MagicModifierGestureRestrictionContent,
	MagicWordContent,
	MagicWordEssenceProfileContent
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

type MagicWordsContent = ContentDocument<{
	words: MagicWordContent[];
	modifierGestureRestrictions: MagicModifierGestureRestrictionContent[];
	essenceProfiles: MagicWordEssenceProfileContent[];
}>;

const magicWordsContent = readContent<MagicWordsContent>('magic/words.ts');
const MAGIC_WORD_SEEDS = magicWordsContent.words;
const MAGIC_MODIFIER_GESTURE_RESTRICTION_SEEDS =
	magicWordsContent.modifierGestureRestrictions;
const MAGIC_WORD_ESSENCE_PROFILE_SEEDS = magicWordsContent.essenceProfiles;

export async function seedMagicWords(tx: Prisma.TransactionClient) {
	for (const seed of MAGIC_WORD_SEEDS) {
		const type = magicWordType(seed.type);
		const slug = seedSlug(seed);
		const existing = await tx.magicWord.findFirst({
			select: { id: true },
			where: {
				type,
				OR: [{ slug }, { name: seed.name }]
			}
		});

		if (existing) {
			await tx.magicWord.update({
				where: { id: existing.id },
				data: {
					slug,
					name: seed.name,
					sortOrder: seed.sortOrder,
					isActive: true
				}
			});
			continue;
		}

		await tx.magicWord.create({
			data: {
				type,
				slug,
				name: seed.name,
				isActive: true,
				sortOrder: seed.sortOrder
			}
		});
	}

	await seedModifierGestureRestrictions(tx);
	await seedEssenceProfiles(tx);
}

async function seedModifierGestureRestrictions(tx: Prisma.TransactionClient) {
	for (const seed of MAGIC_MODIFIER_GESTURE_RESTRICTION_SEEDS) {
		const modifier = await tx.magicWord.findUnique({
			select: { id: true },
			where: {
				type_slug: {
					type: MagicWordType.MODIFIER,
					slug: seed.modifierSlug ?? seedSlug({ name: seed.modifierName })
				}
			}
		});

		if (!modifier) {
			throw new Error(`Magic modifier seed not found: ${seed.modifierName}`);
		}

		await tx.magicWordGestureRestriction.deleteMany({
			where: { modifierId: modifier.id }
		});

		for (const [index, gestureName] of seed.gestureNames.entries()) {
			const gesture = await tx.magicWord.findUnique({
				select: { id: true },
				where: {
					type_slug: {
						type: MagicWordType.GESTURE,
						slug:
							seed.gestureSlugs?.[index] ?? seedSlug({ name: gestureName })
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

async function seedEssenceProfiles(tx: Prisma.TransactionClient) {
	for (const seed of MAGIC_WORD_ESSENCE_PROFILE_SEEDS) {
		const magicWord = await tx.magicWord.findUnique({
			select: { id: true },
			where: {
				type_slug: {
					type: MagicWordType.ESSENCE,
					slug: seedSlug(seed)
				}
			}
		});

		if (!magicWord) {
			throw new Error(`Magic essence seed not found: ${seed.name}`);
		}

		await tx.magicWordEssenceProfile.upsert({
			where: { magicWordId: magicWord.id },
			create: {
				magicWordId: magicWord.id,
				damageAffinity: seed.damageAffinity,
				rangeAffinity: seed.rangeAffinity,
				controlAffinity: seed.controlAffinity,
				durationAffinity: seed.durationAffinity,
				areaAffinity: seed.areaAffinity,
				stabilityAffinity: seed.stabilityAffinity
			},
			update: {
				damageAffinity: seed.damageAffinity,
				rangeAffinity: seed.rangeAffinity,
				controlAffinity: seed.controlAffinity,
				durationAffinity: seed.durationAffinity,
				areaAffinity: seed.areaAffinity,
				stabilityAffinity: seed.stabilityAffinity
			}
		});
	}
}

function magicWordType(type: keyof typeof MagicWordType) {
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
