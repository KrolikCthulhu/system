import { randomUUID } from 'node:crypto';
import {
	Prisma,
	SpellMechanicActionKind,
	SpellMechanicParameterDefaultMode,
	SpellMechanicParameterKind
} from '../__generated__/index.js';
import {
	SPELL_MECHANIC_CATEGORY_SEEDS,
	SPELL_MECHANIC_SEEDS
} from './data';

type SpellMechanicParameterSeedKind =
	| 'target'
	| 'skill'
	| 'number'
	| 'formula'
	| 'damageType'
	| 'condition'
	| 'systemValue'
	| 'text';

type SpellMechanicParameterSeedDefaultMode =
	| 'empty'
	| 'static'
	| 'fromMagicWord';

type SpellMechanicActionSeedKind =
	| 'roll'
	| 'check'
	| 'comparison'
	| 'calculation'
	| 'branch'
	| 'valueChange'
	| 'conditionAdd'
	| 'conditionRemove'
	| 'text'
	| 'custom';

type SeedContext = {
	parametersByName: Map<string, string>;
	actionsByName: Map<string, string>;
	skillsByName: Map<string, string>;
	damageTypesByName: Map<string, string>;
	conditionsByName: Map<string, string>;
	systemValuesByName: Map<string, string>;
};

export async function seedSpellMechanics(tx: Prisma.TransactionClient) {
	const categories = new Map<string, { id: string }>();
	const categoryNames = SPELL_MECHANIC_CATEGORY_SEEDS.map(seed => seed.name);
	const mechanicNames = SPELL_MECHANIC_SEEDS.map(seed => seed.name);
	const skillsByName = new Map(
		(
			await tx.skill.findMany({
				select: { id: true, name: true }
			})
		).map(skill => [skill.name, skill.id])
	);
	const systemValuesByName = new Map(
		(
			await tx.systemValue.findMany({
				select: { id: true, name: true }
			})
		).map(value => [value.name, value.id])
	);
	const damageTypesByName = new Map(
		(
			await tx.damageType.findMany({
				select: { id: true, name: true }
			})
		).map(value => [value.name, value.id])
	);
	const conditionsByName = new Map(
		(
			await tx.condition.findMany({
				select: { id: true, name: true }
			})
		).map(value => [value.name, value.id])
	);

	await tx.spellMechanic.deleteMany({
		where: {
			name: {
				notIn: mechanicNames
			}
		}
	});

	await tx.spellMechanicCategory.deleteMany({
		where: {
			name: {
				notIn: categoryNames
			},
			mechanics: {
				none: {}
			}
		}
	});

	for (const seed of SPELL_MECHANIC_CATEGORY_SEEDS) {
		const category = await tx.spellMechanicCategory.upsert({
			select: { id: true },
			where: { name: seed.name },
			create: {
				name: seed.name,
				sortOrder: seed.sortOrder
			},
			update: {
				sortOrder: seed.sortOrder
			}
		});

		categories.set(seed.name, category);
	}

	for (const seed of SPELL_MECHANIC_SEEDS) {
		const category = categories.get(seed.categoryName);

		if (!category) {
			throw new Error(
				`Spell mechanic category seed not found: ${seed.categoryName}`
			);
		}

		const mechanic = await tx.spellMechanic.upsert({
			select: { id: true },
			where: { name: seed.name },
			create: {
				categoryId: category.id,
				name: seed.name,
				sortOrder: seed.sortOrder,
				configSchema: seed.configSchema,
				textTemplate: seed.textTemplate
			},
			update: {
				categoryId: category.id,
				sortOrder: seed.sortOrder,
				configSchema: seed.configSchema,
				textTemplate: seed.textTemplate
			}
		});

		await tx.spellMechanicParameter.deleteMany({
			where: { mechanicId: mechanic.id }
		});

		if (seed.parameters.length) {
			await tx.spellMechanicParameter.createMany({
				data: seed.parameters.map((parameter, index) => ({
					mechanicId: mechanic.id,
					name: parameter.name,
					kind: toParameterKind(parameter.kind),
					defaultMode: toParameterDefaultMode(parameter.defaultValue.mode),
					staticSkillId:
						parameter.defaultValue.mode === 'static' &&
						parameter.kind === 'skill' &&
						parameter.defaultValue.value
							? requireMapValue(
									skillsByName,
									parameter.defaultValue.value,
									`Skill seed not found: ${parameter.defaultValue.value}`
							  )
							: null,
					staticDamageTypeId:
						parameter.defaultValue.mode === 'static' &&
						parameter.kind === 'damageType' &&
						parameter.defaultValue.value
							? requireMapValue(
									damageTypesByName,
									parameter.defaultValue.value,
									`Damage type seed not found: ${parameter.defaultValue.value}`
							  )
							: null,
					staticConditionId:
						parameter.defaultValue.mode === 'static' &&
						parameter.kind === 'condition' &&
						parameter.defaultValue.value
							? requireMapValue(
									conditionsByName,
									parameter.defaultValue.value,
									`Condition seed not found: ${parameter.defaultValue.value}`
							  )
							: null,
					staticSystemValueId:
						parameter.defaultValue.mode === 'static' &&
						parameter.kind === 'systemValue' &&
						parameter.defaultValue.value
							? requireMapValue(
									systemValuesByName,
									parameter.defaultValue.value,
									`System value seed not found: ${parameter.defaultValue.value}`
							  )
							: null,
					staticTextValue:
						parameter.defaultValue.mode === 'static' &&
						(parameter.kind === 'number' ||
							parameter.kind === 'formula' ||
							parameter.kind === 'text')
							? parameter.defaultValue.value
							: null,
					isRequired: parameter.required,
					configuredBySpell: parameter.configuredBySpell,
					overrideAllowed: parameter.overrideAllowed,
					sortOrder: index,
					updatedAt: new Date()
				}))
			});
		}

		const parametersByName = new Map(
			(
				await tx.spellMechanicParameter.findMany({
					select: { id: true, name: true },
					where: { mechanicId: mechanic.id }
				})
			).map(parameter => [parameter.name, parameter.id])
		);

		await tx.spellMechanicAction.deleteMany({
			where: { mechanicId: mechanic.id }
		});

		if (seed.actions.length) {
			const actionIds = new Map<string, string>();

			for (const action of seed.actions) {
				actionIds.set(action.name, randomUUID());
			}

			const context: SeedContext = {
				parametersByName,
				actionsByName: actionIds,
				skillsByName,
				damageTypesByName,
				conditionsByName,
				systemValuesByName
			};

			await tx.spellMechanicAction.createMany({
				data: seed.actions.map((action, index) => ({
					id: requireMapValue(
						actionIds,
						action.name,
						`Spell mechanic action seed not found: ${action.name}`
					),
					mechanicId: mechanic.id,
					name: action.name,
					kind: toActionKind(action.kind),
					config: resolveSeedConfig(action.config, context),
					isActive: true,
					sortOrder: index,
					updatedAt: new Date()
				}))
			});
		}
	}
}

