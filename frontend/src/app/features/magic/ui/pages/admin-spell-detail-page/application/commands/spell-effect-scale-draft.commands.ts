import { SpellMechanic } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { MagicWord } from '../../../../../domain/magic-word.models';
import {
	SpellEffectScaleConfig,
	SpellEffectScaleItemConfig
} from '../../../../../domain/spell.models';
import { parameterStorageKey as mechanicParameterStorageKey } from '../../mappers/spell-detail-draft.mapper';
import {
	SpellDraft,
	SpellMechanicBlockDraft
} from '../../models/spell-detail-page.types';
import { readSpellEffectScaleConfig } from '../../read-model/spell-effect-scale-config.mapper';
import { SpellParameterValue } from '../../utils/spell-numeric-parameter.utils';
import { createMechanicBlockDraft } from './spell-mechanic-block-draft.commands';

export function updateEffectScaleConfigCommand(
	draft: SpellDraft,
	blockId: string,
	patch: Partial<SpellEffectScaleConfig>
): Partial<SpellDraft> | null {
	const index = draft.mechanicBlocks.findIndex(item => item.id === blockId);
	const currentBlock = draft.mechanicBlocks[index];

	if (index < 0 || !currentBlock) {
		return null;
	}

	return updateMechanicBlockCommand(draft, index, {
		...currentBlock,
		config: {
			...currentBlock.config,
			effectScale: {
				...readSpellEffectScaleConfig(currentBlock.config['effectScale']),
				...patch
			}
		}
	});
}

export function updateEffectScaleItemCommand(
	draft: SpellDraft,
	blockId: string,
	itemId: string,
	patch: Partial<SpellEffectScaleItemConfig>
): Partial<SpellDraft> | null {
	const config = effectScaleConfigForBlock(draft, blockId);

	if (!config) {
		return null;
	}

	return updateEffectScaleConfigCommand(draft, blockId, {
		items: config.items.map(item =>
			item.id === itemId ? { ...item, ...patch } : item
		)
	});
}

export function addEffectScaleNestedMechanicCommand(
	draft: SpellDraft,
	blockId: string,
	itemId: string,
	mechanic: SpellMechanic,
	essence: MagicWord | null
): Partial<SpellDraft> | null {
	const item = effectScaleConfigForBlock(draft, blockId)?.items.find(
		value => value.id === itemId
	);

	if (!item) {
		return null;
	}

	return updateEffectScaleItemCommand(draft, blockId, itemId, {
		mechanicBlocks: [
			...item.mechanicBlocks,
			createMechanicBlockDraft(
				mechanic,
				item.mechanicBlocks.length,
				essence,
				{}
			)
		]
	});
}

export function updateEffectScaleNestedMechanicCommand(
	draft: SpellDraft,
	blockId: string,
	itemId: string,
	nestedBlockId: string,
	mechanic: SpellMechanic,
	essence: MagicWord | null
): Partial<SpellDraft> | null {
	const item = effectScaleConfigForBlock(draft, blockId)?.items.find(
		value => value.id === itemId
	);

	if (!item) {
		return null;
	}

	return updateEffectScaleItemCommand(draft, blockId, itemId, {
		mechanicBlocks: item.mechanicBlocks.map((nestedBlock, index) =>
			nestedBlock.id === nestedBlockId
				? createMechanicBlockDraft(mechanic, index, essence, {}, nestedBlock.id)
				: nestedBlock
		)
	});
}

export function updateEffectScaleNestedParameterCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockId: string,
	itemId: string,
	nestedBlockId: string,
	parameterId: string,
	value: SpellParameterValue | null
): Partial<SpellDraft> | null {
	const item = effectScaleConfigForBlock(draft, blockId)?.items.find(
		data => data.id === itemId
	);

	if (!item) {
		return null;
	}

	return updateEffectScaleItemCommand(draft, blockId, itemId, {
		mechanicBlocks: item.mechanicBlocks.map(nestedBlock =>
			nestedBlock.id === nestedBlockId
				? {
						...nestedBlock,
						parameterValues: {
							...nestedBlock.parameterValues,
							[parameterStorageKey(
								nestedBlock as SpellMechanicBlockDraft,
								parameterId,
								mechanics
							)]: value ?? ''
						}
					}
				: nestedBlock
		)
	});
}

export function deleteEffectScaleNestedMechanicCommand(
	draft: SpellDraft,
	blockId: string,
	itemId: string,
	nestedBlockId: string
): Partial<SpellDraft> | null {
	const item = effectScaleConfigForBlock(draft, blockId)?.items.find(
		data => data.id === itemId
	);

	if (!item) {
		return null;
	}

	return updateEffectScaleItemCommand(draft, blockId, itemId, {
		mechanicBlocks: item.mechanicBlocks
			.filter(nestedBlock => nestedBlock.id !== nestedBlockId)
			.map((nestedBlock, index) => ({ ...nestedBlock, sortOrder: index }))
	});
}

function updateMechanicBlockCommand(
	draft: SpellDraft,
	index: number,
	block: SpellMechanicBlockDraft
): Partial<SpellDraft> {
	return {
		mechanicBlocks: draft.mechanicBlocks.map((item, blockIndex) =>
			blockIndex === index ? block : item
		)
	};
}

function effectScaleConfigForBlock(draft: SpellDraft, blockId: string) {
	const block = draft.mechanicBlocks.find(item => item.id === blockId);

	return block ? readSpellEffectScaleConfig(block.config['effectScale']) : null;
}

function parameterStorageKey(
	block: SpellMechanicBlockDraft,
	parameterIdOrSlug: string,
	mechanics: SpellMechanic[]
) {
	const parameter = mechanics
		.find(mechanic => mechanic.id === block.mechanicId)
		?.parameters.find(
			item => item.id === parameterIdOrSlug || item.slug === parameterIdOrSlug
		);

	return parameter ? mechanicParameterStorageKey(parameter) : parameterIdOrSlug;
}
