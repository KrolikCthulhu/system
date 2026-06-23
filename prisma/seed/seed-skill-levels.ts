import { Prisma } from '../__generated__/index.js';
import {
	calculateExpectedSuccessPerDie,
	SKILL_LEVEL_SEEDS
} from './data';

export async function seedSkillLevels(tx: Prisma.TransactionClient) {
	for (const seed of SKILL_LEVEL_SEEDS) {
		const expectedSuccessPerDie = calculateExpectedSuccessPerDie(seed);

		await tx.skillLevel.upsert({
			where: { level: seed.level },
			update: {
				name: seed.name,
				canRoll: seed.canRoll,
				successMin: seed.successMin,
				doubleSuccessMin: seed.doubleSuccessMin,
				ignoreOnesCount: seed.ignoreOnesCount,
				expectedSuccessPerDie,
				ruleText: seed.ruleText,
				isActive: true,
				sortOrder: seed.level
			},
			create: {
				level: seed.level,
				name: seed.name,
				canRoll: seed.canRoll,
				successMin: seed.successMin,
				doubleSuccessMin: seed.doubleSuccessMin,
				ignoreOnesCount: seed.ignoreOnesCount,
				expectedSuccessPerDie,
				ruleText: seed.ruleText,
				isActive: true,
				sortOrder: seed.level
			}
		});
	}
}
