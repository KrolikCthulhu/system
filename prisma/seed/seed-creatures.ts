import { Prisma } from '../__generated__/index.js';
import type {
	ContentDocument,
	CreatureContent
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const CREATURE_SEEDS = readContent<
	ContentDocument<{ creatures: CreatureContent[] }>
>('dictionaries/creatures.ts').creatures;

export async function seedCreatures(tx: Prisma.TransactionClient) {
	for (const seed of CREATURE_SEEDS) {
		const slug = seedSlug(seed);
		const type = await tx.creatureType.findFirstOrThrow({
			select: { id: true },
			where: {
				OR: [{ slug: seed.type.slug }, { name: seed.type.name }]
			}
		});
		const existing = await tx.creature.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});
		const creature = existing
			? await tx.creature.update({
					select: { id: true },
					where: { id: existing.id },
					data: {
						slug,
						name: seed.name,
						typeId: type.id,
						isActive: true,
						sortOrder: seed.sortOrder
					}
				})
			: await tx.creature.create({
					select: { id: true },
					data: {
						slug,
						name: seed.name,
						typeId: type.id,
						isActive: true,
						sortOrder: seed.sortOrder
					}
				});

		const seedTiers = seed.tiers.map(tier => tier.tier);
		await tx.creatureTier.deleteMany({
			where: {
				creatureId: creature.id,
				tier: { notIn: seedTiers }
			}
		});

		for (const tierSeed of seed.tiers) {
			const armorPreset = await tx.armorPreset.findFirstOrThrow({
				select: { id: true },
				where: {
					OR: [
						{ slug: tierSeed.armorPreset.slug },
						{ name: tierSeed.armorPreset.name }
					]
				}
			});
			const tier = await tx.creatureTier.upsert({
				select: { id: true },
				where: {
					creatureId_tier: {
						creatureId: creature.id,
						tier: tierSeed.tier
					}
				},
				create: {
					creatureId: creature.id,
					tier: tierSeed.tier,
					name: tierSeed.name,
					hp: tierSeed.hp,
					armorPresetId: armorPreset.id,
					isActive: tierSeed.isActive ?? true,
					sortOrder: tierSeed.sortOrder ?? tierSeed.tier
				},
				update: {
					name: tierSeed.name,
					hp: tierSeed.hp,
					armorPresetId: armorPreset.id,
					isActive: tierSeed.isActive ?? true,
					sortOrder: tierSeed.sortOrder ?? tierSeed.tier
				}
			});
			const characteristicIds: string[] = [];
			const characteristicSeeds = tierSeed.characteristics ?? [];
			const defaultCharacteristics = await tx.characteristic.findMany({
				select: { id: true, name: true, defaultValue: true },
				where: { isActive: true }
			});

			for (const characteristic of defaultCharacteristics) {
				const characteristicSeed = characteristicSeeds.find(
					item => item.name === characteristic.name
				);
				characteristicIds.push(characteristic.id);
				await tx.creatureTierCharacteristic.upsert({
					where: {
						creatureTierId_characteristicId: {
							creatureTierId: tier.id,
							characteristicId: characteristic.id
						}
					},
					create: {
						creatureTierId: tier.id,
						characteristicId: characteristic.id,
						value:
							characteristicSeed?.value ??
							defaultCreatureCharacteristicValue(characteristic.defaultValue)
					},
					update: {
						value:
							characteristicSeed?.value ??
							defaultCreatureCharacteristicValue(characteristic.defaultValue)
					}
				});
			}

			await tx.creatureTierCharacteristic.deleteMany({
				where: {
					creatureTierId: tier.id,
					characteristicId: { notIn: characteristicIds }
				}
			});

			const skillIds: string[] = [];

			for (const skillSeed of tierSeed.skills) {
				const skill = await tx.skill.findFirstOrThrow({
					select: { id: true },
					where: {
						OR: [{ slug: skillSeed.slug }, { name: skillSeed.name }]
					}
				});
				skillIds.push(skill.id);
				await tx.creatureTierSkill.upsert({
					where: {
						creatureTierId_skillId: {
							creatureTierId: tier.id,
							skillId: skill.id
						}
					},
					create: {
						creatureTierId: tier.id,
						skillId: skill.id,
						level: skillSeed.level
					},
					update: {
						level: skillSeed.level
					}
				});
			}

			await tx.creatureTierSkill.deleteMany({
				where: {
					creatureTierId: tier.id,
					skillId: { notIn: skillIds }
				}
			});
		}
	}
}

function defaultCreatureCharacteristicValue(defaultValue: number): number {
	return Math.max(1, defaultValue);
}
