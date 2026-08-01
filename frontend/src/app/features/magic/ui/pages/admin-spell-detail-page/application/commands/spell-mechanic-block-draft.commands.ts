import { SpellMechanic } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { MagicWord } from '../../../../../domain/magic-word.models';
import {
	SpellMechanicApplicationConfig,
	SpellMechanicBlockConfig,
	SpellTextBlock,
	SpellTextBlockKind
} from '../../../../../domain/spell.models';
import { parameterStorageKey } from '../../mappers/spell-detail-draft.mapper';
import {
	SpellDraft,
	SpellMechanicBlockDraft
} from '../../models/spell-detail-page.types';
import { readSpellEffectScaleConfig } from '../../read-model/spell-effect-scale-config.mapper';
import { createStaticParameterValue } from '../../utils/spell-numeric-parameter.utils';
import { createTargetConfigFromMechanicDefault } from '../../utils/spell-target-config.utils';

export function createMechanicBlockDraft(
	mechanic: SpellMechanic,
	sortOrder: number,
	essence: MagicWord | null,
	targetIdsByParameterId: Record<string, string>,
	id: string = crypto.randomUUID()
): SpellMechanicBlockDraft {
	return {
		id,
		mechanicId: mechanic.id,
		parameterValues: Object.fromEntries(
			mechanic.parameters.map(parameter => [
				parameterStorageKey(parameter),
				defaultParameterValue(parameter, essence, targetIdsByParameterId)
			])
		),
		config: createMechanicBlockConfig(mechanic),
		isActive: true,
		sortOrder
	};
}

export function createSpellTextBlockDraft(
	kind: SpellTextBlockKind,
	sortOrder: number,
	options: { id: string; mechanicBlockId?: string; text?: string }
): SpellTextBlock {
	return {
		id: options.id,
		kind,
		text: options.text ?? '',
		mechanicBlockId: options.mechanicBlockId ?? '',
		isActive: true,
		sortOrder
	};
}

export function createMechanicBlockConfig(
	mechanic: SpellMechanic
): SpellMechanicBlockConfig {
	const effectScaleAction = mechanic.actions.find(
		action => action.kind === 'effectScale'
	);
	const defaultApplication = normalizeApplicationConfig(
		readDefaultApplicationConfig(mechanic.configSchema)
	);
	const config: SpellMechanicBlockConfig = {
		application: defaultApplication
	};

	if (effectScaleAction) {
		config.effectScale = readSpellEffectScaleConfig(effectScaleAction.config);
	}

	return config;
}

export function readDefaultApplicationConfig(
	configSchema: Record<string, unknown>
): Partial<SpellMechanicApplicationConfig> | null {
	const value = configSchema['defaultApplication'];

	return isRecord(value) ? value : null;
}

export function normalizeApplicationConfig(
	value: Partial<SpellMechanicApplicationConfig> | null | undefined
): SpellMechanicApplicationConfig {
	return {
		visibilityRequired:
			typeof value?.visibilityRequired === 'boolean'
				? value.visibilityRequired
				: true,
		lineOfEffectRequired:
			typeof value?.lineOfEffectRequired === 'boolean'
				? value.lineOfEffectRequired
				: false
	};
}

export function createMechanicBlockPatch(
	draft: SpellDraft,
	mechanic: SpellMechanic,
	essence: MagicWord | null,
	options: {
		blockId: string;
		insertIndex?: number;
	}
): Pick<SpellDraft, 'mechanicBlocks' | 'targetConfigs'> {
	const insertIndex = options.insertIndex ?? draft.mechanicBlocks.length;
	const createdTargets = mechanic.parameters
		.filter(
			parameter => parameter.kind === 'target' && parameter.defaultTargetConfig
		)
		.map((parameter, index) => ({
			parameterId: parameter.id,
			target: createTargetConfigFromMechanicDefault(
				parameter.defaultTargetConfig as NonNullable<
					typeof parameter.defaultTargetConfig
				>,
				draft.targetConfigs.length + index
			)
		}));
	const targetIdsByParameterId = Object.fromEntries(
		createdTargets.map(item => [item.parameterId, item.target.id])
	);
	const block = createMechanicBlockDraft(
		mechanic,
		insertIndex,
		essence,
		targetIdsByParameterId,
		options.blockId
	);
	const nextBlocks = [...draft.mechanicBlocks];
	nextBlocks.splice(insertIndex, 0, block);

	return {
		targetConfigs: [
			...draft.targetConfigs,
			...createdTargets.map(item => item.target)
		].map((target, index) => ({ ...target, sortOrder: index })),
		mechanicBlocks: nextBlocks.map((item, index) => ({
			...item,
			sortOrder: index
		}))
	};
}

