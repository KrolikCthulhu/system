import { Prisma } from '../__generated__/index.js';
import {
	conditionDurationTypes,
	conditionEffectScopes,
	conditionEffectTypes,
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
					maxLevel: seed.maxLevel,
					removalMethods: seed.removalMethods as Prisma.InputJsonValue,
					effects: normalizeEffects(seed.effects),
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
				maxLevel: seed.maxLevel,
				removalMethods: seed.removalMethods as Prisma.InputJsonValue,
				effects: normalizeEffects(seed.effects),
				textBlocks: normalizeTextBlocks(seed.textBlocks ?? []),
				isActive: seed.isActive ?? true,
				sortOrder: seed.sortOrder
			}
		});
	}
}

function normalizeEffects(
	effects: ConditionEffectContent[]
): Prisma.InputJsonValue {
	return effects.map((effect, index) => ({
		type: effect.type,
		scope: effect.scope,
		value: effect.value,
		config: effect.config ?? {},
		sortOrder: effect.sortOrder ?? index
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

	if (seed.maxLevel < 1) {
		throw new Error(
			`Состояние "${seed.name}": maxLevel должен быть не меньше 1.`
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