function resolveSeedConfig(value: unknown, context: SeedContext): Prisma.InputJsonValue {
	if (Array.isArray(value)) {
		return value.map(item => resolveSeedConfig(item, context));
	}

	if (!isRecord(value)) {
		return value as Prisma.InputJsonValue;
	}

	if (value.kind === 'mechanicParameterByName') {
		const parameterName = readString(value, 'parameterName');
		return {
			kind: 'mechanicParameter',
			parameterId: requireMapValue(
				context.parametersByName,
				parameterName,
				`Spell mechanic parameter seed not found: ${parameterName}`
			)
		};
	}

	if (value.kind === 'actionResultByName') {
		const actionName = readString(value, 'actionName');
		const resultName = readString(value, 'resultName');
		return {
			kind: 'actionResult',
			actionId: requireMapValue(
				context.actionsByName,
				actionName,
				`Spell mechanic action seed not found: ${actionName}`
			),
			resultName
		};
	}

	const nestedContext = {
		...context,
		actionsByName: new Map(context.actionsByName)
	};
	const result: Record<string, Prisma.InputJsonValue> = {};

	for (const [key, item] of Object.entries(value)) {
		if (key === 'sourceId' && isRecord(item)) {
			result[key] = encodeSeedSource(resolveSeedConfig(item, nestedContext));
			continue;
		}

		if (key === 'systemValueName' || key === 'valueName') {
			const systemValueName = String(item);
			result['systemValueId'] = requireMapValue(
				context.systemValuesByName,
				systemValueName,
				`System value seed not found: ${systemValueName}`
			);
			continue;
		}

		if (key === 'thenActions' || key === 'elseActions') {
			const actions = Array.isArray(item) ? item : [];

			for (const action of actions) {
				if (isRecord(action)) {
					const actionName = readString(action, 'name');
					nestedContext.actionsByName.set(actionName, randomUUID());
				}
			}

			result[key] = actions.map((action, index) =>
				resolveNestedSeedAction(action, index, nestedContext)
			);
			continue;
		}

		result[key] = resolveSeedConfig(item, nestedContext);
	}

	return result;
}

