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
		const anatomyScheme = seed.anatomyScheme
			? await tx.anatomyScheme.findFirstOrThrow({
					select: { id: true },
					where: {
						OR: [
							{ slug: seed.anatomyScheme.slug },
							{ name: seed.anatomyScheme.name }
						]
					}
				})
			: null;
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
						anatomySchemeId: anatomyScheme?.id ?? null,
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
						anatomySchemeId: anatomyScheme?.id ?? null,
						isActive: true,
						sortOrder: seed.sortOrder
					}
				});

		await syncCreatureAnatomyFromScheme(
			tx,
			creature.id,
			anatomyScheme?.id ?? null
		);

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

async function syncCreatureAnatomyFromScheme(
	tx: Prisma.TransactionClient,
	creatureId: string,
	schemeId: string | null
) {
	if (!schemeId) {
		await tx.creatureAnatomyZone.deleteMany({
			where: {
				creatureId,
				isInherited: true,
				overriddenFields: { isEmpty: true }
			}
		});
		return;
	}

	const schemeZones = await tx.anatomySchemeZone.findMany({
		where: { schemeId },
		orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
	});
	const sourceZoneIds = new Set(schemeZones.map(zone => zone.id));

	await tx.creatureAnatomyZone.deleteMany({
		where: {
			creatureId,
			isInherited: true,
			overriddenFields: { isEmpty: true },
			sourceZoneId: { notIn: [...sourceZoneIds] }
		}
	});

	const existingZones = await tx.creatureAnatomyZone.findMany({
		where: { creatureId },
		orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
	});
	const existingBySourceId = new Map(
		existingZones
			.filter(zone => zone.sourceZoneId)
			.map(zone => [zone.sourceZoneId as string, zone])
	);
	const existingBySlug = new Map(existingZones.map(zone => [zone.slug, zone]));
	const syncedZoneIdsBySourceId = new Map<string, string>();
	const orderedSchemeZones = [
		...schemeZones.filter(zone => !zone.parentId),
		...schemeZones.filter(zone => zone.parentId)
	];

	for (const schemeZone of orderedSchemeZones) {
		const existingZone =
			existingBySourceId.get(schemeZone.id) ??
			existingBySlug.get(schemeZone.slug);
		const parentId = schemeZone.parentId
			? (syncedZoneIdsBySourceId.get(schemeZone.parentId) ?? null)
			: null;

		if (existingZone) {
			const overriddenFields = new Set(existingZone.overriddenFields);
			const updated = await tx.creatureAnatomyZone.update({
				select: { id: true },
				where: { id: existingZone.id },
				data: {
					sourceZoneId: schemeZone.id,
					name: overriddenFields.has('name') ? undefined : schemeZone.name,
					parentId: overriddenFields.has('parentId') ? undefined : parentId,
					kind: overriddenFields.has('kind') ? undefined : schemeZone.kind,
					isRandomHitEligible: overriddenFields.has('isRandomHitEligible')
						? undefined
						: schemeZone.isRandomHitEligible,
					randomHitWeight: overriddenFields.has('randomHitWeight')
						? undefined
						: schemeZone.randomHitWeight,
					targetedAttackDicePenalty: overriddenFields.has(
						'targetedAttackDicePenalty'
					)
						? undefined
						: schemeZone.targetedAttackDicePenalty,
					extraPotentialCost: overriddenFields.has('extraPotentialCost')
						? undefined
						: schemeZone.extraPotentialCost,
					isActive: overriddenFields.has('isActive')
						? undefined
						: schemeZone.isActive,
					sortOrder: overriddenFields.has('sortOrder')
						? undefined
						: schemeZone.sortOrder,
					isInherited: true,
					isRemoved: false
				}
			});
			syncedZoneIdsBySourceId.set(schemeZone.id, updated.id);
			continue;
		}

		const created = await tx.creatureAnatomyZone.create({
			select: { id: true },
			data: {
				creatureId,
				sourceZoneId: schemeZone.id,
				parentId,
				slug: schemeZone.slug,
				name: schemeZone.name,
				kind: schemeZone.kind,
				isRandomHitEligible: schemeZone.isRandomHitEligible,
				randomHitWeight: schemeZone.randomHitWeight,
				targetedAttackDicePenalty: schemeZone.targetedAttackDicePenalty,
				extraPotentialCost: schemeZone.extraPotentialCost,
				overriddenFields: [],
				isInherited: true,
				isRemoved: false,
				isActive: schemeZone.isActive,
				sortOrder: schemeZone.sortOrder
			}
		});
		syncedZoneIdsBySourceId.set(schemeZone.id, created.id);
	}
}
