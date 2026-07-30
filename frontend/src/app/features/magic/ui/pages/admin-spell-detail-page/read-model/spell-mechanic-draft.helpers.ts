import { MagicWord } from '../../../../domain/magic-word.models';
import {
	SpellMechanicApplicationConfig,
	SpellMechanicBlockConfig,
	SpellTextBlock,
	SpellTextBlockKind
} from '../../../../domain/spell.models';
import {
	SpellMechanic,
	SpellMechanicParameter
} from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	createStaticParameterValue,
	SpellParameterValue
} from '../utils/spell-numeric-parameter.utils';
import {
	SpellDraft,
	SpellMechanicBlockDraft
} from '../models/spell-detail-page.types';
import { parameterStorageKey } from '../mappers/spell-detail-draft.mapper';
import { createTargetConfigFromMechanicDefault } from '../utils/spell-target-config.utils';
import { readSpellEffectScaleConfig } from './spell-effect-scale-config.presenter';

export function createMechanicBlockDraft(
	mechanic: SpellMechanic,
	sortOrder: number,
	essence: MagicWord | null,
	targetIdsByParameterId: Record<string, string>,
	id: string
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

export function defaultParameterValue(
	parameter: SpellMechanicParameter,
	essence: MagicWord | null,
	targetIdsByParameterId: Record<string, string>
): SpellParameterValue {
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