function resolveNestedSeedAction(
	value: unknown,
	index: number,
	context: SeedContext
): Prisma.InputJsonObject {
	if (!isRecord(value)) {
		throw new Error('Nested spell mechanic action seed must be an object.');
	}

	const name = readString(value, 'name');
	const kind = readString(value, 'kind');
	const id = requireMapValue(
		context.actionsByName,
		name,
		`Nested spell mechanic action seed not found: ${name}`
	);

	return {
		id,
		name,
		kind,
		config: resolveSeedConfig(value.config ?? {}, context),
		isActive: typeof value.isActive === 'boolean' ? value.isActive : true,
		sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : index
	};
}

function encodeSeedSource(value: unknown): string {
	if (!isRecord(value)) {
		throw new Error('Graph source seed must resolve to an object.');
	}

	if (value.kind === 'mechanicParameter') {
		return `mechanicParameter:${String(value.parameterId)}`;
	}

	if (value.kind === 'actionResult') {
		return `actionResult:${String(value.actionId)}:${encodeURIComponent(
			String(value.resultName)
		)}`;
	}

	throw new Error(`Unsupported graph source seed kind: ${String(value.kind)}`);
}

function readString(value: Record<string, unknown>, key: string) {
	const result = value[key];

	if (typeof result !== 'string') {
		throw new Error(`Expected string seed field: ${key}`);
	}

	return result;
}

function requireMapValue(
	map: Map<string, string>,
	key: string,
	message: string
) {
	const value = map.get(key);

	if (!value) {
		throw new Error(message);
	}

	return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toParameterKind(kind: SpellMechanicParameterSeedKind) {
	const kinds = {
		target: 'TARGET',
		skill: 'SKILL',
		number: 'NUMBER',
		formula: 'FORMULA',
		damageType: 'DAMAGE_TYPE',
		condition: 'CONDITION',
		systemValue: 'SYSTEM_VALUE',
		text: 'TEXT'
	} satisfies Record<SpellMechanicParameterSeedKind, SpellMechanicParameterKind>;

	return kinds[kind];
}

function toParameterDefaultMode(mode: SpellMechanicParameterSeedDefaultMode) {
	const modes = {
		empty: 'EMPTY',
		static: 'STATIC',
		fromMagicWord: 'FROM_MAGIC_WORD'
	} satisfies Record<
		SpellMechanicParameterSeedDefaultMode,
		SpellMechanicParameterDefaultMode
	>;

	return modes[mode];
}

function toActionKind(kind: SpellMechanicActionSeedKind) {
	const kinds = {
		roll: 'ROLL',
		check: 'CHECK',
		comparison: 'COMPARISON',
		calculation: 'CALCULATION',
		branch: 'BRANCH',
		valueChange: 'VALUE_CHANGE',
		conditionAdd: 'CONDITION_ADD',
		conditionRemove: 'CONDITION_REMOVE',
		text: 'TEXT',
		custom: 'CUSTOM'
	} satisfies Record<SpellMechanicActionSeedKind, SpellMechanicActionKind>;

	return kinds[kind];
}
