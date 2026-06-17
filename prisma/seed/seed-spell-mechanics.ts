import {
	Prisma,
	SpellMechanicActionKind,
	SpellMechanicNumericRole,
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

type SpellMechanicNumericRoleSeed =
	| 'damage'
	| 'range'
	| 'duration'
	| 'area'
	| 'targetCount'
	| 'custom';

type SpellMechanicActionSeedKind =
	| 'roll'
	| 'check'
	| 'comparison'
	| 'calculation'
	| 'branch'
	| 'effectScale'
	| 'valueChange'
	| 'conditionAdd'
	| 'conditionRemove'
	| 'text'
	| 'custom';

type SeedContext = {
	parametersById: Map<string, string>;
	actionsById: Map<string, string>;
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
				description: 'description' in seed ? seed.description : null,
				sortOrder: seed.sortOrder,
				configSchema: seed.configSchema,
				textTemplate:
					typeof seed.textTemplate === 'string' ? seed.textTemplate : null
			},
			update: {
				categoryId: category.id,
				description: 'description' in seed ? seed.description : null,
				sortOrder: seed.sortOrder,
				configSchema: seed.configSchema,
				textTemplate:
					typeof seed.textTemplate === 'string' ? seed.textTemplate : null
			}
		});

		await tx.spellMechanicParameter.deleteMany({
			where: { mechanicId: mechanic.id }
		});

		if (seed.parameters.length) {
			await tx.spellMechanicParameter.createMany({
				data: seed.parameters.map((parameter, index) => ({
					id: parameter.id,
					mechanicId: mechanic.id,
					name: parameter.name,
					kind: toParameterKind(parameter.kind),
					numericRole: toNumericRole(
						'numericRole' in parameter ? parameter.numericRole : undefined,
						parameter.kind
					),
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
					defaultTargetConfig:
						'defaultTargetConfig' in parameter &&
						parameter.kind === 'target'
							? parameter.defaultTargetConfig
							: null,
					isRequired: parameter.required,
					configuredBySpell: parameter.configuredBySpell,
					overrideAllowed: parameter.overrideAllowed,
					sortOrder: index,
					updatedAt: new Date()
				}))
			});
		}

		const parametersById = new Map(
			(
				await tx.spellMechanicParameter.findMany({
					select: { id: true },
					where: { mechanicId: mechanic.id }
				})
			).map(parameter => [parameter.id, parameter.id])
		);

		const actionsById = new Map<string, string>();

		for (const action of seed.actions) {
			actionsById.set(action.id, action.id);
		}

		const context: SeedContext = {
			parametersById,
			actionsById,
			skillsByName,
			damageTypesByName,
			conditionsByName,
			systemValuesByName
		};

		await tx.spellMechanic.update({
			where: { id: mechanic.id },
			data: {
				textTemplate: resolveSeedTextTemplate(seed.textTemplate, context)
			}
		});

		await tx.spellMechanicAction.deleteMany({
			where: { mechanicId: mechanic.id }
		});

		if (seed.actions.length) {
			await tx.spellMechanicAction.createMany({
				data: seed.actions.map((action, index) => ({
					id: action.id,
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

	if (value.kind === 'mechanicParameter') {
		const parameterId = readString(value, 'parameterId');
		return {
			kind: 'mechanicParameter',
			parameterId: requireMapValue(
				context.parametersById,
				parameterId,
				`Spell mechanic parameter seed not found: ${parameterId}`
			)
		};
	}

	if (value.kind === 'actionResult') {
		const actionId = readString(value, 'actionId');
		const resultName = readString(value, 'resultName');
		return {
			kind: 'actionResult',
			actionId: requireMapValue(
				context.actionsById,
				actionId,
				`Spell mechanic action seed not found: ${actionId}`
			),
			resultName
		};
	}

	const nestedContext = {
		...context,
		actionsById: new Map(context.actionsById)
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

		if (key === 'thenActions' || key === 'elseActions' || key === 'actions') {
			const actions = Array.isArray(item) ? item : [];

			for (const action of actions) {
				if (isRecord(action)) {
					const actionId = readString(action, 'id');
					nestedContext.actionsById.set(actionId, actionId);
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

function resolveSeedTextTemplate(value: unknown, context: SeedContext) {
	if (typeof value === 'string') {
		return value;
	}

	if (!isRecord(value) || !Array.isArray(value.segments)) {
		return '';
	}

	return JSON.stringify({
		version: 1,
		segments: value.segments.map(segment =>
			resolveSeedTextTemplateSegment(segment, context)
		)
	});
}

function resolveSeedTextTemplateSegment(
	value: unknown,
	context: SeedContext
): Record<string, string> {
	if (!isRecord(value)) {
		throw new Error('Spell mechanic text template segment seed must be an object.');
	}

	if (value.kind === 'text') {
		return {
			kind: 'text',
			text: readString(value, 'text')
		};
	}

	if (value.kind === 'parameter') {
		const parameterId = readString(value, 'parameterId');
		return {
			kind: 'parameter',
			parameterId: requireMapValue(
				context.parametersById,
				parameterId,
				`Spell mechanic parameter seed not found: ${parameterId}`
			)
		};
	}

	if (value.kind === 'actionResult') {
		const actionId = readString(value, 'actionId');
		return {
			kind: 'actionResult',
			actionId: requireMapValue(
				context.actionsById,
				actionId,
				`Spell mechanic action seed not found: ${actionId}`
			),
			resultName: readString(value, 'resultName')
		};
	}

	throw new Error(
		`Unsupported spell mechanic text template segment seed kind: ${String(value.kind)}`
	);
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
	const seedId = readString(value, 'id');
	const id = requireMapValue(
		context.actionsById,
		seedId,
		`Nested spell mechanic action seed not found: ${seedId}`
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

function toNumericRole(
	role: SpellMechanicNumericRoleSeed | undefined,
	kind: SpellMechanicParameterSeedKind
) {
	if (kind !== 'number' && kind !== 'formula') {
		return SpellMechanicNumericRole.CUSTOM;
	}

	const roles = {
		damage: 'DAMAGE',
		range: 'RANGE',
		duration: 'DURATION',
		area: 'AREA',
		targetCount: 'TARGET_COUNT',
		custom: 'CUSTOM'
	} satisfies Record<SpellMechanicNumericRoleSeed, SpellMechanicNumericRole>;

	return roles[role ?? 'custom'];
}

function toActionKind(kind: SpellMechanicActionSeedKind) {
	const kinds = {
		roll: 'ROLL',
		check: 'CHECK',
		comparison: 'COMPARISON',
		calculation: 'CALCULATION',
		branch: 'BRANCH',
		effectScale: 'EFFECT_SCALE',
		valueChange: 'VALUE_CHANGE',
		conditionAdd: 'CONDITION_ADD',
		conditionRemove: 'CONDITION_REMOVE',
		text: 'TEXT',
		custom: 'CUSTOM'
	} satisfies Record<SpellMechanicActionSeedKind, SpellMechanicActionKind>;

	return kinds[kind];
}
