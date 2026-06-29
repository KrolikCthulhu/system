import { createHash, randomUUID } from 'crypto';
import {
	MagicWordType,
	Prisma,
	SpellStatus
} from '../../__generated__/index.js';
import type {
	MagicWordRef,
	SpellContent,
	SpellMechanicBlockContent,
	SpellTextBlockContent
} from '../../content/content-types';

type TargetConfigLookup = Map<string, string>;
type SystemValueLookup = Map<string, string>;
type SkillLookup = Map<string, string>;
type DamageTypeLookup = Map<string, string>;
type ConditionLookup = Map<string, string>;

type MechanicLookup = {
	id: string;
	parameterSlugs: Set<string>;
};

export type SpellContentReferenceResolver = {
	targetConfigsBySlug: TargetConfigLookup;
	systemValuesBySlug: SystemValueLookup;
	skillsBySlug: SkillLookup;
	damageTypesBySlug: DamageTypeLookup;
	conditionsBySlug: ConditionLookup;
};

export type CompiledSpellMechanicBlockContent = {
	contentSlug: string;
	data: Omit<Prisma.SpellMechanicBlockUncheckedCreateInput, 'spellId'>;
};

export type CompiledSpellContent = {
	spellData: Prisma.SpellUncheckedCreateInput;
	mechanicBlocks: CompiledSpellMechanicBlockContent[];
	textBlocks: (
		mechanicBlocksBySlug: Map<string, string>
	) => Prisma.InputJsonObject[];
};

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORBIDDEN_AUTHORING_KEYS = new Set([
	'id',
	'actionId',
	'essenceId',
	'gestureId',
	'mechanicId',
	'parameterId',
	'targetConfigId',
	'targetCountParameterId',
	'mechanicBlockId'
]);

export async function compileSpellContent(
	tx: Prisma.TransactionClient,
	seed: SpellContent,
	sortOrder: number
): Promise<CompiledSpellContent> {
	const action = await findMagicWord(tx, seed.formula.action);
	const essence = await findMagicWord(tx, seed.formula.essence);
	const gesture = await findMagicWord(tx, seed.formula.gesture);
	const status = toSpellStatus(seed.status);
	const resolver = await createSpellContentReferenceResolver(tx, seed);

	return {
		spellData: {
			actionId: action.id,
			essenceId: essence.id,
			gestureId: gesture.id,
			name: seed.name,
			description: seed.description?.trim() || null,
			targetConfigs: compileSpellTargetConfigs(seed),
			textBlocks: [],
			status,
			isActive: status === SpellStatus.READY,
			sortOrder
		},
		mechanicBlocks: await compileSpellMechanicBlocks(tx, seed, resolver),
		textBlocks: mechanicBlocksBySlug =>
			seed.textBlocks.map((block, index) =>
				compileSpellTextBlock(block, index, mechanicBlocksBySlug)
			)
	};
}

export async function createSpellContentReferenceResolver(
	tx: Prisma.TransactionClient,
	seed: SpellContent
): Promise<SpellContentReferenceResolver> {
	return {
		targetConfigsBySlug: createTargetConfigLookup(seed.targetConfigs, seed),
		systemValuesBySlug: await createSystemValueLookup(tx),
		skillsBySlug: await createSkillLookup(tx),
		damageTypesBySlug: await createDamageTypeLookup(tx),
		conditionsBySlug: await createConditionLookup(tx)
	};
}

export function compileSpellTargetConfigs(
	seed: SpellContent
): Prisma.InputJsonValue[] {
	return seed.targetConfigs.map((target, index) => {
		if (!isRecord(target)) {
			return target;
		}

		const slug = readTargetConfigSlug(target, index, seed);

		return {
			...target,
			id: stableSeedUuid(
				`spell-target:${seed.formulaName ?? seed.name}:${slug}`
			),
			slug,
			sortOrder:
				typeof target['sortOrder'] === 'number' ? target['sortOrder'] : index
		};
	}) as Prisma.InputJsonValue[];
}

export async function compileSpellMechanicBlocks(
	tx: Prisma.TransactionClient,
	seed: SpellContent,
	resolver: SpellContentReferenceResolver
): Promise<CompiledSpellMechanicBlockContent[]> {
	const blocks: CompiledSpellMechanicBlockContent[] = [];

	for (const [index, blockSeed] of seed.mechanicBlocks.entries()) {
		blocks.push(
			await compileSpellMechanicBlock(tx, blockSeed, index, resolver)
		);
	}

	return blocks;
}

