import {
	SpellTextBlock,
	SpellTextBlockKind
} from '../../../../../domain/spell.models';
import { SpellDraft } from '../../models/spell-detail-page.types';
import { createSpellTextBlockDraft } from '../../read-model/spell-mechanic-draft.helpers';

export function addSpellTextBlockCommand(
	draft: SpellDraft,
	kind: SpellTextBlockKind,
	id: string
): Partial<SpellDraft> {
	return {
		textBlocks: [
			...draft.textBlocks,
			createSpellTextBlockDraft(kind, draft.textBlocks.length, {
				id,
				mechanicBlockId: draft.mechanicBlocks[0]?.id ?? ''
			})
		]
	};
}

export function addSpellMechanicTextBlocksCommand(
	draft: SpellDraft,
	ids: string[]
): Partial<SpellDraft> | null {
	const existingMechanicBlockIds = new Set(
		draft.textBlocks
			.filter(block => block.kind === 'mechanicText')
			.map(block => block.mechanicBlockId)
	);
	const missingBlocks = draft.mechanicBlocks
		.filter(block => !existingMechanicBlockIds.has(block.id))
		.map((block, index) =>
			createSpellTextBlockDraft(
				'mechanicText',
				draft.textBlocks.length + index,
				{
					id: ids[index] ?? '',
					mechanicBlockId: block.id
				}
			)
		);

	if (!missingBlocks.length) {
		return null;
	}

	return {
		textBlocks: [...draft.textBlocks, ...missingBlocks]
	};
}

export function updateSpellTextBlockCommand(
	draft: SpellDraft,
	blockId: string,
	patch: Partial<SpellTextBlock>
): Partial<SpellDraft> {
	return {
		textBlocks: draft.textBlocks.map(block =>
			block.id === blockId ? { ...block, ...patch } : block
		)
	};
}

export function deleteSpellTextBlockCommand(
	draft: SpellDraft,
	blockId: string
): Partial<SpellDraft> {
	return {
		textBlocks: draft.textBlocks
			.filter(block => block.id !== blockId)
			.map((block, index) => ({ ...block, sortOrder: index }))
	};
}

export function moveSpellTextBlockCommand(
	draft: SpellDraft,
	index: number,
	direction: -1 | 1
): Partial<SpellDraft> | null {
	const nextIndex = index + direction;

	if (nextIndex < 0 || nextIndex >= draft.textBlocks.length) {
		return null;
	}

	const blocks = [...draft.textBlocks];
	const current = blocks[index];
	const next = blocks[nextIndex];

	if (!current || !next) {
		return null;
	}

	blocks[index] = next;
	blocks[nextIndex] = current;

	return {
		textBlocks: blocks.map((block, blockIndex) => ({
			...block,
			sortOrder: blockIndex
		}))
	};
}
