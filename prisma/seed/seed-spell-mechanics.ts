import { createHash } from 'crypto';
import {
	Prisma,
	SpellMechanicActionKind,
	SpellMechanicNumericRole,
	SpellMechanicParameterDefaultMode,
	SpellMechanicParameterKind,
	SpellMechanicParameterScope
} from '../__generated__/index.js';
import type {
	ContentDocument,
	SpellMechanicActionContent,
	SpellMechanicCategoryContent,
	SpellMechanicContent,
	SpellMechanicParameterContent
} from '../content/content-types';
import { readContent } from './content';
import { seedSlug } from './slug';

type SpellMechanicsContent = ContentDocument<{
	categories: SpellMechanicCategoryContent[];
	mechanics: SpellMechanicContent[];
}>;

type SeedContext = {
	mechanicSlug: string;
	parametersBySlug: Map<string, string>;
	actionsBySlug: Map<string, string>;
	skillsByName: Map<string, string>;
	damageTypesByName: Map<string, string>;
	conditionsByName: Map<string, string>;
	systemValuesByName: Map<string, string>;
};

const spellMechanicsContent =
	readContent<SpellMechanicsContent>('magic/mechanics.ts');
const SPELL_MECHANIC_CATEGORY_SEEDS = spellMechanicsContent.categories;
const SPELL_MECHANIC_SEEDS = spellMechanicsContent.mechanics;

