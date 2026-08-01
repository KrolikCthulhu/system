import { Condition } from '../../../../../conditions/domain/conditions.models';
import { DamageType } from '../../../../../damage-types/domain/damage-types.models';
import { ProgressionPreset } from '../../../../../progression-presets/domain/progression-presets.models';
import { Skill } from '../../../../../skills/domain/skills.models';
import {
	SpellMechanic,
	SpellMechanicParameter,
	SpellMechanicParameterKind
} from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { formatMechanicCalculationFormula } from '../../../../../spell-mechanics/ui/mechanic-calculation-graph.formula';
import {
	SpellEffectScaleConfig,
	SpellEffectScaleItemConfig,
	SpellMechanicApplicationConfig,
	SpellTextBlock
} from '../../../../domain/spell.models';
import { renderMechanicTextTemplate } from '../utils/mechanic-text-template-renderer';
import {
	SpellDraft,
	SpellMechanicBlockDraft,
	SpellTextPreviewMode,
	SpellTextPreviewPart
} from '../models/spell-detail-page.types';
import {
	autoParameterFormulaLabel,
	formatPreviewNumber,
	isAutoParameterValue,
	isFormulaParameterValue,
	isProgressionParameterValue,
	isStaticParameterValue,
	parameterValueText,
	SpellAutoParameterSource,
	SpellAutoParameterValue
} from '../utils/spell-numeric-parameter.utils';
import {
	createTargetPreset,
	targetConfigText
} from '../utils/spell-target-config.utils';

export interface SpellTextPreviewContext {
	draft: SpellDraft | null;
	mechanics: SpellMechanic[];
	progressionPresets: ProgressionPreset[];
	skills: Skill[];
	damageTypes: DamageType[];
	conditions: Condition[];
	formulaSourceNames: ReadonlyMap<string, string>;
	mode: SpellTextPreviewMode;
	mechanicApplicationConfig(
		block: SpellMechanicBlockDraft
	): SpellMechanicApplicationConfig;
	effectScaleConfig(block: SpellMechanicBlockDraft): SpellEffectScaleConfig;
	evaluateAutoParameterForGameText(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue
	): number;
}

export function mechanicBlockTextPreview(
	block: SpellMechanicBlockDraft,
	context: SpellTextPreviewContext,
	mode = context.mode
) {
	const mechanic = mechanicBlockMechanic(block, context);

	if (!mechanic) {
		return 'Механика не найдена.';
	}

	return renderMechanicTextTemplate(
		mechanic.textTemplate,
		mechanic,
		block.parameterValues,
		context.mechanicApplicationConfig(block),
		value =>
			mode === 'game'
				? gameParameterValueLabel(block, value.value, value.parameter, context)
				: parameterValueLabel(value.kind, value.value, context)
	);
}

export function renderSpellTextBlock(
	block: SpellTextBlock,
	context: SpellTextPreviewContext,
	mode = context.mode
) {
	if (block.kind === 'text') {
		return block.text;
	}

	const mechanicBlock = context.draft?.mechanicBlocks.find(
		item => item.id === block.mechanicBlockId
	);

	return mechanicBlock
		? mechanicBlockTextPreview(mechanicBlock, context, mode)
		: '';
}

export function renderSpellTextBlockParts(
	block: SpellTextBlock,
	context: SpellTextPreviewContext,
	mode = context.mode
): SpellTextPreviewPart[] {
	if (block.kind === 'text') {
		return [{ kind: 'paragraph', text: block.text }];
	}

	const mechanicBlock = context.draft?.mechanicBlocks.find(
		item => item.id === block.mechanicBlockId
	);

	if (!mechanicBlock) {
		return [];
	}

	if (isEffectScaleBlock(mechanicBlock, context)) {
		return [
			{
				kind: 'effectScale',
				intro: effectScaleTextIntro(mechanicBlock, context, mode),
				items: context.effectScaleConfig(mechanicBlock).items
			}
		];
	}

	return [
		{
			kind: 'paragraph',
			text: mechanicBlockTextPreview(mechanicBlock, context, mode)
		}
	];
}

