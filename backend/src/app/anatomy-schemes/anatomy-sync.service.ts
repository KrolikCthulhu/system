import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/generated';

type SchemeZoneRecord = Awaited<
	ReturnType<Prisma.TransactionClient['anatomySchemeZone']['findMany']>
>[number];

type CreatureZoneRecord = Awaited<
	ReturnType<Prisma.TransactionClient['creatureAnatomyZone']['findMany']>
>[number];

const OVERRIDABLE_FIELDS = [
	'name',
	'parentId',
	'kind',
	'isRandomHitEligible',
	'randomHitWeight',
	'targetedAttackDicePenalty',
	'extraPotentialCost',
	'isActive',
	'sortOrder'
] as const;

type OverridableField = (typeof OVERRIDABLE_FIELDS)[number];

@Injectable()
export class AnatomySyncService {
	async syncCreatureAnatomyFromScheme(
		tx: Prisma.TransactionClient,
		creatureId: string,
		schemeId: string | null | undefined
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
		const existingBySlug = new Map(
			existingZones.map(zone => [zone.slug, zone])
		);
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
				const updated = await tx.creatureAnatomyZone.update({
					select: { id: true },
					where: { id: existingZone.id },
					data: {
						...this.toSyncedUpdateData(existingZone, schemeZone, parentId),
						sourceZone: { connect: { id: schemeZone.id } }
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

		for (const zone of existingZones) {
			if (!zone.sourceZoneId || sourceZoneIds.has(zone.sourceZoneId)) {
				continue;
			}

			if (zone.overriddenFields.length === 0 && zone.isInherited) {
				await tx.creatureAnatomyZone.update({
					where: { id: zone.id },
					data: { isRemoved: true, isActive: false }
				});
			}
		}
	}

	async syncCreaturesUsingScheme(
		tx: Prisma.TransactionClient,
		schemeId: string
	) {
		const creatures = await tx.creature.findMany({
			select: { id: true },
			where: { anatomySchemeId: schemeId }
		});

		for (const creature of creatures) {
			await this.syncCreatureAnatomyFromScheme(tx, creature.id, schemeId);
		}
	}

	private toSyncedUpdateData(
		existingZone: CreatureZoneRecord,
		schemeZone: SchemeZoneRecord,
		parentId: string | null
	): Prisma.CreatureAnatomyZoneUpdateInput {
		const overriddenFields = new Set<OverridableField>(
			existingZone.overriddenFields.filter(isOverridableField)
		);

		return {
			name: this.syncValue(overriddenFields, 'name', schemeZone.name),
			parent: overriddenFields.has('parentId')
				? undefined
				: parentId
					? { connect: { id: parentId } }
					: { disconnect: true },
			kind: this.syncValue(overriddenFields, 'kind', schemeZone.kind),
			isRandomHitEligible: this.syncValue(
				overriddenFields,
				'isRandomHitEligible',
				schemeZone.isRandomHitEligible
			),
			randomHitWeight: this.syncValue(
				overriddenFields,
				'randomHitWeight',
				schemeZone.randomHitWeight
			),
			targetedAttackDicePenalty: this.syncValue(
				overriddenFields,
				'targetedAttackDicePenalty',
				schemeZone.targetedAttackDicePenalty
			),
			extraPotentialCost: this.syncValue(
				overriddenFields,
				'extraPotentialCost',
				schemeZone.extraPotentialCost
			),
			isActive: this.syncValue(
				overriddenFields,
				'isActive',
				schemeZone.isActive
			),
			sortOrder: this.syncValue(
				overriddenFields,
				'sortOrder',
				schemeZone.sortOrder
			),
			isInherited: true,
			isRemoved: false
		};
	}

	private syncValue<TValue>(
		overriddenFields: Set<OverridableField>,
		field: OverridableField,
		value: TValue
	): TValue | undefined {
		return overriddenFields.has(field) ? undefined : value;
	}
}

function isOverridableField(value: string): value is OverridableField {
	return OVERRIDABLE_FIELDS.includes(value as OverridableField);
}
