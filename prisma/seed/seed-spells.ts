import { randomUUID } from 'crypto';
import { readdirSync } from 'fs';
import { join } from 'path';
import { MagicWordType, Prisma, SpellStatus } from '../__generated__/index.js';
import type {
	GroupedContentDocument,
	MagicWordRef,
	SpellContent,
	SpellTextBlockContent
} from '../content/content-types';
import { readContent } from './content';

type SpellContentModule = GroupedContentDocument<{ spells: SpellContent[] }>;

type MechanicLookup = {
	id: string;
	parameterSlugs: Set<string>;
};

const SPELL_CONTENT_DIR = 'spells';
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

export async function seedSpells(tx: Prisma.TransactionClient) {
	const files = readdirSync(join(__dirname, '..', 'content', SPELL_CONTENT_DIR))
		.filter(file => file.endsWith('.ts') && file !== 'content-types.ts')
		.sort((left, right) => left.localeCompare(right));

	for (const file of files) {
		const content = readContent<SpellContentModule>(
			`${SPELL_CONTENT_DIR}/${file}`
		);

		for (const [index, seed] of content.spells.entries()) {
			assertSpellAuthoringFormat(seed, `${file}:spells[${index}]`);
			await seedSpell(tx, seed, seed.sortOrder ?? index);
		}
	}
}

async function seedSpell(
	tx: Prisma.TransactionClient,
	seed: SpellContent,
	sortOrder: number
) {
	const action = await findMagicWord(tx, seed.formula.action);
	const essence = await findMagicWord(tx, seed.formula.essence);
	const gesture = await findMagicWord(tx, seed.formula.gesture);
	const status = toSpellStatus(seed.status);
	const existing = await tx.spell.findUnique({
		select: { id: true },
		where: {
			actionId_essenceId_gestureId: {
				actionId: action.id,
				essenceId: essence.id,
				gestureId: gesture.id
			}
		}
	});
	const data = {
		actionId: action.id,
		essenceId: essence.id,
		gestureId: gesture.id,
		name: seed.name,
		description: seed.description?.trim() || null,
		targetConfigs: seed.targetConfigs,
		textBlocks: [],
		status,
		isActive: status === SpellStatus.READY,
		sortOrder
	} satisfies Prisma.SpellUncheckedCreateInput;
	const spell = existing
		? await tx.spell.update({
				select: { id: true },
				where: { id: existing.id },
				data
		  })
		: await tx.spell.create({
				select: { id: true },
				data
		  });

	await tx.spellMechanicBlock.deleteMany({ where: { spellId: spell.id } });

	const mechanicBlocksBySlug = new Map<string, string>();

	for (const [index, blockSeed] of seed.mechanicBlocks.entries()) {
		const mechanic = await findMechanic(tx, blockSeed.mechanicRef.slug);
		const block = await tx.spellMechanicBlock.create({
			select: { id: true },
			data: {
				spellId: spell.id,
				mechanicId: mechanic.id,
				parameterValues: resolveParameterValues(
					blockSeed.parameters,
					mechanic.parameterSlugs
				),
				config: (blockSeed.config ?? {}) as Prisma.InputJsonValue,
				isActive: blockSeed.isActive ?? true,
				sortOrder: blockSeed.sortOrder ?? index
			}
		});

		mechanicBlocksBySlug.set(blockSeed.mechanicRef.slug, block.id);
	}

	await tx.spell.update({
		where: { id: spell.id },
		data: {
			textBlocks: seed.textBlocks.map((block, index) =>
				resolveTextBlock(block, index, mechanicBlocksBySlug)
			)
		}
	});
}

async function findMagicWord(
	tx: Prisma.TransactionClient,
	ref: MagicWordRef
) {
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
		throw new Error(`Magic word content reference not found: ${ref.type}:${ref.slug}`);
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
		parameterSlugs: new Set(mechanic.parameters.map(parameter => parameter.slug))
	};
}

function resolveParameterValues(
	values: Record<string, unknown>,
	parameterSlugs: Set<string>
): Prisma.InputJsonObject {
	const result: Record<string, Prisma.InputJsonValue> = {};

	for (const [slug, value] of Object.entries(values)) {
		if (!parameterSlugs.has(slug)) {
			throw new Error(`Spell parameter content reference not found: ${slug}`);
		}

		result[slug] = resolveParameterValue(value, parameterSlugs);
	}

	return result as Prisma.InputJsonObject;
}

function resolveParameterValue(
	value: unknown,
	parameterSlugs: Set<string>
): Prisma.InputJsonValue {
	if (Array.isArray(value)) {
		return value.map(item => resolveParameterValue(item, parameterSlugs));
	}

	if (!isRecord(value)) {
		return value as Prisma.InputJsonValue;
	}

	const result: Record<string, Prisma.InputJsonValue> = {};

	for (const [key, item] of Object.entries(value)) {
		result[key] = resolveParameterValue(item, parameterSlugs);
	}

	return result as Prisma.InputJsonObject;
}

function resolveTextBlock(
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
		throw new Error(`Spell text block mechanic reference not found: ${block.mechanic}`);
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

function toMagicWordType(type: keyof typeof MagicWordType) {
	return MagicWordType[type];
}

function toSpellStatus(status: keyof typeof SpellStatus) {
	return SpellStatus[status];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertSpellAuthoringFormat(value: unknown, path: string) {
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