export function effectScaleTextIntro(
	block: SpellMechanicBlockDraft,
	context: SpellTextPreviewContext,
	mode = context.mode
) {
	const skill = effectScaleSkillText(block, context, mode);
	const config = context.effectScaleConfig(block);
	const hasAutomaticItem = config.items.some(
		item => item.requirement === 'automatic'
	);
	const automaticText = hasAutomaticItem
		? ' Пункт без проверки можно выбрать без броска.'
		: '';

	return `Если цель — объект, совершите проверку навыком ${skill}. По количеству успехов выберите доступный эффект из таблицы.${automaticText}`;
}

export function effectScaleRequirementText(item: SpellEffectScaleItemConfig) {
	if (item.requirement === 'automatic') {
		return 'Без проверки';
	}

	return item.isOpenEnded
		? `${item.threshold}+ успеха`
		: `${item.threshold} успех`;
}

export function spellTextBlockPreview(
	block: SpellTextBlock,
	context: SpellTextPreviewContext
) {
	const text = renderSpellTextBlock(block, context, context.mode).trim();
	return text || 'Текст пока пустой.';
}

export function parameterValueLabel(
	kind: SpellMechanicParameterKind,
	value: unknown,
	context: SpellTextPreviewContext
): string {
	if (isProgressionParameterValue(value)) {
		const preset = context.progressionPresets.find(
			item => item.id === value.presetId
		);
		return preset ? `Прогрессия: ${preset.name}` : 'Прогрессия';
	}

	if (isFormulaParameterValue(value)) {
		return formatMechanicCalculationFormula(
			value.graph,
			context.formulaSourceNames
		);
	}

	if (isAutoParameterValue(value)) {
		return autoParameterFormulaLabel(value, context.formulaSourceNames);
	}

	if (isRecord(value) && value['mode'] === 'auto') {
		const autoValue = normalizeLooseAutoParameterValue(value);
		return autoValue
			? autoParameterFormulaLabel(autoValue, context.formulaSourceNames)
			: 'автоматически рассчитанное значение';
	}

	if (isStaticParameterValue(value)) {
		return parameterValueLabel(kind, value.value, context);
	}

	if (isRecord(value) && value['mode'] === 'static') {
		return parameterValueLabel(kind, value['value'], context);
	}

	if (!value) {
		return 'Не выбрано';
	}

	if (isRecord(value)) {
		if (kind === 'target' && typeof value['target'] === 'string') {
			const targetConfig = context.draft?.targetConfigs.find(
				item => item.id === value['target'] || item.slug === value['target']
			);

			return targetConfig ? targetConfigText(targetConfig) : 'Не выбрано';
		}

		const linkedLabel = linkedParameterValueLabel(value);

		if (linkedLabel) {
			return parameterValueLabel(kind, linkedLabel, context);
		}
	}

	if (typeof value !== 'string') {
		return 'Настроено';
	}

	switch (kind) {
		case 'skill':
			return context.skills.find(item => item.id === value)?.name ?? value;
		case 'target':
			return targetConfigText(
				context.draft?.targetConfigs.find(
					item => item.id === value || item.slug === value
				) ?? createTargetPreset('Цель', 'selected', 'any', 'one')
			);
		case 'damageType':
			return context.damageTypes.find(item => item.id === value)?.name ?? value;
		case 'condition':
			return context.conditions.find(item => item.id === value)?.name ?? value;
		default:
			return value;
	}
}

