import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import { randomUUID } from 'crypto';
import {
	Prisma,
	PrismaClient,
	SystemValueOwnerType
} from './__generated__/index.js';

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
		description: 'Физический запас кубов персонажа.',
		sortOrder: 0
	},
	{
		name: 'Разум',
		description: 'Ментальный запас кубов персонажа.',
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

const ROLL_CONSEQUENCE_SEEDS = [
	{
		name: 'Усталость',
		description: 'Последствия физического напряжения.',
		sortOrder: 0,
		values: ['Очки усталости', 'Уровень усталости'] as const
	},
	{
		name: 'Стресс',
		description: 'Последствия ментального напряжения.',
		sortOrder: 1,
		values: ['Очки стресса', 'Уровень стресса'] as const
	},
	{
		name: 'Осложнение',
		description: 'Нарративное или ситуационное осложнение.',
		sortOrder: 2,
		values: [] as const
	}
] as const;

const SKILL_CATEGORY_SEEDS = [
	{
		name: 'Боевые навыки',
		description: '',
		sortOrder: 0
	},
	{
		name: 'Магические навыки',
		description: '',
		sortOrder: 1
	}
] as const;

const SKILL_SEEDS = [
	{
		name: 'Рукопашный бой',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Мощь',
		rollConsequenceName: 'Усталость',
		sortOrder: 0
	},
	{
		name: 'Метательное оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Рефлексы',
		rollConsequenceName: 'Усталость',
		sortOrder: 1
	},
	{
		name: 'Древковое оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Мощь',
		rollConsequenceName: 'Усталость',
		sortOrder: 2
	},
	{
		name: 'Клинковое оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Мощь',
		rollConsequenceName: 'Усталость',
		sortOrder: 3
	},
	{
		name: 'Ударное оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Мощь',
		rollConsequenceName: 'Усталость',
		sortOrder: 4
	},
	{
		name: 'Огнестрельное оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Рефлексы',
		rollConsequenceName: 'Усталость',
		sortOrder: 5
	},
	{
		name: 'Стрелковое оружие',
		categoryName: 'Боевые навыки',
		rollCharacteristicName: 'Рефлексы',
		rollConsequenceName: 'Усталость',
		sortOrder: 6
	},
	{
		name: 'Понимание Сущности',
		categoryName: 'Магические навыки',
		rollCharacteristicName: 'Душа',
		rollConsequenceName: 'Стресс',
		sortOrder: 0
	},
	{
		name: 'Понимание Сознания',
		categoryName: 'Магические навыки',
		rollCharacteristicName: 'Душа',
		rollConsequenceName: 'Стресс',
		sortOrder: 1
	},
	{
		name: 'Понимание Формы',
		categoryName: 'Магические навыки',
		rollCharacteristicName: 'Душа',
		rollConsequenceName: 'Стресс',
		sortOrder: 2
	},
	{
		name: 'Понимание Потока',
		categoryName: 'Магические навыки',
		rollCharacteristicName: 'Душа',
		rollConsequenceName: 'Стресс',
		sortOrder: 3
	},
	{
		name: 'Понимание Порядка',
		categoryName: 'Магические навыки',
		rollCharacteristicName: 'Душа',
		rollConsequenceName: 'Стресс',
		sortOrder: 4
	}
] as const;

type SeedSystemValue = {
	id: string;
	name: string;
	description: string | null;
	primaryOwnerType: SystemValueOwnerType;
	primaryOwnerId: string | null;
	displaySection: string | null;
	calculationGraph: Prisma.JsonValue | null;
	isSystemManaged: boolean;
	isActive: boolean;
	sortOrder: number;
};

type SeedAttribute = {
	id: string;
	name: string;
	description: string | null;
	systemValueId: string;
	poolPenaltyValueId: string | null;
	availablePoolValueId: string | null;
	isActive: boolean;
	sortOrder: number;
};

type SeedCharacteristic = {
	id: string;
	name: string;
	attributeId: string;
	description: string | null;
	minValue: number;
	maxValue: number;
	defaultValue: number;
	systemValueId: string;
	isActive: boolean;
	sortOrder: number;
};

type SeedRollConsequence = {
	id: string;
	name: string;
	description: string | null;
	rollEventGraph: Prisma.JsonValue | null;
	isActive: boolean;
	sortOrder: number;
};

type SeedSkillCategory = {
	id: string;
	name: string;
	description: string | null;
	isActive: boolean;
	sortOrder: number;
};

type SeedSkill = {
	id: string;
	name: string;
	categoryId: string;
	description: string | null;
	defaultLevel: number;
	maxLevel: number;
	usesDefaultLevelRules: boolean;
	systemValueId: string;
	rollCharacteristicId: string | null;
	rollConsequenceId: string | null;
	isActive: boolean;
	sortOrder: number;
};

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
		await prisma.$transaction(async tx => {
			await seedSkillLevels(tx);

			const consequences = await seedRollConsequences(tx);
			const consequenceValues = await seedRollConsequenceValues(
				tx,
				consequences
			);
			const sourceValue = await seedSourceValue(tx);
			const attributes = await seedAttributes(tx);
			const characteristics = await seedCharacteristics(tx, attributes);

			await seedAttributeGraphs(tx, attributes, characteristics);
			await seedAttributePoolRules(tx, {
				attributes,
				consequenceValues
			});
			await seedPotentialValue(tx, {
				attributes,
				consequenceValues
			});
			await seedRollEventGraphs(tx, {
				consequences,
				consequenceValues,
				attributes
			});
			await seedGameEventHandlers(tx, { sourceValue });

			const categories = await seedSkillCategories(tx);
			await seedSkills(tx, {
				categories,
				characteristics,
				consequences
			});
		});
	} finally {
		await prisma.$disconnect();
	}
}

