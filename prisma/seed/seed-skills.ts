import { randomUUID } from 'crypto';
import { Prisma, SystemValueOwnerType } from '../__generated__/index.js';
import { createCharacterInputGraph } from '../../backend/src/app/shared/system-value-graph.factory';
import { SKILL_CATEGORY_SEEDS, SKILL_SEEDS } from './data';
import {
	ensureSystemValue,
	findRequiredByName,
	findSkillByName,
	findSkillCategoryByName,
	nullable
} from './helpers';
import {
	SeedCharacteristic,
	SeedRollConsequence,
	SeedSkillCategory
} from './types';

export async function seedSkillCategories(tx: Prisma.TransactionClient) {
	const categories: SeedSkillCategory[] = [];

	for (const seed of SKILL_CATEGORY_SEEDS) {
		const existing = await findSkillCategoryByName(tx, seed.name);
		const category = existing
			? await tx.skillCategory.update({
					where: { id: existing.id },
					data: {
						name: seed.name,
						description: nullable(seed.description),
						isActive: true,
						sortOrder: seed.sortOrder
					}
			  })
			: await tx.skillCategory.create({
					data: {
						name: seed.name,
						description: nullable(seed.description),
						isActive: true,
						sortOrder: seed.sortOrder
					}
			  });

		categories.push(category);
	}

	return categories;
}

export async function seedSkills(
	tx: Prisma.TransactionClient,
	params: {
		categories: SeedSkillCategory[];
		characteristics: SeedCharacteristic[];
		consequences: SeedRollConsequence[];
	}
) {
	for (const seed of SKILL_SEEDS) {
		const category = findRequiredByName(
			params.categories,
			seed.categoryName,
			'категорию навыков'
		);
		const rollCharacteristic = findRequiredByName(
			params.characteristics,
			seed.rollCharacteristicName,
			'характеристику'
		);
		const rollConsequence = findRequiredByName(
			params.consequences,
			seed.rollConsequenceName,
			'последствие'
		);
		const existing = await findSkillByName(tx, seed.name);
		const id = existing?.id ?? randomUUID();
		const systemValueId = existing?.systemValueId ?? id;

		await ensureSystemValue(tx, {
			id: systemValueId,
			name: seed.name,
			description: null,
			primaryOwnerType: SystemValueOwnerType.SKILL,
			primaryOwnerId: id,
			calculationGraph: createCharacterInputGraph(),
			isSystemManaged: false,
			isActive: true,
			sortOrder: seed.sortOrder,
			link: {
				targetType: SystemValueOwnerType.SKILL,
				targetId: id,
				label: null,
				sortOrder: seed.sortOrder
			}
		});

		if (existing) {
			await tx.skill.update({
				where: { id },
				data: {
					name: seed.name,
					categoryId: category.id,
					description: null,
					defaultLevel: 0,
					maxLevel: 6,
					usesDefaultLevelRules: true,
					rollCharacteristicId: rollCharacteristic.id,
					rollConsequenceId: rollConsequence.id,
					isActive: true,
					sortOrder: seed.sortOrder,
					systemValueId
				}
			});
			continue;
		}

		await tx.skill.create({
			data: {
				id,
				name: seed.name,
				categoryId: category.id,
				description: null,
				defaultLevel: 0,
				maxLevel: 6,
				usesDefaultLevelRules: true,
				rollCharacteristicId: rollCharacteristic.id,
				rollConsequenceId: rollConsequence.id,
				isActive: true,
				sortOrder: seed.sortOrder,
				systemValueId
			}
		});
	}
}
