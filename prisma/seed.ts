import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { PrismaClient } from './__generated__/index.js';
import { PrismaPg } from '@prisma/adapter-pg';

dotenvExpand.expand(dotenv.config());

const D6_SIDES_COUNT = 6;

const SKILL_LEVEL_SEEDS = [
	{
		level: 0,
		name: 'Недоступно',
		canRoll: false,
		successMin: null,
		doubleSuccessMin: null,
		ignoreOnesCount: 0,
		ruleText: 'Действие недоступно.'
	},
	{
		level: 1,
		name: 'Только 6',
		canRoll: true,
		successMin: 6,
		doubleSuccessMin: null,
		ignoreOnesCount: 0,
		ruleText: 'Успех только на 6.'
	},
	{
		level: 2,
		name: '5-6',
		canRoll: true,
		successMin: 5,
		doubleSuccessMin: null,
		ignoreOnesCount: 0,
		ruleText: 'Успехи на 5-6.'
	},
	{
		level: 3,
		name: '5-6 и игнор 1',
		canRoll: true,
		successMin: 5,
		doubleSuccessMin: null,
		ignoreOnesCount: 1,
		ruleText: 'Успехи на 5-6, можно игнорировать одну выпавшую 1.'
	},
	{
		level: 4,
		name: '4-6',
		canRoll: true,
		successMin: 4,
		doubleSuccessMin: null,
		ignoreOnesCount: 0,
		ruleText: 'Успехи на 4-6.'
	},
	{
		level: 5,
		name: '4-6, 6 = 2 успеха',
		canRoll: true,
		successMin: 4,
		doubleSuccessMin: 6,
		ignoreOnesCount: 0,
		ruleText: 'Успехи на 4-6, 6 даёт 2 успеха.'
	},
	{
		level: 6,
		name: '4-6, 5-6 = 2 успеха',
		canRoll: true,
		successMin: 4,
		doubleSuccessMin: 5,
		ignoreOnesCount: 0,
		ruleText: 'Успехи на 4-6, 5-6 дают 2 успеха.'
	}
] as const;

function calculateExpectedSuccessPerDie(params: {
	canRoll: boolean;
	successMin: number | null;
	doubleSuccessMin: number | null;
}) {
	if (!params.canRoll || params.successMin === null) {
		return 0;
	}

	let totalSuccesses = 0;

	for (let face = 1; face <= D6_SIDES_COUNT; face += 1) {
		if (face >= params.successMin) {
			totalSuccesses += 1;
		}

		if (
			params.doubleSuccessMin !== null &&
			face >= params.doubleSuccessMin
		) {
			totalSuccesses += 1;
		}
	}

	return Number((totalSuccesses / D6_SIDES_COUNT).toFixed(4));
}

async function main() {
	const connectionString = process.env.POSTGRES_URI;

	if (!connectionString) {
		throw new Error('POSTGRES_URI is not set.');
	}

	const adapter = new PrismaPg({ connectionString });
	const prisma = new PrismaClient({ adapter });

	try {
		for (const seed of SKILL_LEVEL_SEEDS) {
			const expectedSuccessPerDie = calculateExpectedSuccessPerDie(seed);

			await prisma.skillLevel.upsert({
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
	} finally {
		await prisma.$disconnect();
	}
}

void main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
