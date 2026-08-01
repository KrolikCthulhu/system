import {
	autoParameterFormulaLabel,
	autoParameterSourceLabels,
	evaluateAutoParameterValue,
	formatPreviewNumber,
	isAutoParameterValue,
	NumericParameterPreview,
	parameterValueText,
	roundingLabel,
	SpellParameterValue
} from '../utils/spell-numeric-parameter.utils';

export function areaNumericPreview(
	value: SpellParameterValue,
	sourceNames: ReadonlyMap<string, string>,
	progressionPreviewSteps: number[],
	maxActiveSkillLevel: number
): NumericParameterPreview {
	if (isAutoParameterValue(value)) {
		return {
			formula: autoParameterFormulaLabel(value, sourceNames),
			sources: autoParameterSourceLabels(value, sourceNames),
			rounding: roundingLabel(value.roundingMode),
			values: progressionPreviewSteps.map(x => ({
				x,
				value: formatPreviewNumber(
					evaluateAutoParameterValue(value, x, {
						scaleMaxX: maxActiveSkillLevel
					})
				)
			}))
		};
	}

	const staticValue = parameterValueText(value);

	return {
		formula: staticValue || '0',
		sources: [],
		rounding: 'Не применяется',
		values: progressionPreviewSteps.map(x => ({
			x,
			value: staticValue || '0'
		}))
	};
}
