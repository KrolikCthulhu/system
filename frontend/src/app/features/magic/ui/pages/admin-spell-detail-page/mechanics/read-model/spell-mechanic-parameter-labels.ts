import { SpellMechanicParameter } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	SpellParameterValue,
	isAutoParameterValue,
	isFormulaParameterValue,
	isProgressionParameterValue,
	isStaticParameterValue
} from '../../utils/spell-numeric-parameter.utils';

interface ParameterLabelLookup {
	progressionPresetName: (presetId: string) => string | null;
	skillName: (value: string) => string | null;
	targetText: (value: string) => string;
	damageTypeName: (value: string) => string | null;
	conditionName: (value: string) => string | null;
}

interface ParameterPreviewLabelLookup extends ParameterLabelLookup {
	formulaText: (
		value: Extract<SpellParameterValue, { mode: 'formula' }>
	) => string;
	autoText: (value: Extract<SpellParameterValue, { mode: 'auto' }>) => string;
}

export function formatParameterPreviewLabel(
	kind: SpellMechanicParameter['kind'],
	value: unknown,
	lookup: ParameterPreviewLabelLookup
): string {
	if (isProgressionParameterValue(value)) {
		return progressionLabel(value.presetId, lookup);
	}

	if (isFormulaParameterValue(value)) {
		return lookup.formulaText(value);
	}

	if (isAutoParameterValue(value)) {
		return lookup.autoText(value);
	}

	if (isStaticParameterValue(value)) {
		return formatParameterPreviewLabel(kind, value.value, lookup);
	}

	return formatPlainParameterLabel(kind, value, lookup);
}

export function formatFormulaSourceValueSummary(
	kind: SpellMechanicParameter['kind'],
	value: unknown,
	lookup: ParameterLabelLookup
): string {
	if (isProgressionParameterValue(value)) {
		return progressionLabel(value.presetId, lookup);
	}

	if (isFormulaParameterValue(value)) {
		return 'Формула';
	}

	if (isAutoParameterValue(value)) {
		return 'Авто';
	}

	if (isStaticParameterValue(value)) {
		return formatPlainParameterLabel(kind, value.value, lookup);
	}

	return formatPlainParameterLabel(kind, value, lookup);
}

function progressionLabel(
	presetId: string,
	lookup: ParameterLabelLookup
): string {
	const presetName = lookup.progressionPresetName(presetId);
	return presetName ? `Прогрессия: ${presetName}` : 'Прогрессия';
}

function formatPlainParameterLabel(
	kind: SpellMechanicParameter['kind'],
	value: unknown,
	lookup: ParameterLabelLookup
): string {
	if (!value) {
		return 'Не выбрано';
	}

	if (typeof value !== 'string') {
		return 'Настроено';
	}

	switch (kind) {
		case 'skill':
			return lookup.skillName(value) ?? value;
		case 'target':
			return lookup.targetText(value);
		case 'damageType':
			return lookup.damageTypeName(value) ?? value;
		case 'condition':
			return lookup.conditionName(value) ?? value;
		default:
			return value;
	}
}