export function gameParameterValueLabel(
	block: SpellMechanicBlockDraft,
	value: unknown,
	parameter: SpellMechanicParameter,
	context: SpellTextPreviewContext
): string {
	const kind = parameter.kind;

	if (kind === 'number' || kind === 'formula') {
		if (isAutoParameterValue(value)) {
			return gameNumberParameterLabel(
				context.evaluateAutoParameterForGameText(block, value),
				parameter,
				context
			);
		}

		if (isRecord(value) && value['mode'] === 'auto') {
			const autoValue = normalizeLooseAutoParameterValue(value);

			return autoValue
				? gameNumberParameterLabel(
						context.evaluateAutoParameterForGameText(block, autoValue),
						parameter,
						context
					)
				: 'не рассчитано';
		}

		if (isStaticParameterValue(value)) {
			return gameNumberParameterLabel(value.value, parameter, context);
		}

		if (isRecord(value) && value['mode'] === 'static') {
			return gameNumberParameterLabel(value['value'], parameter, context);
		}
	}

	return parameterValueLabel(kind, value, context);
}

export function normalizeLooseAutoParameterValue(
	value: Record<string, unknown>
): SpellAutoParameterValue | null {
	const sources = Array.isArray(value['sources'])
		? value['sources'].map((source, index) =>
				normalizeLooseAutoParameterSource(source, index)
			)
		: [];

	if (!sources.length) {
		return null;
	}

	return {
		mode: 'auto',
		character: readAutoCharacter(value['character']),
		scale: readAutoScale(value['scale']),
		growth: readAutoGrowth(value['growth']),
		startLevel: readFiniteNumber(value['startLevel'], 0),
		minimum: readFiniteNumber(value['minimum'], 0),
		maximum:
			value['maximum'] === null || value['maximum'] === undefined
				? null
				: readFiniteNumber(value['maximum'], 0),
		rangeMode: readAutoRangeMode(value['rangeMode']),
		finalScale: readFiniteNumber(value['finalScale'], 1),
		sourceMode: value['sourceMode'] === 'simple' ? 'simple' : 'advanced',
		sources,
		essenceInfluence: readAutoEssenceInfluence(value['essenceInfluence']),
		essenceProfileKey: readEssenceProfileKey(value['essenceProfileKey']),
		roundingMode: readRoundingMode(value['roundingMode'])
	};
}

function gameNumberParameterLabel(
	value: number | string | unknown,
	parameter: SpellMechanicParameter,
	context: SpellTextPreviewContext
) {
	const numericValue =
		typeof value === 'number'
			? value
			: typeof value === 'string'
				? Number(value.replace(',', '.'))
				: Number.NaN;
	const label = Number.isFinite(numericValue)
		? formatPreviewNumber(numericValue)
		: parameterValueLabel(parameter.kind, value, context);

	if (parameter.numericRole === 'range' && Number.isFinite(numericValue)) {
		return `${label} ${meterGenitiveWord(numericValue)}`;
	}

	return label;
}

function effectScaleSkillText(
	block: SpellMechanicBlockDraft,
	context: SpellTextPreviewContext,
	mode: SpellTextPreviewMode
) {
	const mechanic = mechanicBlockMechanic(block, context);
	const parameter = mechanic?.parameters.find(
		item => item.slug === 'navyk-proverki'
	);
	const value = block.parameterValues['navyk-proverki'];

	if (!parameter) {
		return 'проверки';
	}

	return mode === 'game'
		? gameParameterValueLabel(block, value, parameter, context)
		: parameterValueLabel(parameter.kind, value, context);
}

function isEffectScaleBlock(
	block: SpellMechanicBlockDraft,
	context: SpellTextPreviewContext
) {
	return (
		mechanicBlockMechanic(block, context)?.actions.some(
			action => action.kind === 'effectScale'
		) ?? false
	);
}

function mechanicBlockMechanic(
	block: SpellMechanicBlockDraft,
	context: SpellTextPreviewContext
) {
	return (
		context.mechanics.find(mechanic => mechanic.id === block.mechanicId) ?? null
	);
}

function linkedParameterValueLabel(value: Record<string, unknown>) {
	if (typeof value['name'] === 'string' && value['name'].trim()) {
		return value['name'];
	}

	for (const key of ['defaultDamageType', 'defaultSkill', 'defaultCondition']) {
		const nested = value[key];

		if (
			isRecord(nested) &&
			typeof nested['name'] === 'string' &&
			nested['name'].trim()
		) {
			return nested['name'];
		}
	}

	if (typeof value['value'] === 'string' && value['value'].trim()) {
		return value['value'];
	}

	return null;
}

