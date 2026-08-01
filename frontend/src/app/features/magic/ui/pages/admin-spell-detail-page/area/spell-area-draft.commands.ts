import { MagicWordAreaShape } from '../../../../domain/magic-word.models';
import {
	SpellAreaDimension,
	SpellDraft,
	SpellParameterValueMode
} from '../models/spell-detail-page.types';
import {
	AutoValueSourceMode,
	createAutoParameterSource,
	createAutoParameterValue,
	createAutoSourcesForMode,
	createStaticParameterValue,
	isAutoParameterValue,
	isFormulaParameterValue,
	isProgressionParameterValue,
	isStaticParameterValue,
	parameterValueText,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellParameterValue
} from '../utils/spell-numeric-parameter.utils';

export function createAreaDimensions(
	areaShape: MagicWordAreaShape | null
): SpellAreaDimension[] {
	if (!areaShape?.isActive) {
		return [];
	}

	return Object.entries(areaShape.dimensions.base)
		.filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
		.map(([key, value]) => ({
			key,
			label: areaDimensionLabel(key),
			defaultValue: value,
			unitLabel: areaDimensionUnitLabel(key)
		}));
}

export function updateAreaParameterModeCommand(
	draft: SpellDraft,
	areaShape: MagicWordAreaShape | null,
	dimension: SpellAreaDimension,
	mode: SpellParameterValueMode,
	current: SpellParameterValue,
	defaultSourceKeys: { systemValue: string; mechanicParameter: string }
): Partial<SpellDraft> {
	const nextValue =
		mode === 'auto'
			? createAreaAutoParameterValue(dimension, defaultSourceKeys)
			: createStaticParameterValue(parameterValueText(current));

	return updateAreaParameterValueCommand(
		draft,
		areaShape,
		dimension.key,
		nextValue
	);
}

export function updateAreaStaticParameterValueCommand(
	draft: SpellDraft,
	areaShape: MagicWordAreaShape | null,
	dimensionKey: string,
	value: string
): Partial<SpellDraft> {
	return updateAreaParameterValueCommand(
		draft,
		areaShape,
		dimensionKey,
		createStaticParameterValue(value)
	);
}

export function updateAreaAutoParameterCommand(
	draft: SpellDraft,
	areaShape: MagicWordAreaShape | null,
	dimensionKey: string,
	current: SpellAutoParameterValue | null,
	patch: Partial<SpellAutoParameterValue>
): Partial<SpellDraft> | null {
	return current
		? updateAreaParameterValueCommand(draft, areaShape, dimensionKey, {
				...current,
				...patch
			})
		: null;
}

export function updateAreaAutoSourceModeCommand(
	draft: SpellDraft,
	areaShape: MagicWordAreaShape | null,
	dimensionKey: string,
	current: SpellAutoParameterValue | null,
	sourceMode: AutoValueSourceMode
): Partial<SpellDraft> | null {
	return current
		? updateAreaAutoParameterCommand(draft, areaShape, dimensionKey, current, {
				sourceMode,
				sources: createAutoSourcesForMode(sourceMode, current.sources)
			})
		: null;
}

export function addAreaAutoSourceCommand(
	draft: SpellDraft,
	areaShape: MagicWordAreaShape | null,
	dimensionKey: string,
	current: SpellAutoParameterValue | null
): Partial<SpellDraft> | null {
	return current
		? updateAreaAutoParameterCommand(draft, areaShape, dimensionKey, current, {
				sources: [...current.sources, createAutoParameterSource()]
			})
		: null;
}

export function updateAreaAutoSourceCommand(
	draft: SpellDraft,
	areaShape: MagicWordAreaShape | null,
	dimensionKey: string,
	current: SpellAutoParameterValue | null,
	sourceId: string,
	patch: Partial<SpellAutoParameterSource>
): Partial<SpellDraft> | null {
	return current
		? updateAreaAutoParameterCommand(draft, areaShape, dimensionKey, current, {
				sources: current.sources.map(source =>
					source.id === sourceId ? { ...source, ...patch } : source
				)
			})
		: null;
}

