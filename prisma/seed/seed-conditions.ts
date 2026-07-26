import { Prisma } from '../__generated__/index.js';
import {
	conditionDurationTypes,
	conditionEffectScopes,
	conditionEffectTargetScopes,
	conditionEffectTypes,
	conditionApplicationConditionTypes,
	conditionDuplicateInstanceModes,
	conditionInstanceLimitModes,
	conditionInstanceModes,
	conditionInstanceOverflowModes,
	conditionInstanceUniquenessModes,
	conditionParameterTypes,
	conditionParameterValueSources,
	conditionRepeatDurationModes,
	conditionRepeatLevelModes,
	conditionRemovalMethods,
	type ConditionContent,
	type ConditionEffectContent,
	type ContentDocument
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

const CONDITION_SEEDS = readContent<
	ContentDocument<{ conditions: ConditionContent[] }>
>('dictionaries/conditions.ts').conditions;

export async function seedConditions(tx: Prisma.TransactionClient) {
	for (const seed of CONDITION_SEEDS) {
		validateConditionSeed(seed);

		const slug = seedSlug(seed);
		const existing = await tx.condition.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});

		if (existing) {
			await tx.condition.update({
				where: { id: existing.id },
				data: {
					slug,
					name: seed.name,
					description: seed.description ?? null,
					durationType: seed.durationType,
					repeatLevelMode: seed.repeatLevelMode,
					repeatDurationMode: seed.repeatDurationMode,
					instanceMode: seed.instanceMode,
					instanceLimitMode: seed.instanceLimitMode,
					maxInstances: seed.maxInstances,
					instanceOverflowMode: seed.instanceOverflowMode,
					instanceUniquenessMode: seed.instanceUniquenessMode,
					duplicateInstanceMode: seed.duplicateInstanceMode,
					maxLevel: seed.maxLevel,
					removalMethods: seed.removalMethods as Prisma.InputJsonValue,
					effects: normalizeEffects(seed.effects),
					applicationConditions: normalizeApplicationConditions(
						seed.applicationConditions ?? []
					),
					parameters: normalizeParameters(seed.parameters ?? []),
					textBlocks: normalizeTextBlocks(seed.textBlocks ?? []),
					sortOrder: seed.sortOrder,
					isActive: seed.isActive ?? true
				}
			});
			continue;
		}

		await tx.condition.create({
			data: {
				slug,
				name: seed.name,
				description: seed.description ?? null,
				durationType: seed.durationType,
				repeatLevelMode: seed.repeatLevelMode,
				repeatDurationMode: seed.repeatDurationMode,
				instanceMode: seed.instanceMode,
				instanceLimitMode: seed.instanceLimitMode,
				maxInstances: seed.maxInstances,
				instanceOverflowMode: seed.instanceOverflowMode,
				instanceUniquenessMode: seed.instanceUniquenessMode,
				duplicateInstanceMode: seed.duplicateInstanceMode,
				maxLevel: seed.maxLevel,
				removalMethods: seed.removalMethods as Prisma.InputJsonValue,
				effects: normalizeEffects(seed.effects),
				applicationConditions: normalizeApplicationConditions(
					seed.applicationConditions ?? []
				),
				parameters: normalizeParameters(seed.parameters ?? []),
				textBlocks: normalizeTextBlocks(seed.textBlocks ?? []),
				isActive: seed.isActive ?? true,
				sortOrder: seed.sortOrder
			}
		});
	}

	await tx.condition.updateMany({
		where: { slug: 'dobycha-stai' },
		data: { isActive: false }
	});
}

function normalizeEffects(
	effects: ConditionEffectContent[]
): Prisma.InputJsonValue {
	return effects.map((effect, index) => ({
		type: effect.type,
		scope: effect.scope,
		value: effect.value,
		config: {
			...(isRecord(effect.config) ? effect.config : {}),
			targetScope: effect.targetScope ?? 'holder'
		},
		sortOrder: effect.sortOrder ?? index
	})) as Prisma.InputJsonValue;
}