export async function compileSpellMechanicBlock(
	tx: Prisma.TransactionClient,
	blockSeed: SpellMechanicBlockContent,
	index: number,
	resolver: SpellContentReferenceResolver
): Promise<CompiledSpellMechanicBlockContent> {
	const mechanic = await findMechanic(tx, blockSeed.mechanicRef.slug);

	return {
		contentSlug: blockSeed.mechanicRef.slug,
		data: {
			mechanicId: mechanic.id,
			parameterValues: compileSpellParameterValues(
				blockSeed.parameters,
				mechanic.parameterSlugs,
				resolver
			),
			config: (blockSeed.config ?? {}) as Prisma.InputJsonValue,
			isActive: blockSeed.isActive ?? true,
			sortOrder: blockSeed.sortOrder ?? index
		}
	};
}

export function compileSpellParameterValues(
	values: Record<string, unknown>,
	parameterSlugs: Set<string>,
	resolver: SpellContentReferenceResolver
): Prisma.InputJsonObject {
	const result: Record<string, Prisma.InputJsonValue> = {};

	for (const [slug, value] of Object.entries(values)) {
		if (!parameterSlugs.has(slug)) {
			throw new Error(`Spell parameter content reference not found: ${slug}`);
		}

		result[slug] = compileSpellParameterValue(value, parameterSlugs, resolver);
	}

	return result as Prisma.InputJsonObject;
}

export function compileSpellTextBlock(
	block: SpellTextBlockContent,
	index: number,
	mechanicBlocksBySlug: Map<string, string>
): Prisma.InputJsonObject {
	if (block.kind === 'text') {
		return {
			id: randomUUID(),
			kind: block.kind,
			text: block.text,
			mechanicBlockId: '',
			isActive: block.isActive ?? true,
			sortOrder: block.sortOrder ?? index
		};
	}

	const mechanicBlockId = mechanicBlocksBySlug.get(block.mechanic);

	if (!mechanicBlockId) {
		throw new Error(
			`Spell text block mechanic reference not found: ${block.mechanic}`
		);
	}

	return {
		id: randomUUID(),
		kind: block.kind,
		text: block.text ?? '',
		mechanicBlockId,
		isActive: block.isActive ?? true,
		sortOrder: block.sortOrder ?? index
	};
}

export function assertSpellAuthoringFormat(value: unknown, path: string) {
	if (typeof value === 'string') {
		if (UUID_PATTERN.test(value)) {
			throw new Error(
				`Spell content must use slug references, UUID found at ${path}.`
			);
		}

		return;
	}

	if (Array.isArray(value)) {
		value.forEach((item, index) =>
			assertSpellAuthoringFormat(item, `${path}[${index}]`)
		);
		return;
	}

	if (!isRecord(value)) {
		return;
	}

	for (const [key, item] of Object.entries(value)) {
		if (FORBIDDEN_AUTHORING_KEYS.has(key)) {
			throw new Error(
				`Spell content must not contain internal id field "${key}" at ${path}.`
			);
		}

		assertSpellAuthoringFormat(item, `${path}.${key}`);
	}
}

function compileSpellParameterValue(
	value: unknown,
	parameterSlugs: Set<string>,
	resolver: SpellContentReferenceResolver
): Prisma.InputJsonValue {
	if (Array.isArray(value)) {
		return value.map(item =>
			compileSpellParameterValue(item, parameterSlugs, resolver)
		);
	}

	if (!isRecord(value)) {
		return value as Prisma.InputJsonValue;
	}

	if (value.kind === 'targetConfigRef') {
		const targetSlug = typeof value.target === 'string' ? value.target : '';
		const targetId = resolver.targetConfigsBySlug.get(targetSlug);

		if (!targetId) {
			throw new Error(
				`Spell target config content reference not found: ${targetSlug}`
			);
		}

		return targetId;
	}

	if (value.kind === 'skillRef') {
		return resolveLookupRef(value, 'slug', resolver.skillsBySlug, 'Skill');
	}

	if (value.kind === 'damageTypeRef') {
		return resolveLookupRef(
			value,
			'slug',
			resolver.damageTypesBySlug,
			'Damage type'
		);
	}

	if (value.kind === 'conditionRef') {
		return resolveLookupRef(
			value,
			'slug',
			resolver.conditionsBySlug,
			'Condition'
		);
	}

	if (value.kind === 'magicWordLinkedSkill') {
		return resolveNestedLookupRef(
			value,
			'defaultSkill',
			resolver.skillsBySlug,
			'Skill'
		);
	}

	if (value.kind === 'magicWordLinkedDamageType') {
		return resolveNestedLookupRef(
			value,
			'defaultDamageType',
			resolver.damageTypesBySlug,
			'Damage type'
		);
	}

	if (value.kind === 'magicWordLinkedCondition') {
		return resolveNestedLookupRef(
			value,
			'defaultCondition',
			resolver.conditionsBySlug,
			'Condition'
		);
	}

	const result: Record<string, Prisma.InputJsonValue> = {};

	for (const [key, item] of Object.entries(value)) {
		if (
			key === 'sourceKey' &&
			value['sourceKind'] === 'systemValue' &&
			typeof item === 'string'
		) {
			result[key] = resolver.systemValuesBySlug.get(item) ?? item;
			continue;
		}

		result[key] = compileSpellParameterValue(item, parameterSlugs, resolver);
	}

	return result as Prisma.InputJsonObject;
}