function normalizeLooseAutoParameterSource(
	value: unknown,
	index: number
): SpellAutoParameterSource {
	const source = isRecord(value) ? value : {};

	return {
		id: typeof source['id'] === 'string' ? source['id'] : `source-${index}`,
		sourceKind: readAutoSourceKind(source['sourceKind']),
		sourceKey:
			typeof source['sourceKey'] === 'string' ? source['sourceKey'] : '',
		transform: readAutoSourceTransform(source['transform']),
		transformSourceKey:
			typeof source['transformSourceKey'] === 'string'
				? source['transformSourceKey']
				: '',
		transformDivisor: readFiniteNumber(source['transformDivisor'], 2),
		target: readAutoSourceTarget(source['target']),
		weight: typeof source['weight'] === 'number' ? source['weight'] : 1,
		curve: readAutoSourceCurve(source['curve'])
	};
}

function readFiniteNumber(value: unknown, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readAutoCharacter(
	value: unknown
): SpellAutoParameterValue['character'] {
	return value === 'stable' ||
		value === 'scalable' ||
		value === 'elemental' ||
		value === 'masterful' ||
		value === 'limited' ||
		value === 'extreme'
		? value
		: 'scalable';
}

function readAutoScale(value: unknown): SpellAutoParameterValue['scale'] {
	return value === 'tiny' ||
		value === 'small' ||
		value === 'medium' ||
		value === 'large' ||
		value === 'huge'
		? value
		: 'medium';
}

function readAutoRangeMode(
	value: unknown
): SpellAutoParameterValue['rangeMode'] {
	return value === 'scale' ? 'scale' : 'none';
}

function readAutoGrowth(value: unknown): SpellAutoParameterValue['growth'] {
	return value === 'weak' ||
		value === 'smooth' ||
		value === 'fast' ||
		value === 'saturation' ||
		value === 'explosive'
		? value
		: 'smooth';
}

function readAutoSourceKind(
	value: unknown
): SpellAutoParameterSource['sourceKind'] {
	return value === 'mechanicParameter' ||
		value === 'systemValue' ||
		value === 'essenceProfile' ||
		value === 'manual'
		? value
		: 'manual';
}

function readAutoSourceTarget(
	value: unknown
): SpellAutoParameterSource['target'] {
	return value === 'growth' ||
		value === 'multiplier' ||
		value === 'base' ||
		value === 'maximum' ||
		value === 'essenceBonus'
		? value
		: 'growth';
}

function readAutoSourceCurve(
	value: unknown
): SpellAutoParameterSource['curve'] {
	return value === 'weak' ||
		value === 'smooth' ||
		value === 'fast' ||
		value === 'saturation' ||
		value === 'explosive'
		? value
		: 'smooth';
}

function readAutoSourceTransform(
	value: unknown
): SpellAutoParameterSource['transform'] {
	return value === 'value' ||
		value === 'aboveStart' ||
		value === 'aboveSource' ||
		value === 'divide'
		? value
		: 'aboveStart';
}

function readAutoEssenceInfluence(
	value: unknown
): SpellAutoParameterValue['essenceInfluence'] {
	return value === 'none' ||
		value === 'light' ||
		value === 'medium' ||
		value === 'strong'
		? value
		: 'none';
}

function readEssenceProfileKey(
	value: unknown
): SpellAutoParameterValue['essenceProfileKey'] {
	return value === 'damage' ||
		value === 'range' ||
		value === 'control' ||
		value === 'duration' ||
		value === 'area' ||
		value === 'stability'
		? value
		: 'damage';
}

function readRoundingMode(
	value: unknown
): SpellAutoParameterValue['roundingMode'] {
	return value === 'floor' || value === 'round' || value === 'ceil'
		? value
		: 'round';
}

function meterGenitiveWord(value: number) {
	const absolute = Math.abs(Math.trunc(value));

	if (absolute === 1) {
		return 'метра';
	}

	return 'метров';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