export function deleteAreaAutoSourceCommand(
	draft: SpellDraft,
	areaShape: MagicWordAreaShape | null,
	dimensionKey: string,
	current: SpellAutoParameterValue | null,
	sourceId: string
): Partial<SpellDraft> | null {
	return current && current.sources.length > 1
		? updateAreaAutoParameterCommand(draft, areaShape, dimensionKey, current, {
				sources: current.sources.filter(source => source.id !== sourceId)
			})
		: null;
}

export function updateAreaParameterValueCommand(
	draft: SpellDraft,
	areaShape: MagicWordAreaShape | null,
	dimensionKey: string,
	value: SpellParameterValue
): Partial<SpellDraft> {
	const area = normalizeSpellAreaConfig(
		draft.config.area,
		areaShape,
		draft.gestureId
	);

	return {
		config: {
			...draft.config,
			area: {
				...area,
				dimensions: {
					...area.dimensions,
					[dimensionKey]: value
				}
			}
		}
	};
}

function createAreaAutoParameterValue(
	dimension: SpellAreaDimension,
	defaultSourceKeys: { systemValue: string; mechanicParameter: string }
): SpellAutoParameterValue {
	const value = createAutoParameterValue();

	return {
		...value,
		scale: dimension.key === 'tiles' ? 'large' : value.scale,
		sourceMode: 'advanced',
		sources: [
			createAutoParameterSource({
				sourceKind: 'systemValue',
				sourceKey: defaultSourceKeys.systemValue,
				target: 'base',
				curve: 'smooth',
				weight: 1
			}),
			createAutoParameterSource({
				sourceKind: 'mechanicParameter',
				sourceKey: defaultSourceKeys.mechanicParameter,
				target: 'growth',
				curve: 'smooth',
				weight: 1
			}),
			createAutoParameterSource({
				sourceKind: 'essenceProfile',
				sourceKey: 'area',
				target: 'multiplier',
				curve: 'weak',
				weight: 0.4
			})
		],
		essenceInfluence: 'none',
		essenceProfileKey: 'area',
		roundingMode: 'round'
	};
}

function normalizeSpellAreaConfig(
	config: unknown,
	areaShape: MagicWordAreaShape | null,
	gestureId: string
) {
	const dimensions = createAreaDimensions(areaShape);
	const currentDimensions =
		isRecord(config) && isRecord(config['dimensions'])
			? config['dimensions']
			: {};

	return {
		gestureId,
		shapeKind: areaShape?.kind ?? '',
		dimensions: Object.fromEntries(
			dimensions.map(dimension => [
				dimension.key,
				isSpellParameterValue(currentDimensions[dimension.key])
					? currentDimensions[dimension.key]
					: createStaticParameterValue(String(dimension.defaultValue))
			])
		)
	};
}

function areaDimensionLabel(key: string) {
	switch (key) {
		case 'radius':
			return 'Радиус';
		case 'length':
			return 'Длина';
		case 'width':
			return 'Ширина';
		case 'height':
			return 'Высота';
		case 'side':
			return 'Сторона';
		case 'tiles':
			return 'Количество квадратов';
		case 'innerRadius':
			return 'Внутренний радиус';
		case 'thickness':
			return 'Толщина';
		default:
			return key;
	}
}

function areaDimensionUnitLabel(key: string) {
	return key === 'tiles' ? 'клетки 1x1' : 'клетки';
}

function isSpellParameterValue(value: unknown): value is SpellParameterValue {
	return (
		typeof value === 'string' ||
		isRecord(value) ||
		isStaticParameterValue(value) ||
		isAutoParameterValue(value) ||
		isProgressionParameterValue(value) ||
		isFormulaParameterValue(value)
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
