import {
	ProgressionPreset,
	ProgressionPresetRoundingMode
} from '../../../../../../progression-presets/domain/progression-presets.models';
import {
	SpellMechanic,
	SpellMechanicParameter
} from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { MechanicCalculationGraphState } from '../../../../../../spell-mechanics/ui/mechanic-calculation-graph.models';
import { MagicWord } from '../../../../../domain/magic-word.models';
import { SpellTargetConfig } from '../../../../../domain/spell.models';
import { parameterStorageKey as mechanicParameterStorageKey } from '../../mappers/spell-detail-draft.mapper';
import {
	SpellDraft,
	SpellMechanicBlockDraft,
	SpellParameterValueMode
} from '../../models/spell-detail-page.types';
import {
	createMechanicBlockPatch,
	createSpellTextBlockDraft
} from '../../read-model/spell-mechanic-draft.helpers';
import {
	AutoValueSourceMode,
	createAutoParameterValue,
	createAutoPreset,
	createAutoSourcesForMode,
	createFormulaParameterValue,
	createProgressionParameterValue,
	createStaticParameterValue,
	isAutoParameterValue,
	isProgressionParameterValue,
	parameterValueText,
	ProgressionSourceKind,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellParameterValue,
	SpellProgressionParameterValue
} from '../../utils/spell-numeric-parameter.utils';
import {
	createTargetConfigFromTemplate,
	TargetTemplateId
} from '../../utils/spell-target-config.utils';

export function updateMechanicTargetConfigCommand(
	draft: SpellDraft,
	targetId: string,
	patch: Partial<SpellTargetConfig>
): Partial<SpellDraft> | null {
	if (!targetId) {
		return null;
	}

	return {
		targetConfigs: draft.targetConfigs.map(target =>
			target.id === targetId ? { ...target, ...patch } : target
		)
	};
}

export function updateMechanicTargetTemplateCommand(
	draft: SpellDraft,
	block: SpellMechanicBlockDraft,
	parameter: SpellMechanicParameter,
	templateId: TargetTemplateId,
	targetId: string
): Partial<SpellDraft> | null {
	const blockIndex = draft.mechanicBlocks.findIndex(
		item => item.id === block.id
	);

	if (blockIndex < 0) {
		return null;
	}

	const currentTargetId = rawParameterValue(block, parameter.id, [parameter]);
	const currentTarget =
		draft.targetConfigs.find(target => target.id === currentTargetId) ?? null;
	const nextTarget = createTargetConfigFromTemplate(
		templateId,
		parameter.defaultTargetConfig,
		currentTarget?.id ?? targetId,
		currentTarget?.sortOrder ?? draft.targetConfigs.length,
		currentTarget
	);

	if (!nextTarget) {
		return null;
	}

	const nextTargets = currentTarget
		? draft.targetConfigs.map(target =>
				target.id === currentTarget.id ? nextTarget : target
			)
		: [...draft.targetConfigs, nextTarget];

	return {
		targetConfigs: nextTargets.map((target, index) => ({
			...target,
			sortOrder: index
		})),
		mechanicBlocks: draft.mechanicBlocks.map((item, index) =>
			index === blockIndex
				? {
						...item,
						parameterValues: {
							...item.parameterValues,
							[mechanicParameterStorageKey(parameter)]: nextTarget.id
						}
					}
				: item
		)
	};
}

export function addMechanicBlockCommand(
	draft: SpellDraft,
	mechanic: SpellMechanic,
	essence: MagicWord | null,
	ids: { blockId: string; textBlockId: string }
): Partial<SpellDraft> {
	const patch = createMechanicBlockPatch(draft, mechanic, essence, {
		blockId: ids.blockId
	});

	return {
		...patch,
		textBlocks: [
			...draft.textBlocks,
			createSpellTextBlockDraft('mechanicText', draft.textBlocks.length, {
				id: ids.textBlockId,
				mechanicBlockId:
					patch.mechanicBlocks[draft.mechanicBlocks.length]?.id ?? ''
			})
		]
	};
}

export function updateMechanicBlockParameterCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	value: SpellParameterValue | null
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[blockIndex];

	if (!block) {
		return null;
	}

	const key = parameterStorageKey(block, parameterId, mechanics);

	return updateMechanicBlockCommand(draft, blockIndex, {
		...block,
		parameterValues: {
			...block.parameterValues,
			[key]: value ?? ''
		}
	});
}

export function updateMechanicBlockParameterModeCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	mode: SpellParameterValueMode,
	firstProgressionPreset: ProgressionPreset | null
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[blockIndex];
	const currentValue = block
		? rawParameterValueForMechanics(block, parameterId, mechanics)
		: undefined;
	const nextValue =
		mode === 'progression'
			? createProgressionParameterValue(firstProgressionPreset)
			: mode === 'formula'
				? createFormulaParameterValue()
				: mode === 'auto'
					? createAutoParameterValue()
					: createStaticParameterValue(parameterValueText(currentValue));

	return updateMechanicBlockParameterCommand(
		draft,
		mechanics,
		blockIndex,
		parameterId,
		nextValue
	);
}

export function updateProgressionParameterCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	patch: Partial<SpellProgressionParameterValue>
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[blockIndex];

	if (!block) {
		return null;
	}

	const current = progressionParameterValue(block, parameterId, mechanics);

	if (!current) {
		return null;
	}

	return updateMechanicBlockParameterCommand(
		draft,
		mechanics,
		blockIndex,
		parameterId,
		{
			...current,
			...patch
		}
	);
}

export function updateProgressionPresetCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	presetId: string,
	preset: ProgressionPreset | null
): Partial<SpellDraft> | null {
	return updateProgressionParameterCommand(
		draft,
		mechanics,
		blockIndex,
		parameterId,
		{
			presetId,
			config: { ...(preset?.config ?? {}) }
		}
	);
}

