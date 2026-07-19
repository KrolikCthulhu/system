import { AnatomyZoneKind, Prisma } from '../__generated__/index.js';
import type {
	AnatomySchemeContent,
	AnatomySchemeZoneContent,
	ContentDocument
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const ANATOMY_SCHEME_SEEDS = readContent<
	ContentDocument<{ anatomySchemes: AnatomySchemeContent[] }>
>('dictionaries/anatomy-schemes.ts').anatomySchemes;

export async function seedAnatomySchemes(tx: Prisma.TransactionClient) {
	for (const seed of ANATOMY_SCHEME_SEEDS) {
		validateAnatomySchemeSeed(seed);

		const slug = seedSlug(seed);
		const scheme = await tx.anatomyScheme.upsert({
			where: { slug },
			update: {
				name: seed.name,
				description: seed.description ?? null,
				sortOrder: seed.sortOrder,
				isActive: true
			},
			create: {
				slug,
				name: seed.name,
				description: seed.description ?? null,
				sortOrder: seed.sortOrder,
				isActive: true
			}
		});

		await tx.anatomySchemeZone.deleteMany({
			where: { schemeId: scheme.id }
		});

		const zoneIdsBySlug = new Map<string, string>();

		for (const zone of seed.zones.filter(item => !item.parent)) {
			const created = await tx.anatomySchemeZone.create({
				data: toZoneCreateData(scheme.id, null, zone)
			});
			zoneIdsBySlug.set(seedSlug(zone), created.id);
		}

		for (const zone of seed.zones.filter(item => item.parent)) {
			const parentId = zoneIdsBySlug.get(zone.parent?.slug ?? '');

			if (!parentId) {
				throw new Error(
					`Анатомическая схема "${seed.name}": родительская зона "${zone.parent?.name}" не найдена.`
				);
			}

			const created = await tx.anatomySchemeZone.create({
				data: toZoneCreateData(scheme.id, parentId, zone)
			});
			zoneIdsBySlug.set(seedSlug(zone), created.id);
		}
	}
}

function toZoneCreateData(
	schemeId: string,
	parentId: string | null,
	zone: AnatomySchemeZoneContent
): Prisma.AnatomySchemeZoneUncheckedCreateInput {
	return {
		schemeId,
		parentId,
		slug: seedSlug(zone),
		name: zone.name,
		kind: zone.kind,
		isRandomHitEligible: zone.isRandomHitEligible,
		randomHitWeight: zone.randomHitWeight,
		targetedAttackDicePenalty: zone.targetedAttackDicePenalty,
		extraPotentialCost: zone.extraPotentialCost,
		isActive: zone.isActive ?? true,
		sortOrder: zone.sortOrder
	};
}

function validateAnatomySchemeSeed(seed: AnatomySchemeContent) {
	const slugs = new Set(seed.zones.map(zone => seedSlug(zone)));

	for (const zone of seed.zones) {
		if (!(zone.kind in AnatomyZoneKind)) {
			throw new Error(
				`Анатомическая схема "${seed.name}": неизвестный тип зоны "${zone.kind}".`
			);
		}

		if (zone.randomHitWeight < 0) {
			throw new Error(
				`Анатомическая схема "${seed.name}": вес зоны "${zone.name}" не может быть отрицательным.`
			);
		}

		if (zone.parent && !slugs.has(zone.parent.slug)) {
			throw new Error(
				`Анатомическая схема "${seed.name}": родительская зона "${zone.parent.name}" не найдена.`
			);
		}
	}
}