export function replaceMechanicBlockCommand(
	draft: SpellDraft,
	index: number,
	mechanic: SpellMechanic,
	essence: MagicWord | null
): Partial<SpellDraft> | null {
	const existingBlock = draft.mechanicBlocks[index];

	if (!existingBlock) {
		return null;
	}

	return createMechanicBlockPatch(
		{
			...draft,
			mechanicBlocks: draft.mechanicBlocks.filter(
				(_, blockIndex) => blockIndex !== index
			)
		},
		mechanic,
		essence,
		{
			blockId: existingBlock.id,
			insertIndex: index
		}
	);
}

export function moveMechanicBlockCommand(
	draft: SpellDraft,
	index: number,
	direction: -1 | 1
): Partial<SpellDraft> | null {
	const nextIndex = index + direction;

	if (nextIndex < 0 || nextIndex >= draft.mechanicBlocks.length) {
		return null;
	}

	const blocks = draft.mechanicBlocks.slice();
	const current = blocks[index];
	const next = blocks[nextIndex];

	if (!current || !next) {
		return null;
	}

	blocks[index] = next;
	blocks[nextIndex] = current;

	return {
		mechanicBlocks: blocks.map((block, blockIndex) => ({
			...block,
			sortOrder: blockIndex
		}))
	};
}

export function updateMechanicBlockActiveCommand(
	draft: SpellDraft,
	index: number,
	isActive: boolean
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[index];

	return block
		? updateMechanicBlockCommand(draft, index, { ...block, isActive })
		: null;
}

export function updateMechanicBlockApplicationCommand(
	draft: SpellDraft,
	index: number,
	application: SpellMechanicApplicationConfig,
	patch: Partial<SpellMechanicApplicationConfig>
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[index];

	return block
		? updateMechanicBlockCommand(draft, index, {
				...block,
				config: {
					...block.config,
					application: {
						...application,
						...patch
					}
				}
			})
		: null;
}

export function deleteMechanicBlockCommand(
	draft: SpellDraft,
	index: number
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[index];

	if (!block) {
		return null;
	}

	return {
		mechanicBlocks: draft.mechanicBlocks
			.filter((_, blockIndex) => blockIndex !== index)
			.map((item, blockIndex) => ({ ...item, sortOrder: blockIndex })),
		textBlocks: draft.textBlocks
			.filter(textBlock => textBlock.mechanicBlockId !== block.id)
			.map((textBlock, blockIndex) => ({
				...textBlock,
				sortOrder: blockIndex
			}))
	};
}

export function defaultParameterValue(
	parameter: SpellMechanic['parameters'][number],
	essence: MagicWord | null,
	targetIdsByParameterId: Record<string, string>
) {
	if (parameter.kind === 'target') {
		return targetIdsByParameterId[parameter.id] ?? '';
	}

	if (parameter.kind === 'number' || parameter.kind === 'formula') {
		return createStaticParameterValue(
			parameter.defaultValue.mode === 'static'
				? parameter.defaultValue.value
				: ''
		);
	}

	if (parameter.defaultValue.mode === 'static') {
		return parameter.defaultValue.value;
	}

	if (parameter.defaultValue.mode !== 'fromMagicWord' || !essence) {
		return '';
	}

	switch (parameter.kind) {
		case 'skill':
			return essence.skillIds[0] ?? '';
		case 'damageType':
			return essence.damageTypeIds[0] ?? '';
		case 'condition':
			return essence.conditionIds[0] ?? '';
		default:
			return '';
	}
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
