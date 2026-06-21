import { AreaShapeKind, MagicWordType, Prisma } from '../__generated__/index.js';
import type { AreaShapeContent, ContentDocument } from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const AREA_SHAPE_SEEDS = readContent<
	ContentDocument<{ areaShapes: AreaShapeContent[] }>
>('magic/area-shapes.ts').areaShapes;

export async function seedAreaShapes(tx: Prisma.TransactionClient) {
	const seededGestureSlugs = AREA_SHAPE_SEEDS.map(seed => seed.gestureSlug);

	for (const seed of AREA_SHAPE_SEEDS) {
		const gesture = await tx.magicWord.findUnique({
			select: { id: true },
			where: {
				type_slug: {
					type: MagicWordType.GESTURE,
					slug: seed.gestureSlug
				}
			}
		});

		if (!gesture) {
			throw new Error(`Area shape gesture seed not found: ${seed.gestureSlug}`);
		}

		await tx.areaShape.upsert({
			where: { gestureId: gesture.id },
			create: {
				gestureId: gesture.id,
				kind: toAreaShapeKind(seed.kind),
				name: seed.name,
				description: seed.description?.trim() || null,
				dimensions: seed.dimensions,
				influenceConfig: seed.influenceConfig,
				isActive: seed.isActive ?? true,
				sortOrder: seed.sortOrder
			},
			update: {
				kind: toAreaShapeKind(seed.kind),
				name: seed.name,
				description: seed.description?.trim() || null,
				dimensions: seed.dimensions,
				influenceConfig: seed.influenceConfig,
				isActive: seed.isActive ?? true,
				sortOrder: seed.sortOrder
			}
		});
	}

	const seededGestures = await tx.magicWord.findMany({
		select: { id: true },
		where: {
			type: MagicWordType.GESTURE,
			slug: { in: seededGestureSlugs }
		}
	});

	await tx.areaShape.deleteMany({
		where: {
			gestureId: {
				notIn: seededGestures.map(gesture => gesture.id)
			}
		}
	});
}

function toAreaShapeKind(kind: keyof typeof AreaShapeKind) {
	return AreaShapeKind[kind];
}
