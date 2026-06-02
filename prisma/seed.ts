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
		name: '4-6 и игнор 1',
		canRoll: true,
		successMin: 4,
		doubleSuccessMin: null,
		ignoreOnesCount: 1,
		ruleText: 'Успехи на 4-6, можно игнорировать одну выпавшую 1.'
	},
	{
		level: 5,
		name: '4-6, 6 = 2 успеха, игнор 1',
		canRoll: true,
		successMin: 4,
		doubleSuccessMin: 6,
		ignoreOnesCount: 1,
		ruleText: 'Успехи на 4-6, 6 даёт 2 успеха, можно игнорировать одну выпавшую 1.'
	},
	{
		level: 6,
		name: '4-6, 5-6 = 2 успеха, игнор 1',
		canRoll: true,
		successMin: 4,
		doubleSuccessMin: 5,
		ignoreOnesCount: 1,
		ruleText: 'Успехи на 4-6, 5-6 дают 2 успеха, можно игнорировать одну выпавшую 1.'
	}
] as const;

const ATTRIBUTE_SEEDS = [
	{
		name: 'Тело',
		description: '',
		sortOrder: 0
	},
	{
		name: 'Разум',
		description: '',
		sortOrder: 1
	}
] as const;

const CHARACTERISTIC_SEEDS = [
	{
		name: 'Мощь',
		attributeName: 'Тело',
		description: '',
		minValue: 0,
		maxValue: 10,
		defaultValue: 0,
		sortOrder: 0
	},
	{
		name: 'Рефлексы',
		attributeName: 'Тело',
		description: '',
		minValue: 0,
		maxValue: 10,
		defaultValue: 0,
		sortOrder: 1
	},
	{
		name: 'Душа',
		attributeName: 'Разум',
		description: '',
		minValue: 0,
		maxValue: 10,
		defaultValue: 0,
		sortOrder: 0
	},
	{
		name: 'Память',
		attributeName: 'Разум',
		description: '',
		minValue: 0,
		maxValue: 10,
		defaultValue: 0,
		sortOrder: 1
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

		for (const seed of ATTRIBUTE_SEEDS) {
			const existing = await prisma.attribute.findFirst({
				where: { name: seed.name }
			});

			if (existing) {
				await prisma.attribute.update({
					where: { id: existing.id },
					data: {
						description: seed.description || null,
						isActive: true,
						sortOrder: seed.sortOrder
					}
				});
				continue;
			}

			await prisma.attribute.create({
				data: {
					name: seed.name,
					description: seed.description || null,
					isActive: true,
					sortOrder: seed.sortOrder
				}
			});
		}

		for (const seed of CHARACTERISTIC_SEEDS) {
			const attribute = await prisma.attribute.findFirstOrThrow({
				where: { name: seed.attributeName }
			});
			const existing = await prisma.characteristic.findFirst({
				where: {
					name: seed.name,
					attributeId: attribute.id
				}
			});

			if (existing) {
				await prisma.characteristic.update({
					where: { id: existing.id },
					data: {
						description: seed.description || null,
						minValue: seed.minValue,
						maxValue: seed.maxValue,
						defaultValue: seed.defaultValue,
						isActive: true,
						sortOrder: seed.sortOrder
					}
				});
				continue;
			}

			await prisma.characteristic.create({
				data: {
					name: seed.name,
					attributeId: attribute.id,
					description: seed.description || null,
					minValue: seed.minValue,
					maxValue: seed.maxValue,
					defaultValue: seed.defaultValue,
					isActive: true,
					sortOrder: seed.sortOrder
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
