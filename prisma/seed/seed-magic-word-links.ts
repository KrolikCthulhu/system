import { Prisma } from '../__generated__/index.js';
import { MAGIC_WORD_LINK_SEEDS } from './data';

export async function seedMagicWordLinks(tx: Prisma.TransactionClient) {
	for (const seed of MAGIC_WORD_LINK_SEEDS) {
		const magicWord = await tx.magicWord.findFirst({
			select: { id: true },
			where: { name: seed.magicWordName }
		});

		if (!magicWord) {
			throw new Error(`Magic word seed not found: ${seed.magicWordName}`);
		}

		await tx.magicWordSkillLink.deleteMany({
			where: { magicWordId: magicWord.id }
		});
		await tx.magicWordDamageTypeLink.deleteMany({
			where: { magicWordId: magicWord.id }
		});
		await tx.magicWordConditionLink.deleteMany({
			where: { magicWordId: magicWord.id }
		});

		for (const [index, skillName] of seed.skillNames.entries()) {
			const skill = await tx.skill.findFirst({
				select: { id: true },
				where: { name: skillName }
			});

			if (!skill) {
				throw new Error(`Magic word skill seed not found: ${skillName}`);
			}

			await tx.magicWordSkillLink.create({
				data: {
					magicWordId: magicWord.id,
					skillId: skill.id,
					sortOrder: index
				}
			});
		}

		for (const [index, damageTypeName] of seed.damageTypeNames.entries()) {
			const damageType = await tx.damageType.findUnique({
				select: { id: true },
				where: { name: damageTypeName }
			});

			if (!damageType) {
				throw new Error(`Magic word damage type seed not found: ${damageTypeName}`);
			}

			await tx.magicWordDamageTypeLink.create({
				data: {
					magicWordId: magicWord.id,
					damageTypeId: damageType.id,
					sortOrder: index
				}
			});
		}

		for (const [index, conditionName] of seed.conditionNames.entries()) {
			const condition = await tx.condition.findUnique({
				select: { id: true },
				where: { name: conditionName }
			});

			if (!condition) {
				throw new Error(`Magic word condition seed not found: ${conditionName}`);
			}

			await tx.magicWordConditionLink.create({
				data: {
					magicWordId: magicWord.id,
					conditionId: condition.id,
					sortOrder: index
				}
			});
		}
	}
}
