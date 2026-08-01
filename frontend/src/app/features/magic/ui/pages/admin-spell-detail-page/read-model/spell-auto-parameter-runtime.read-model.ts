import { SpellMechanicBlockDraft } from '../models/spell-detail-page.types';
import {
	AutoValueSourceTarget,
	SpellAutoParameterSource,
	SpellAutoParameterValue
} from '../utils/spell-numeric-parameter.utils';

export interface SpellAutoParameterRuntimeContext {
	maxActiveSkillLevel: number;
	sourceValue(
		block: SpellMechanicBlockDraft,
		source: SpellAutoParameterSource
	): number;
}

export function evaluateAutoParameterForGameText(
	block: SpellMechanicBlockDraft,
	value: SpellAutoParameterValue,
	context: SpellAutoParameterRuntimeContext
) {
	if (shouldUseAutoMinimumForGameText(block, value, context)) {
		return value.minimum;
	}

	const raw = evaluateAutoRuntimeRawValue(block, value, context);
	const ranged = applyAutoRuntimeRange(block, value, raw, context);
	const scaled = ranged * value.finalScale;

	return applyRuntimeRounding(scaled, value.roundingMode);
}

export function applyAutoRuntimeRange(
	block: SpellMechanicBlockDraft,
	value: SpellAutoParameterValue,
	raw: number,
	context: SpellAutoParameterRuntimeContext
) {
	if (
		value.rangeMode !== 'scale' ||
		value.maximum === null ||
		value.maximum <= value.minimum
	) {
		return raw;
	}

	const minRaw = evaluateAutoRuntimeRawValue(block, value, context, {
		mechanicParameterValue: value.startLevel
	});
	const maxRaw = evaluateAutoRuntimeRawValue(block, value, context, {
		mechanicParameterValue: context.maxActiveSkillLevel
	});

	if (maxRaw === minRaw) {
		return value.minimum;
	}

	const ratio = (raw - minRaw) / (maxRaw - minRaw);
	const clampedRatio = Math.min(1, Math.max(0, ratio));

	return value.minimum + (value.maximum - value.minimum) * clampedRatio;
}

export function evaluateAutoRuntimeRawValue(
	block: SpellMechanicBlockDraft,
	value: SpellAutoParameterValue,
	context: SpellAutoParameterRuntimeContext,
	options?: { mechanicParameterValue?: number }
) {
	const mechanicParameterValue = options?.mechanicParameterValue;

	if (
		mechanicParameterValue !== undefined &&
		mechanicParameterValue < value.startLevel
	) {
		return value.minimum;
	}

	const config = autoParameterRuntimeConfig(value);
	const groups: Record<AutoValueSourceTarget, number> = {
		growth: 0,
		multiplier: 0,
		base: 0,
		maximum: 0,
		essenceBonus: 0
	};

	for (const source of value.sources) {
		const sourceValue =
			source.sourceKind === 'mechanicParameter' &&
			mechanicParameterValue !== undefined
				? mechanicParameterValue
				: context.sourceValue(block, source);
		const transformSourceValue = autoTransformRuntimeSourceValue(
			block,
			value,
			source,
			mechanicParameterValue ?? sourceValue,
			context
		);
		groups[source.target] +=
			applyAutoRuntimeCurve(
				source.curve,
				autoEffectiveRuntimeSourceValue(
					source,
					sourceValue,
					value.startLevel,
					transformSourceValue
				)
			) * source.weight;
	}

	const base = config.base + groups.base;
	const power = groups.growth * config.powerMultiplier;
	const multiplied =
		(base + power + groups.essenceBonus) * (1 + groups.multiplier);
	const limitBase =
		config.limitMax === null && hasAutoMaximumSource(value)
			? config.base
			: config.limitMax;
	const limit = limitBase === null ? null : limitBase + groups.maximum;
	const limited = limit === null ? multiplied : Math.min(multiplied, limit);

	return Math.max(value.minimum, limited);
}