export function updateProgressionConfigCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	key: string,
	value: number | null
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[blockIndex];
	const current = block
		? progressionParameterValue(block, parameterId, mechanics)
		: null;

	if (!current) {
		return null;
	}

	return updateProgressionParameterCommand(
		draft,
		mechanics,
		blockIndex,
		parameterId,
		{
			config: {
				...current.config,
				[key]: value ?? 0
			}
		}
	);
}

export function updateProgressionRoundingModeCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	roundingModeValue: ProgressionPresetRoundingMode
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[blockIndex];
	const current = block
		? progressionParameterValue(block, parameterId, mechanics)
		: null;

	if (!current) {
		return null;
	}

	return updateProgressionParameterCommand(
		draft,
		mechanics,
		blockIndex,
		parameterId,
		{
			config: {
				...current.config,
				roundingMode: roundingModeValue
			}
		}
	);
}

export function updateAutoParameterCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	patch: Partial<SpellAutoParameterValue>
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[blockIndex];

	if (!block) {
		return null;
	}

	const current = autoParameterValue(block, parameterId, mechanics);

	if (!current) {
		return null;
	}

	return updateMechanicBlockParameterCommand(
		draft,
		mechanics,
		blockIndex,
		parameterId,
		{
			...current,
			...patch
		}
	);
}

export function updateAutoSourceModeCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	sourceMode: AutoValueSourceMode
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[blockIndex];
	const current = block
		? autoParameterValue(block, parameterId, mechanics)
		: null;

	if (!current) {
		return null;
	}

	return updateAutoParameterCommand(draft, mechanics, blockIndex, parameterId, {
		sourceMode,
		sources: createAutoSourcesForMode(sourceMode, current.sources)
	});
}

export function addAutoSourceCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	source: SpellAutoParameterSource
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[blockIndex];
	const current = block
		? autoParameterValue(block, parameterId, mechanics)
		: null;

	if (!current) {
		return null;
	}

	return updateAutoParameterCommand(draft, mechanics, blockIndex, parameterId, {
		sources: [...current.sources, source]
	});
}

export function updateAutoSourceCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	sourceId: string,
	patch: Partial<SpellAutoParameterSource>
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[blockIndex];
	const current = block
		? autoParameterValue(block, parameterId, mechanics)
		: null;

	if (!current) {
		return null;
	}

	return updateAutoParameterCommand(draft, mechanics, blockIndex, parameterId, {
		sources: current.sources.map(source =>
			source.id === sourceId ? { ...source, ...patch } : source
		)
	});
}

export function deleteAutoSourceCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	sourceId: string
): Partial<SpellDraft> | null {
	const block = draft.mechanicBlocks[blockIndex];
	const current = block
		? autoParameterValue(block, parameterId, mechanics)
		: null;

	if (!current || current.sources.length <= 1) {
		return null;
	}

	return updateAutoParameterCommand(draft, mechanics, blockIndex, parameterId, {
		sources: current.sources.filter(source => source.id !== sourceId)
	});
}

export function applyAutoPresetCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	numericRole: Parameters<typeof createAutoPreset>[1],
	presetId: string | null,
	systemValueSourceKey: string,
	mechanicParameterSourceKey: string
): Partial<SpellDraft> | null {
	if (!presetId) {
		return null;
	}

	const preset = createAutoPreset(
		presetId,
		numericRole,
		systemValueSourceKey,
		mechanicParameterSourceKey
	);

	return preset
		? updateAutoParameterCommand(
				draft,
				mechanics,
				blockIndex,
				parameterId,
				preset
			)
		: null;
}

export function updateFormulaGraphCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	graph: MechanicCalculationGraphState | null
): Partial<SpellDraft> | null {
	return updateMechanicBlockParameterCommand(
		draft,
		mechanics,
		blockIndex,
		parameterId,
		{
			mode: 'formula',
			graph
		}
	);
}

export function updateProgressionSourceKindCommand(
	draft: SpellDraft,
	mechanics: SpellMechanic[],
	blockIndex: number,
	parameterId: string,
	sourceKind: ProgressionSourceKind,
	nextSourceKey: string
): Partial<SpellDraft> | null {
	return updateProgressionParameterCommand(
		draft,
		mechanics,
		blockIndex,
		parameterId,
		{
			sourceKind,
			sourceKey: nextSourceKey
		}
	);
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

function progressionParameterValue(
	block: SpellMechanicBlockDraft,
	parameterId: string,
	mechanics: SpellMechanic[]
) {
	const value = rawParameterValueForMechanics(block, parameterId, mechanics);
	return isProgressionParameterValue(value) ? value : null;
}

function autoParameterValue(
	block: SpellMechanicBlockDraft,
	parameterId: string,
	mechanics: SpellMechanic[]
): SpellAutoParameterValue | null {
	const value = rawParameterValueForMechanics(block, parameterId, mechanics);
	return isAutoParameterValue(value) ? value : null;
}

function rawParameterValueForMechanics(
	block: SpellMechanicBlockDraft,
	parameterId: string,
	mechanics: SpellMechanic[]
) {
	return (
		block.parameterValues[parameterId] ??
		block.parameterValues[parameterStorageKey(block, parameterId, mechanics)]
	);
}

function rawParameterValue(
	block: SpellMechanicBlockDraft,
	parameterId: string,
	parameters: SpellMechanicParameter[]
) {
	const parameter = parameters.find(
		item => item.id === parameterId || item.slug === parameterId
	);

	return (
		block.parameterValues[parameterId] ??
		block.parameterValues[
			parameter ? mechanicParameterStorageKey(parameter) : parameterId
		]
	);
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
