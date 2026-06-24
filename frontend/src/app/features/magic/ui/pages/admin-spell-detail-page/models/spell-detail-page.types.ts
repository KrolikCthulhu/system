import {
	SpellEffectScaleItemConfig,
	SpellMechanicBlockConfig,
	SpellConfig,
	PersistedSpellStatus,
	SpellTargetConfig,
	SpellTextBlock
} from '../../../../domain/spell.models';
import { SpellParameterValue } from '../utils/spell-numeric-parameter.utils';

export interface MechanicProblemItem {
	blockIndex: number;
	mechanicName: string;
	issue: string;
}

export interface SpellMechanicBlockListItem {
	id: string;
	index: number;
	name: string;
	preview: string;
	invalid: boolean;
	first: boolean;
	last: boolean;
}

export interface SpellMechanicBlockDraft {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, SpellParameterValue>;
	config: SpellMechanicBlockConfig;
	isActive: boolean;
	sortOrder: number;
}

export interface SpellDraft {
	id: string | null;
	actionId: string;
	essenceId: string;
	gestureId: string;
	formulaName: string;
	name: string;
	description: string;
	config: SpellConfig;
	status: PersistedSpellStatus;
	isActive: boolean;
	sortOrder: number;
	targetConfigs: SpellTargetConfig[];
	textBlocks: SpellTextBlock[];
	mechanicBlocks: SpellMechanicBlockDraft[];
}

export interface SpellMechanicParameterHeaderPreviewItem {
	level: number;
	label: string;
}

export interface SpellMechanicParameterHeaderPreview {
	items: SpellMechanicParameterHeaderPreviewItem[];
	rangeLabel: string | null;
}

export interface CasterLevelMatrixPreview {
	columns: number[];
	columnRanges: Array<{
		level: number;
		minValue: string;
		maxValue: string;
		label: string;
	}>;
	rows: Array<{
		casterLevel: number;
		values: string[];
	}>;
	minValue: string;
	maxValue: string;
}

export interface RuntimeRollDraft {
	diceCount: number;
	skillLevel: number;
	dice: number[];
	successes: number | null;
}

export interface RuntimeTraceRow {
	id: string;
	actionName: string;
	message: string;
	status: 'executed' | 'pending';
	depth: number;
}

export interface FormulaParameterSelection {
	blockIndex: number;
	parameterId: string;
}

export interface CommandSelectOption<TValue = string> {
	label: string;
	value: TValue;
}

export interface CommandSelectOptionGroup<TValue = string> {
	label: string;
	items: Array<CommandSelectOption<TValue>>;
}

export type TagSeverity =
	| 'success'
	| 'info'
	| 'warn'
	| 'secondary'
	| 'contrast'
	| 'danger';

export type SpellParameterValueMode =
	| 'static'
	| 'progression'
	| 'auto'
	| 'formula';

export type SpellTextPreviewMode = 'game' | 'formula';

export type AutoHelpKey =
	| 'character'
	| 'scale'
	| 'startLevel'
	| 'minimum'
	| 'maximum'
	| 'rangeMode'
	| 'finalScale'
	| 'sourceMode'
	| 'sourceKind'
	| 'sourceKey'
	| 'sourceTransform'
	| 'sourceTransformSource'
	| 'sourceTransformDivisor'
	| 'sourceTarget'
	| 'sourceCurve'
	| 'sourceWeight'
	| 'rounding';

export type SpellTextPreviewPart =
	| { kind: 'paragraph'; text: string }
	| {
			kind: 'effectScale';
			intro: string;
			items: SpellEffectScaleItemConfig[];
	  };