export function autoParameterRuntimeConfig(value: SpellAutoParameterValue) {
	const scale = autoRuntimeScaleConfig(value.scale);
	const character = autoRuntimeCharacterConfig(value.character);

	return {
		base: scale.base,
		powerMultiplier: scale.powerMultiplier * character.powerMultiplier,
		limitMax:
			character.limitMax === null ? null : scale.base + character.limitMax
	};
}

export function applyAutoRuntimeCurve(
	curve: SpellAutoParameterSource['curve'],
	value: number
) {
	switch (curve) {
		case 'weak':
			return value * 0.5;
		case 'smooth':
			return value;
		case 'fast':
			return value * 1.5;
		case 'saturation':
			return 5 * (1 - Math.exp(-value * 0.45));
		case 'explosive':
			return value ** 2 * 0.35;
	}
}

export function autoEffectiveRuntimeSourceValue(
	source: SpellAutoParameterSource,
	value: number,
	startLevel: number,
	transformSourceValue: number
) {
	switch (source.transform) {
		case 'value':
			return value;
		case 'aboveStart':
			return source.sourceKind === 'essenceProfile'
				? value
				: Math.max(0, value - startLevel);
		case 'aboveSource':
			return Math.max(0, value - transformSourceValue);
		case 'divide':
			return value / Math.max(1, source.transformDivisor);
	}
}

export function applyRuntimeRounding(
	value: number,
	mode: SpellAutoParameterValue['roundingMode']
) {
	switch (mode) {
		case 'floor':
			return Math.floor(value);
		case 'round':
			return Math.round(value);
		case 'ceil':
			return Math.ceil(value);
	}
}

function autoRuntimeScaleConfig(scale: SpellAutoParameterValue['scale']) {
	switch (scale) {
		case 'tiny':
			return { base: 0, powerMultiplier: 1 };
		case 'small':
			return { base: 2, powerMultiplier: 1 };
		case 'medium':
			return { base: 5, powerMultiplier: 2 };
		case 'large':
			return { base: 10, powerMultiplier: 3 };
		case 'huge':
			return { base: 20, powerMultiplier: 5 };
	}
}

function autoRuntimeCharacterConfig(
	character: SpellAutoParameterValue['character']
) {
	switch (character) {
		case 'stable':
			return { powerMultiplier: 0.75, limitMax: 16 };
		case 'scalable':
			return { powerMultiplier: 1.25, limitMax: null };
		case 'elemental':
			return { powerMultiplier: 1, limitMax: null };
		case 'masterful':
			return { powerMultiplier: 1.5, limitMax: null };
		case 'limited':
			return { powerMultiplier: 1, limitMax: 12 };
		case 'extreme':
			return { powerMultiplier: 2, limitMax: null };
	}
}

function hasAutoMaximumSource(value: SpellAutoParameterValue) {
	return value.sources.some(source => source.target === 'maximum');
}

function autoTransformRuntimeSourceValue(
	block: SpellMechanicBlockDraft,
	value: SpellAutoParameterValue,
	source: SpellAutoParameterSource,
	fallbackValue: number,
	context: SpellAutoParameterRuntimeContext
) {
	if (source.transform !== 'aboveSource') {
		return fallbackValue;
	}

	const transformSource =
		value.sources.find(item => item.id === source.transformSourceKey) ??
		value.sources.find(item => item.sourceKey === source.transformSourceKey);

	return transformSource
		? context.sourceValue(block, transformSource)
		: fallbackValue;
}

function shouldUseAutoMinimumForGameText(
	block: SpellMechanicBlockDraft,
	value: SpellAutoParameterValue,
	context: SpellAutoParameterRuntimeContext
) {
	if (value.startLevel <= 0) {
		return false;
	}

	const levelSources = value.sources.filter(
		source => source.sourceKind !== 'essenceProfile'
	);

	return (
		levelSources.length > 0 &&
		levelSources.every(
			source => context.sourceValue(block, source) < value.startLevel
		)
	);
}