export async function seedSpellMechanics(tx: Prisma.TransactionClient) {
	const categories = new Map<string, { id: string }>();
	const categorySlugs = SPELL_MECHANIC_CATEGORY_SEEDS.map(seed =>
		seedSlug(seed)
	);
	const mechanicSlugs = SPELL_MECHANIC_SEEDS.map(seed => seedSlug(seed));
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

	for (const seed of SPELL_MECHANIC_CATEGORY_SEEDS) {
		const slug = seedSlug(seed);
		const existing = await tx.spellMechanicCategory.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});
		const category = existing
			? await tx.spellMechanicCategory.update({
					select: { id: true },
					where: { id: existing.id },
					data: {
						slug,
						name: seed.name,
						sortOrder: seed.sortOrder
					}
				})
			: await tx.spellMechanicCategory.create({
					select: { id: true },
					data: {
						slug,
						name: seed.name,
						sortOrder: seed.sortOrder
					}
				});

		categories.set(seed.name, category);
	}

	for (const seed of SPELL_MECHANIC_SEEDS) {
		const slug = seedSlug(seed);
		const category = categories.get(seed.categoryName);

		if (!category) {
			throw new Error(
				`Spell mechanic category seed not found: ${seed.categoryName}`
			);
		}

		const existing = await tx.spellMechanic.findFirst({
			select: { id: true },
			where: {
				OR: [{ slug }, { name: seed.name }]
			}
		});
		const mechanic = existing
			? await tx.spellMechanic.update({
					select: { id: true },
					where: { id: existing.id },
					data: {
						categoryId: category.id,
						slug,
						name: seed.name,
						description: 'description' in seed ? seed.description : null,
						sortOrder: seed.sortOrder,
						configSchema: seed.configSchema,
						textTemplate:
							typeof seed.textTemplate === 'string' ? seed.textTemplate : null
					}
				})
			: await tx.spellMechanic.create({
					select: { id: true },
					data: {
						categoryId: category.id,
						slug,
						name: seed.name,
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
					id: stableSeedUuid(
						`spell-mechanic-parameter:${slug}:${seedSlug(parameter)}`
					),
					mechanicId: mechanic.id,
					slug: seedSlug(parameter),
					name: parameter.name,
					kind: toParameterKind(parameter.kind),
					numericRole: toNumericRole(
						'numericRole' in parameter ? parameter.numericRole : undefined,
						parameter.kind
					),
					scope: toParameterScope(parameter),
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
						'defaultTargetConfig' in parameter && parameter.kind === 'target'
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

		const parametersBySlug = new Map(
			seed.parameters.map(parameter => {
				const parameterSlug = seedSlug(parameter);
				return [
					parameterSlug,
					stableSeedUuid(`spell-mechanic-parameter:${slug}:${parameterSlug}`)
				];
			})
		);

		const actionsBySlug = new Map<string, string>();

		for (const action of seed.actions) {
			actionsBySlug.set(
				action.slug,
				stableSeedUuid(`spell-mechanic-action:${slug}:${action.slug}`)
			);
		}

		const context: SeedContext = {
			mechanicSlug: slug,
			parametersBySlug,
			actionsBySlug,
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
					id: requireMapValue(
						context.actionsBySlug,
						action.slug,
						`Spell mechanic action seed not found: ${action.slug}`
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

	await tx.spellMechanic.deleteMany({
		where: {
			slug: {
				notIn: mechanicSlugs
			}
		}
	});

	await tx.spellMechanicCategory.deleteMany({
		where: {
			slug: {
				notIn: categorySlugs
			},
			mechanics: {
				none: {}
			}
		}
	});
}

function resolveSeedConfig(
	value: unknown,
	context: SeedContext
): Prisma.InputJsonValue {
	if (Array.isArray(value)) {
		return value.map(item => resolveSeedConfig(item, context));
	}

	if (!isRecord(value)) {
		return value as Prisma.InputJsonValue;
	}

	if (value.kind === 'mechanicParameter') {
		const parameterSlug = readString(value, 'parameterSlug');
		return {
			kind: 'mechanicParameter',
			parameterId: requireMapValue(
				context.parametersBySlug,
				parameterSlug,
				`Spell mechanic parameter seed not found: ${parameterSlug}`
			)
		};
	}

	if (value.kind === 'actionResult') {
		const actionSlug = readString(value, 'actionSlug');
		const resultName = readString(value, 'resultName');
		return {
			kind: 'actionResult',
			actionId: requireMapValue(
				context.actionsBySlug,
				actionSlug,
				`Spell mechanic action seed not found: ${actionSlug}`
			),
			resultName
		};
	}

	const nestedContext = {
		...context,
		actionsBySlug: new Map(context.actionsBySlug)
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
					const actionSlug = readString(action, 'slug');
					nestedContext.actionsBySlug.set(
						actionSlug,
						stableSeedUuid(
							`spell-mechanic-action:${context.mechanicSlug}:${actionSlug}`
						)
					);
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
		throw new Error(
			'Spell mechanic text template segment seed must be an object.'
		);
	}

	if (value.kind === 'text') {
		return {
			kind: 'text',
			text: readString(value, 'text')
		};
	}

	if (value.kind === 'parameter') {
		const parameterSlug = readString(value, 'parameterSlug');
		return {
			kind: 'parameter',
			parameterId: requireMapValue(
				context.parametersBySlug,
				parameterSlug,
				`Spell mechanic parameter seed not found: ${parameterSlug}`
			)
		};
	}

	if (value.kind === 'actionResult') {
		const actionSlug = readString(value, 'actionSlug');
		return {
			kind: 'actionResult',
			actionId: requireMapValue(
				context.actionsBySlug,
				actionSlug,
				`Spell mechanic action seed not found: ${actionSlug}`
			),
			resultName: readString(value, 'resultName')
		};
	}

	if (value.kind === 'applicationText') {
		return {
			kind: 'applicationText'
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
	const seedSlug = readString(value, 'slug');
	const id = requireMapValue(
		context.actionsBySlug,
		seedSlug,
		`Nested spell mechanic action seed not found: ${seedSlug}`
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

function stableSeedUuid(value: string) {
	const bytes = createHash('sha256').update(value).digest().subarray(0, 16);
	bytes[6] = (bytes[6] & 0x0f) | 0x50;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = bytes.toString('hex');

	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		hex.slice(12, 16),
		hex.slice(16, 20),
		hex.slice(20)
	].join('-');
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

function toParameterKind(kind: SpellMechanicParameterContent['kind']) {
	const kinds = {
		target: 'TARGET',
		skill: 'SKILL',
		number: 'NUMBER',
		formula: 'FORMULA',
		damageType: 'DAMAGE_TYPE',
		condition: 'CONDITION',
		systemValue: 'SYSTEM_VALUE',
		text: 'TEXT'
	} satisfies Record<
		SpellMechanicParameterContent['kind'],
		SpellMechanicParameterKind
	>;

	return kinds[kind];
}

function toParameterDefaultMode(
	mode: SpellMechanicParameterContent['defaultValue']['mode']
) {
	const modes = {
		empty: 'EMPTY',
		static: 'STATIC',
		fromMagicWord: 'FROM_MAGIC_WORD'
	} satisfies Record<
		SpellMechanicParameterContent['defaultValue']['mode'],
		SpellMechanicParameterDefaultMode
	>;

	return modes[mode];
}

function toNumericRole(
	role: SpellMechanicParameterContent['numericRole'] | undefined,
	kind: SpellMechanicParameterContent['kind']
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
	} satisfies Record<
		NonNullable<SpellMechanicParameterContent['numericRole']>,
		SpellMechanicNumericRole
	>;

	return roles[role ?? 'custom'];
}

function toParameterScope(
	parameter: SpellMechanicParameterContent
): SpellMechanicParameterScope {
	if (parameter.scope) {
		const scopes = {
			caster: 'CASTER',
			target: 'TARGET',
			spell: 'SPELL',
			effect: 'EFFECT',
			environment: 'ENVIRONMENT'
		} satisfies Record<
			NonNullable<SpellMechanicParameterContent['scope']>,
			SpellMechanicParameterScope
		>;

		return scopes[parameter.scope];
	}

	const normalized = parameter.name.toLocaleLowerCase('ru');

	if (parameter.kind === 'target') {
		return SpellMechanicParameterScope.TARGET;
	}

	if (parameter.kind === 'skill') {
		if (normalized.includes('защит')) {
			return SpellMechanicParameterScope.TARGET;
		}

		if (normalized.includes('атак')) {
			return SpellMechanicParameterScope.CASTER;
		}
	}

	if (parameter.kind === 'damageType' || parameter.kind === 'condition') {
		return SpellMechanicParameterScope.EFFECT;
	}

	return SpellMechanicParameterScope.SPELL;
}

function toActionKind(kind: SpellMechanicActionContent['kind']) {
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
	} satisfies Record<
		SpellMechanicActionContent['kind'],
		SpellMechanicActionKind
	>;

	return kinds[kind];
}