function normalizeApplicationConditions(
	conditions: ConditionContent['applicationConditions']
): Prisma.InputJsonValue {
	return (conditions ?? []).map((condition, index) => ({
		type: condition.type,
		isActive: condition.isActive ?? true,
		config: condition.config ?? {},
		sortOrder: condition.sortOrder ?? index
	})) as Prisma.InputJsonValue;
}

function normalizeParameters(
	parameters: ConditionContent['parameters']
): Prisma.InputJsonValue {
	return (parameters ?? []).map((parameter, index) => ({
		key: parameter.key,
		label: parameter.label,
		type: parameter.type,
		valueSource: parameter.valueSource ?? 'manual',
		isRequired: parameter.isRequired ?? true,
		defaultValue: parameter.defaultValue,
		sortOrder: parameter.sortOrder ?? index
	})) as Prisma.InputJsonValue;
}

function normalizeTextBlocks(
	textBlocks: ConditionContent['textBlocks']
): Prisma.InputJsonValue {
	return (textBlocks ?? []).map((block, index) => ({
		...block,
		isActive: block.isActive ?? true,
		sortOrder: block.sortOrder ?? index
	})) as Prisma.InputJsonValue;
}

function validateConditionSeed(seed: ConditionContent) {
	assertIncludes(
		conditionDurationTypes,
		seed.durationType,
		seed.name,
		'durationType'
	);
	assertIncludes(
		conditionRepeatLevelModes,
		seed.repeatLevelMode,
		seed.name,
		'repeatLevelMode'
	);
	assertIncludes(
		conditionRepeatDurationModes,
		seed.repeatDurationMode,
		seed.name,
		'repeatDurationMode'
	);
	assertIncludes(
		conditionInstanceModes,
		seed.instanceMode,
		seed.name,
		'instanceMode'
	);
	assertIncludes(
		conditionInstanceLimitModes,
		seed.instanceLimitMode,
		seed.name,
		'instanceLimitMode'
	);
	assertIncludes(
		conditionInstanceOverflowModes,
		seed.instanceOverflowMode,
		seed.name,
		'instanceOverflowMode'
	);
	assertIncludes(
		conditionInstanceUniquenessModes,
		seed.instanceUniquenessMode,
		seed.name,
		'instanceUniquenessMode'
	);
	assertIncludes(
		conditionDuplicateInstanceModes,
		seed.duplicateInstanceMode,
		seed.name,
		'duplicateInstanceMode'
	);

	if (seed.maxLevel < 1) {
		throw new Error(
			`Состояние "${seed.name}": maxLevel должен быть не меньше 1.`
		);
	}

	if (seed.maxInstances < 1) {
		throw new Error(
			`Состояние "${seed.name}": maxInstances должен быть не меньше 1.`
		);
	}

	for (const method of seed.removalMethods) {
		assertIncludes(
			conditionRemovalMethods,
			method,
			seed.name,
			'removalMethods'
		);
	}

	for (const effect of seed.effects) {
		assertIncludes(conditionEffectTypes, effect.type, seed.name, 'effect.type');
		assertIncludes(
			conditionEffectScopes,
			effect.scope,
			seed.name,
			'effect.scope'
		);
		assertIncludes(
			conditionEffectTargetScopes,
			effect.targetScope ?? 'holder',
			seed.name,
			'effect.targetScope'
		);
	}

	for (const condition of seed.applicationConditions ?? []) {
		assertIncludes(
			conditionApplicationConditionTypes,
			condition.type,
			seed.name,
			'applicationCondition.type'
		);
	}

	for (const parameter of seed.parameters ?? []) {
		assertIncludes(
			conditionParameterTypes,
			parameter.type,
			seed.name,
			'parameter.type'
		);
		assertIncludes(
			conditionParameterValueSources,
			parameter.valueSource ?? 'manual',
			seed.name,
			'parameter.valueSource'
		);
	}
}

function assertIncludes<TValue extends string>(
	values: readonly TValue[],
	value: string,
	conditionName: string,
	field: string
): asserts value is TValue {
	if (!values.includes(value as TValue)) {
		throw new Error(
			`Состояние "${conditionName}": неизвестное значение ${field} "${value}".`
		);
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