async function seedSkillLevels(tx: Prisma.TransactionClient) {
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

async function seedAttributes(tx: Prisma.TransactionClient) {
	const attributes: SeedAttribute[] = [];

	for (const seed of ATTRIBUTE_SEEDS) {
		const existing = await findAttributeByName(tx, seed.name);
		const id = existing?.id ?? randomUUID();
		const systemValueId = existing?.systemValueId ?? id;

		await ensureSystemValue(tx, {
			id: systemValueId,
			name: seed.name,
			description: nullable(seed.description),
			primaryOwnerType: SystemValueOwnerType.ATTRIBUTE,
			primaryOwnerId: id,
			calculationGraph: createCharacterInputGraph(),
			isSystemManaged: false,
			isActive: true,
			sortOrder: seed.sortOrder,
			link: {
				targetType: SystemValueOwnerType.ATTRIBUTE,
				targetId: id,
				label: null,
				sortOrder: seed.sortOrder
			}
		});

		const attribute = existing
			? await tx.attribute.update({
					where: { id },
					data: {
						name: seed.name,
						description: nullable(seed.description),
						isActive: true,
						sortOrder: seed.sortOrder,
						systemValueId
					}
			  })
			: await tx.attribute.create({
					data: {
						id,
						name: seed.name,
						description: nullable(seed.description),
						isActive: true,
						sortOrder: seed.sortOrder,
						systemValueId
					}
			  });

		attributes.push(attribute);
	}

	return attributes;
}

async function seedCharacteristics(
	tx: Prisma.TransactionClient,
	attributes: SeedAttribute[]
) {
	const characteristics: SeedCharacteristic[] = [];

	for (const seed of CHARACTERISTIC_SEEDS) {
		const attribute = findRequiredByName(attributes, seed.attributeName, 'атрибут');
		const existing = await findCharacteristicByName(tx, seed.name);
		const id = existing?.id ?? randomUUID();
		const systemValueId = existing?.systemValueId ?? id;

		await ensureSystemValue(tx, {
			id: systemValueId,
			name: seed.name,
			description: nullable(seed.description),
			primaryOwnerType: SystemValueOwnerType.CHARACTERISTIC,
			primaryOwnerId: id,
			calculationGraph: createCharacterInputGraph(),
			isSystemManaged: false,
			isActive: true,
			sortOrder: seed.sortOrder,
			link: {
				targetType: SystemValueOwnerType.CHARACTERISTIC,
				targetId: id,
				label: null,
				sortOrder: seed.sortOrder
			}
		});

		const characteristic = existing
			? await tx.characteristic.update({
					where: { id },
					data: {
						name: seed.name,
						attributeId: attribute.id,
						description: nullable(seed.description),
						minValue: seed.minValue,
						maxValue: seed.maxValue,
						defaultValue: seed.defaultValue,
						isActive: true,
						sortOrder: seed.sortOrder,
						systemValueId
					}
			  })
			: await tx.characteristic.create({
					data: {
						id,
						name: seed.name,
						attributeId: attribute.id,
						description: nullable(seed.description),
						minValue: seed.minValue,
						maxValue: seed.maxValue,
						defaultValue: seed.defaultValue,
						isActive: true,
						sortOrder: seed.sortOrder,
						systemValueId
					}
			  });

		characteristics.push(characteristic);
	}

	return characteristics;
}

async function seedAttributeGraphs(
	tx: Prisma.TransactionClient,
	attributes: SeedAttribute[],
	characteristics: SeedCharacteristic[]
) {
	for (const attribute of attributes) {
		const sourceValueIds = characteristics
			.filter(characteristic => characteristic.attributeId === attribute.id)
			.sort((first, second) => first.sortOrder - second.sortOrder)
			.map(characteristic => characteristic.systemValueId);

		await tx.systemValue.update({
			where: { id: attribute.systemValueId },
			data: {
				calculationGraph: createSumGraph(sourceValueIds) as Prisma.InputJsonValue
			}
		});
	}
}

async function seedRollConsequences(tx: Prisma.TransactionClient) {
	const consequences: SeedRollConsequence[] = [];

	for (const seed of ROLL_CONSEQUENCE_SEEDS) {
		const existing = await findRollConsequenceByName(tx, seed.name);
		const consequence = existing
			? await tx.rollConsequence.update({
					where: { id: existing.id },
					data: {
						name: seed.name,
						description: nullable(seed.description),
						isActive: true,
						sortOrder: seed.sortOrder
					}
			  })
			: await tx.rollConsequence.create({
					data: {
						name: seed.name,
						description: nullable(seed.description),
						isActive: true,
						sortOrder: seed.sortOrder
					}
			  });

		consequences.push(consequence);
	}

	return consequences;
}

async function seedRollConsequenceValues(
	tx: Prisma.TransactionClient,
	consequences: SeedRollConsequence[]
) {
	const values = new Map<string, SeedSystemValue>();

	for (const seed of ROLL_CONSEQUENCE_SEEDS) {
		const consequence = findRequiredByName(
			consequences,
			seed.name,
			'последствие'
		);

		for (let index = 0; index < seed.values.length; index += 1) {
			const valueName = seed.values[index];
			const existing = await tx.systemValue.findFirst({
				where: {
					name: valueName,
					primaryOwnerType: SystemValueOwnerType.ROLL_CONSEQUENCE,
					primaryOwnerId: consequence.id
				}
			});
			const id = existing?.id ?? randomUUID();
			const value = await ensureSystemValue(tx, {
				id,
				name: valueName,
				description: null,
				primaryOwnerType: SystemValueOwnerType.ROLL_CONSEQUENCE,
				primaryOwnerId: consequence.id,
				calculationGraph: createCharacterInputGraph(),
				isSystemManaged: false,
				isActive: true,
				sortOrder: index,
				link: {
					targetType: SystemValueOwnerType.ROLL_CONSEQUENCE,
					targetId: consequence.id,
					label: null,
					sortOrder: index
				}
			});

			values.set(valueName, value);
		}
	}

	return values;
}

async function seedSourceValue(tx: Prisma.TransactionClient) {
	const existing = await tx.systemValue.findFirst({
		where: {
			name: 'Источник',
			primaryOwnerType: SystemValueOwnerType.MANUAL,
			primaryOwnerId: null
		}
	});

	return ensureSystemValue(tx, {
		id: existing?.id ?? randomUUID(),
		name: 'Источник',
		description:
			'Ресурс персонажа: начисляется за выпавшие шестерки при броске.',
		primaryOwnerType: SystemValueOwnerType.MANUAL,
		primaryOwnerId: null,
		displaySection: 'Ресурсы персонажа',
		calculationGraph: createCharacterInputGraph(),
		isSystemManaged: false,
		isActive: true,
		sortOrder: 0
	});
}

async function seedPotentialValue(
	tx: Prisma.TransactionClient,
	params: {
		attributes: SeedAttribute[];
		consequenceValues: Map<string, SeedSystemValue>;
	}
) {
	const body = findRequiredByName(params.attributes, 'Тело', 'атрибут');
	const mind = findRequiredByName(params.attributes, 'Разум', 'атрибут');
	const fatigueLevel = findRequiredMapValue(
		params.consequenceValues,
		'Уровень усталости'
	);
	const existing = await tx.systemValue.findFirst({
		where: {
			name: 'Потенциал',
			primaryOwnerType: SystemValueOwnerType.MANUAL,
			primaryOwnerId: null
		}
	});

	return ensureSystemValue(tx, {
		id: existing?.id ?? randomUUID(),
		name: 'Потенциал',
		description:
			'Ресурс персонажа: очки действий в ходу, считается от базовых Тела и Разума с учетом уровня усталости.',
		primaryOwnerType: SystemValueOwnerType.MANUAL,
		primaryOwnerId: null,
		displaySection: 'Ресурсы персонажа',
		calculationGraph: createPotentialGraph({
			bodyValueId: body.systemValueId,
			mindValueId: mind.systemValueId,
			fatigueLevelValueId: fatigueLevel.id
		}),
		isSystemManaged: false,
		isActive: true,
		sortOrder: 1
	});
}

async function seedAttributePoolRules(
	tx: Prisma.TransactionClient,
	params: {
		attributes: SeedAttribute[];
		consequenceValues: Map<string, SeedSystemValue>;
	}
) {
	const fatiguePoints = findRequiredMapValue(
		params.consequenceValues,
		'Очки усталости'
	);
	const stressPoints = findRequiredMapValue(
		params.consequenceValues,
		'Очки стресса'
	);

	for (const attribute of params.attributes) {
		const penaltyValue =
			attribute.name === 'Тело'
				? fatiguePoints
				: attribute.name === 'Разум'
					? stressPoints
					: null;

		if (!penaltyValue) {
			continue;
		}

		const updated = await tx.attribute.update({
			where: { id: attribute.id },
			data: { poolPenaltyValueId: penaltyValue.id }
		});

		await ensureAvailablePoolValue(tx, {
			attribute: updated,
			penaltyValueId: penaltyValue.id
		});
	}
}

async function seedRollEventGraphs(
	tx: Prisma.TransactionClient,
	params: {
		consequences: SeedRollConsequence[];
		consequenceValues: Map<string, SeedSystemValue>;
		attributes: SeedAttribute[];
	}
) {
	const fatigue = findRequiredByName(
		params.consequences,
		'Усталость',
		'последствие'
	);
	const stress = findRequiredByName(params.consequences, 'Стресс', 'последствие');
	const body = findRequiredByName(params.attributes, 'Тело', 'атрибут');
	const mind = findRequiredByName(params.attributes, 'Разум', 'атрибут');

	await tx.rollConsequence.update({
		where: { id: fatigue.id },
		data: {
			rollEventGraph: createThresholdCounterRollEventGraph({
				accumulatorValueId: findRequiredMapValue(
					params.consequenceValues,
					'Очки усталости'
				).id,
				thresholdValueId: body.systemValueId,
				overflowValueId: findRequiredMapValue(
					params.consequenceValues,
					'Уровень усталости'
				).id
			}) as Prisma.InputJsonValue
		}
	});

	await tx.rollConsequence.update({
		where: { id: stress.id },
		data: {
			rollEventGraph: createThresholdCounterRollEventGraph({
				accumulatorValueId: findRequiredMapValue(
					params.consequenceValues,
					'Очки стресса'
				).id,
				thresholdValueId: mind.systemValueId,
				overflowValueId: findRequiredMapValue(
					params.consequenceValues,
					'Уровень стресса'
				).id
			}) as Prisma.InputJsonValue
		}
	});
}

async function seedGameEventHandlers(
	tx: Prisma.TransactionClient,
	params: {
		sourceValue: SeedSystemValue;
	}
) {
	const existing = await tx.gameEventHandler.findFirst({
		where: {
			eventType: 'ROLL_PERFORMED',
			name: 'Начисление источника'
		}
	});
	const data = {
		eventType: 'ROLL_PERFORMED',
		name: 'Начисление источника',
		description: 'За каждую выпавшую 6 добавляет 1 к значению Источник.',
		graph: createSourceGainRollEventGraph(
			params.sourceValue.id
		) as Prisma.InputJsonValue,
		isActive: true,
		sortOrder: -100
	};

	if (existing) {
		await tx.gameEventHandler.update({
			where: { id: existing.id },
			data
		});
		return;
	}

	await tx.gameEventHandler.create({ data });
}

async function seedSkillCategories(tx: Prisma.TransactionClient) {
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

async function seedSkills(
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

async function ensureSystemValue(
	tx: Prisma.TransactionClient,
	params: {
		id: string;
		name: string;
		description: string | null;
		primaryOwnerType: SystemValueOwnerType;
		primaryOwnerId: string | null;
		displaySection?: string | null;
		calculationGraph: object;
		isSystemManaged: boolean;
		isActive: boolean;
		sortOrder: number;
		link?: {
			targetType: SystemValueOwnerType;
			targetId: string;
			label: string | null;
			sortOrder: number;
		};
	}
) {
	const existing = await tx.systemValue.findUnique({
		where: { id: params.id }
	});
	const data = {
		name: params.name,
		description: params.description,
		primaryOwnerType: params.primaryOwnerType,
		primaryOwnerId: params.primaryOwnerId,
		displaySection: params.displaySection ?? null,
		calculationGraph: params.calculationGraph as Prisma.InputJsonValue,
		isSystemManaged: params.isSystemManaged,
		isActive: params.isActive,
		sortOrder: params.sortOrder
	};
	const value = existing
		? await tx.systemValue.update({
				where: { id: params.id },
				data
		  })
		: await tx.systemValue.create({
				data: {
					id: params.id,
					...data
				}
		  });

	if (params.link) {
		await tx.systemValueLink.upsert({
			where: {
				systemValueId_targetType_targetId: {
					systemValueId: value.id,
					targetType: params.link.targetType,
					targetId: params.link.targetId
				}
			},
			create: {
				id: randomUUID(),
				systemValueId: value.id,
				targetType: params.link.targetType,
				targetId: params.link.targetId,
				label: params.link.label,
				sortOrder: params.link.sortOrder
			},
			update: {
				label: params.link.label,
				sortOrder: params.link.sortOrder
			}
		});
	}

	return value;
}

async function ensureAvailablePoolValue(
	tx: Prisma.TransactionClient,
	params: {
		attribute: SeedAttribute;
		penaltyValueId: string | null;
	}
) {
	const existingValueId =
		params.attribute.availablePoolValueId ??
		(
			await tx.systemValue.findFirst({
				select: { id: true },
				where: {
					name: `Доступный пул ${params.attribute.name}`,
					primaryOwnerType: SystemValueOwnerType.ATTRIBUTE,
					primaryOwnerId: params.attribute.id,
					isSystemManaged: true
				}
			})
		)?.id ??
		randomUUID();
	const value = await ensureSystemValue(tx, {
		id: existingValueId,
		name: `Доступный пул ${params.attribute.name}`,
		description:
			'Системное значение: ограничивает кубы характеристик этим атрибутом с учётом штрафа пула.',
		primaryOwnerType: SystemValueOwnerType.ATTRIBUTE,
		primaryOwnerId: params.attribute.id,
		calculationGraph: createAvailablePoolGraph(
			params.attribute.systemValueId,
			params.penaltyValueId
		),
		isSystemManaged: true,
		isActive: params.attribute.isActive,
		sortOrder: params.attribute.sortOrder,
		link: {
			targetType: SystemValueOwnerType.ATTRIBUTE,
			targetId: params.attribute.id,
			label: 'Доступный пул кубов',
			sortOrder: params.attribute.sortOrder
		}
	});

	await tx.attribute.update({
		where: { id: params.attribute.id },
		data: { availablePoolValueId: value.id }
	});

	return value;
}

async function findAttributeByName(tx: Prisma.TransactionClient, name: string) {
	const values = await tx.attribute.findMany();
	return findByName(values, name);
}

async function findCharacteristicByName(
	tx: Prisma.TransactionClient,
	name: string
) {
	const values = await tx.characteristic.findMany();
	return findByName(values, name);
}

async function findRollConsequenceByName(
	tx: Prisma.TransactionClient,
	name: string
) {
	const values = await tx.rollConsequence.findMany();
	return findByName(values, name);
}

async function findSkillCategoryByName(
	tx: Prisma.TransactionClient,
	name: string
) {
	const values = await tx.skillCategory.findMany();
	return findByName(values, name);
}

async function findSkillByName(tx: Prisma.TransactionClient, name: string) {
	const values = await tx.skill.findMany();
	return findByName(values, name);
}

function findByName<T extends { name: string }>(items: T[], name: string) {
	const normalized = normalizeName(name);
	return items.find(item => normalizeName(item.name) === normalized) ?? null;
}

function findRequiredByName<T extends { name: string }>(
	items: T[],
	name: string,
	entityLabel: string
) {
	const item = findByName(items, name);

	if (!item) {
		throw new Error(`Не найдена сущность "${name}" (${entityLabel}).`);
	}

	return item;
}

function findRequiredMapValue<T>(items: Map<string, T>, key: string) {
	const item = items.get(key);

	if (!item) {
		throw new Error(`Не найдено значение "${key}".`);
	}

	return item;
}

function normalizeName(name: string) {
	return name.trim().toLocaleLowerCase('ru');
}

function nullable(value: string | null | undefined) {
	const normalized = value?.trim() ?? '';
	return normalized ? normalized : null;
}

function createCharacterInputGraph() {
	return {
		nodes: [
			{ id: 'character-input', kind: 'characterInput', x: 120, y: 120 },
			{ id: 'result', kind: 'result', x: 420, y: 120 }
		],
		edges: [
			{
				id: 'character-input:out -> result:in',
				source: 'character-input',
				target: 'result',
				sourceHandle: 'out',
				targetHandle: 'in'
			}
		]
	};
}

function createSumGraph(sourceValueIds: string[]) {
	const sourceNodes = sourceValueIds.map((sourceValueId, index) => ({
		id: `source-${index}`,
		kind: 'source',
		x: 120,
		y: 80 + index * 96,
		sourceValueId
	}));

	return {
		nodes: [
			...sourceNodes,
			{
				id: 'sum',
				kind: 'operation',
				x: 420,
				y: 120,
				operation: 'sum'
			},
			{ id: 'result', kind: 'result', x: 720, y: 120 }
		],
		edges: [
			...sourceNodes.map(node => ({
				id: `${node.id}:out -> sum:in`,
				source: node.id,
				target: 'sum',
				sourceHandle: 'out',
				targetHandle: 'in'
			})),
			{
				id: 'sum:out -> result:in',
				source: 'sum',
				target: 'result',
				sourceHandle: 'out',
				targetHandle: 'in'
			}
		]
	};
}

function createAvailablePoolGraph(
	attributeValueId: string,
	penaltyValueId: string | null
) {
	return {
		nodes: [
			{
				id: 'attribute-value',
				kind: 'source',
				x: 120,
				y: 80,
				sourceValueId: attributeValueId
			},
			{
				id: 'penalty-value',
				kind: penaltyValueId ? 'source' : 'constant',
				x: 120,
				y: 220,
				...(penaltyValueId
					? { sourceValueId: penaltyValueId }
					: { constantValue: 0 })
			},
			{
				id: 'zero',
				kind: 'constant',
				x: 360,
				y: 240,
				constantValue: 0
			},
			{
				id: 'subtract-penalty',
				kind: 'operation',
				x: 360,
				y: 120,
				operation: 'subtract'
			},
			{
				id: 'clamp-min-zero',
				kind: 'operation',
				x: 600,
				y: 140,
				operation: 'max'
			},
			{ id: 'result', kind: 'result', x: 840, y: 140 }
		],
		edges: [
			{
				id: 'attribute-value:out -> subtract-penalty:a',
				source: 'attribute-value',
				target: 'subtract-penalty',
				sourceHandle: 'out',
				targetHandle: 'a'
			},
			{
				id: 'penalty-value:out -> subtract-penalty:b',
				source: 'penalty-value',
				target: 'subtract-penalty',
				sourceHandle: 'out',
				targetHandle: 'b'
			},
			{
				id: 'subtract-penalty:out -> clamp-min-zero:in',
				source: 'subtract-penalty',
				target: 'clamp-min-zero',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'zero:out -> clamp-min-zero:in',
				source: 'zero',
				target: 'clamp-min-zero',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'clamp-min-zero:out -> result:in',
				source: 'clamp-min-zero',
				target: 'result',
				sourceHandle: 'out',
				targetHandle: 'in'
			}
		]
	};
}

function createPotentialGraph(params: {
	bodyValueId: string;
	mindValueId: string;
	fatigueLevelValueId: string;
}) {
	return {
		nodes: [
			{
				id: 'body-value',
				kind: 'source',
				x: 120,
				y: 80,
				sourceValueId: params.bodyValueId
			},
			{
				id: 'mind-value',
				kind: 'source',
				x: 120,
				y: 200,
				sourceValueId: params.mindValueId
			},
			{
				id: 'fatigue-level',
				kind: 'source',
				x: 120,
				y: 340,
				sourceValueId: params.fatigueLevelValueId
			},
			{
				id: 'zero',
				kind: 'constant',
				x: 600,
				y: 360,
				constantValue: 0
			},
			{
				id: 'sum-attributes',
				kind: 'operation',
				x: 360,
				y: 140,
				operation: 'sum'
			},
			{
				id: 'subtract-fatigue',
				kind: 'operation',
				x: 600,
				y: 200,
				operation: 'subtract'
			},
			{
				id: 'clamp-min-zero',
				kind: 'operation',
				x: 840,
				y: 240,
				operation: 'max'
			},
			{ id: 'result', kind: 'result', x: 1080, y: 240 }
		],
		edges: [
			{
				id: 'body-value:out -> sum-attributes:in',
				source: 'body-value',
				target: 'sum-attributes',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'mind-value:out -> sum-attributes:in',
				source: 'mind-value',
				target: 'sum-attributes',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'sum-attributes:out -> subtract-fatigue:a',
				source: 'sum-attributes',
				target: 'subtract-fatigue',
				sourceHandle: 'out',
				targetHandle: 'a'
			},
			{
				id: 'fatigue-level:out -> subtract-fatigue:b',
				source: 'fatigue-level',
				target: 'subtract-fatigue',
				sourceHandle: 'out',
				targetHandle: 'b'
			},
			{
				id: 'subtract-fatigue:out -> clamp-min-zero:in',
				source: 'subtract-fatigue',
				target: 'clamp-min-zero',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'zero:out -> clamp-min-zero:in',
				source: 'zero',
				target: 'clamp-min-zero',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'clamp-min-zero:out -> result:in',
				source: 'clamp-min-zero',
				target: 'result',
				sourceHandle: 'out',
				targetHandle: 'in'
			}
		]
	};
}

function createThresholdCounterRollEventGraph(params: {
	accumulatorValueId: string;
	thresholdValueId: string;
	overflowValueId: string;
}) {
	return {
		nodes: [
			{
				id: 'event-consequence-count',
				kind: 'eventInput',
				x: 120,
				y: 180,
				eventInputKey: 'consequenceCount'
			},
			{
				id: 'threshold-counter',
				kind: 'thresholdCounter',
				x: 520,
				y: 150,
				accumulatorValueId: params.accumulatorValueId,
				thresholdValueId: params.thresholdValueId,
				overflowValueId: params.overflowValueId,
				thresholdSource: 'final',
				resetMode: 'zero',
				overflowMode: 'single',
				overflowIncrement: 1
			}
		],
		edges: [
			{
				id: 'event-consequence-count:out -> threshold-counter:increment',
				source: 'event-consequence-count',
				target: 'threshold-counter',
				sourceHandle: 'out',
				targetHandle: 'increment'
			}
		]
	};
}

function createSourceGainRollEventGraph(sourceValueId: string) {
	return {
		nodes: [
			{
				id: 'event-sixes',
				kind: 'eventInput',
				x: 120,
				y: 120,
				eventInputKey: 'sixes'
			},
			{
				id: 'current-source',
				kind: 'valueSource',
				x: 120,
				y: 260,
				sourceValueId
			},
			{
				id: 'sum-source',
				kind: 'operation',
				x: 420,
				y: 180,
				operation: 'sum'
			},
			{
				id: 'write-source',
				kind: 'writeValue',
				x: 720,
				y: 180,
				targetValueId: sourceValueId
			}
		],
		edges: [
			{
				id: 'event-sixes:out -> sum-source:in',
				source: 'event-sixes',
				target: 'sum-source',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'current-source:out -> sum-source:in',
				source: 'current-source',
				target: 'sum-source',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'sum-source:out -> write-source:value',
				source: 'sum-source',
				target: 'write-source',
				sourceHandle: 'out',
				targetHandle: 'value'
			}
		]
	};
}

void main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
