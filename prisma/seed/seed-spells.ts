import { readdirSync } from 'fs';
import { join } from 'path';
import { Prisma } from '../__generated__/index.js';
import type {
	GroupedContentDocument,
	SpellContent
} from '../content/content-types';
import { readContent } from './content';
import {
	assertSpellAuthoringFormat,
	compileSpellContent
} from './spells/compile-spell-content';

type SpellContentModule = GroupedContentDocument<{ spells: SpellContent[] }>;

const SPELL_CONTENT_DIR = 'spells';

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
	const compiled = await compileSpellContent(tx, seed, sortOrder);
	const existing = await tx.spell.findUnique({
		select: { id: true },
		where: {
			actionId_essenceId_gestureId: {
				actionId: compiled.spellData.actionId,
				essenceId: compiled.spellData.essenceId,
				gestureId: compiled.spellData.gestureId
			}
		}
	});
	const spell = existing
		? await tx.spell.update({
				select: { id: true },
				where: { id: existing.id },
				data: compiled.spellData
			})
		: await tx.spell.create({
				select: { id: true },
				data: compiled.spellData
			});

	await tx.spellMechanicBlock.deleteMany({ where: { spellId: spell.id } });

	const mechanicBlocksBySlug = new Map<string, string>();

	for (const blockSeed of compiled.mechanicBlocks) {
		const block = await tx.spellMechanicBlock.create({
			select: { id: true },
			data: {
				spellId: spell.id,
				...blockSeed.data
			}
		});

		mechanicBlocksBySlug.set(blockSeed.contentSlug, block.id);
	}

	await tx.spell.update({
		where: { id: spell.id },
		data: {
			textBlocks: compiled.textBlocks(mechanicBlocksBySlug)
		}
	});
}