function resolveLookupRef(
	value: Record<string, unknown>,
	key: string,
	lookup: Map<string, string>,
	label: string
) {
	const slug = typeof value[key] === 'string' ? value[key] : '';
	const id = lookup.get(slug);

	if (!id) {
		throw new Error(`${label} content reference not found: ${slug}`);
	}

	return id;
}

function resolveNestedLookupRef(
	value: Record<string, unknown>,
	key: string,
	lookup: Map<string, string>,
	label: string
) {
	const nested = isRecord(value[key]) ? value[key] : {};

	return resolveLookupRef(nested, 'slug', lookup, label);
}

async function createSystemValueLookup(
	tx: Prisma.TransactionClient
): Promise<SystemValueLookup> {
	const values = await tx.systemValue.findMany({
		select: {
			id: true,
			slug: true
		}
	});

	return new Map(values.map(value => [value.slug, value.id]));
}

async function createSkillLookup(
	tx: Prisma.TransactionClient
): Promise<SkillLookup> {
	const values = await tx.skill.findMany({
		select: {
			id: true,
			slug: true
		}
	});

	return new Map(values.map(value => [value.slug, value.id]));
}

async function createDamageTypeLookup(
	tx: Prisma.TransactionClient
): Promise<DamageTypeLookup> {
	const values = await tx.damageType.findMany({
		select: {
			id: true,
			slug: true
		}
	});

	return new Map(values.map(value => [value.slug, value.id]));
}

async function createConditionLookup(
	tx: Prisma.TransactionClient
): Promise<ConditionLookup> {
	const values = await tx.condition.findMany({
		select: {
			id: true,
			slug: true
		}
	});

	return new Map(values.map(value => [value.slug, value.id]));
}

async function findMagicWord(tx: Prisma.TransactionClient, ref: MagicWordRef) {
	const word = await tx.magicWord.findUnique({
		select: { id: true },
		where: {
			type_slug: {
				type: toMagicWordType(ref.type),
				slug: ref.slug
			}
		}
	});

	if (!word) {
		throw new Error(
			`Magic word content reference not found: ${ref.type}:${ref.slug}`
		);
	}

	return word;
}

async function findMechanic(
	tx: Prisma.TransactionClient,
	slug: string
): Promise<MechanicLookup> {
	const mechanic = await tx.spellMechanic.findUnique({
		select: {
			id: true,
			parameters: {
				select: {
					id: true,
					slug: true
				}
			}
		},
		where: { slug }
	});

	if (!mechanic) {
		throw new Error(`Spell mechanic content reference not found: ${slug}`);
	}

	return {
		id: mechanic.id,
		parameterSlugs: new Set(
			mechanic.parameters.map(parameter => parameter.slug)
		)
	};
}

function createTargetConfigLookup(
	targetConfigs: Prisma.InputJsonValue[],
	seed: SpellContent
): TargetConfigLookup {
	const result: TargetConfigLookup = new Map();

	for (const [index, target] of targetConfigs.entries()) {
		if (!isRecord(target)) {
			continue;
		}

		const slug = readTargetConfigSlug(target, index, seed);
		result.set(
			slug,
			stableSeedUuid(`spell-target:${seed.formulaName ?? seed.name}:${slug}`)
		);
	}

	return result;
}

function readTargetConfigSlug(
	target: Record<string, unknown>,
	index: number,
	seed: SpellContent
) {
	const slug =
		typeof target.slug === 'string' && target.slug ? target.slug : '';

	if (!slug) {
		throw new Error(
			`Spell target config slug is required: ${seed.formulaName ?? seed.name} #${index + 1}`
		);
	}

	return slug;
}

function stableSeedUuid(value: string) {
	const bytes = createHash('sha256').update(value).digest().subarray(0, 16);
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
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

function toMagicWordType(type: keyof typeof MagicWordType) {
	return MagicWordType[type];
}

function toSpellStatus(status: keyof typeof SpellStatus) {
	return SpellStatus[status];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
