import { ProgressionPresetRoundingMode } from '../../../../../progression-presets/domain/progression-presets.models';
import {
	SpellMechanic,
	SpellMechanicParameter
} from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { MagicWordAreaShape } from '../../../../domain/magic-word.models';
import {
	Spell,
	SpellConfig,
	SpellFormulaCandidate,
	SpellTextBlock
} from '../../../../domain/spell.models';
import {
	createDefaultTargetConfigs,
	normalizeTargetConfigs
} from '../utils/spell-target-config.utils';
import {
	AutoValueCharacter,
	AutoValueEssenceInfluence,
	AutoValueGrowth,
	AutoValueRangeMode,
	AutoValueScale,
	AutoValueSourceCurve,
	AutoValueSourceKind,
	AutoValueSourceTarget,
	AutoValueSourceTransform,
	createStaticParameterValue,
	isAutoParameterValue,
	isFormulaParameterValue,
	isProgressionParameterValue,
	isStaticParameterValue,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellParameterValue,
	supportsNumericParameterKind
} from '../utils/spell-numeric-parameter.utils';
import { SpellDraft } from '../models/spell-detail-page.types';

interface AreaDimension {
	key: string;
	defaultValue: number;
}

export function createSpellDraftFromFormula(
	formula: SpellFormulaCandidate,
	areaShape: MagicWordAreaShape | null
): SpellDraft {
	return {
		id: null,
		actionId: formula.action.id,
		essenceId: formula.essence.id,
		gestureId: formula.gesture.id,
		formulaName: `${formula.action.name} + ${formula.essence.name} + ${formula.gesture.name}`,
		name: `${formula.action.name} ${formula.essence.name}: ${formula.gesture.name}`,
		description: '',
		config: normalizeSpellConfig({}, areaShape, formula.gesture.id),
		status: 'DRAFT',
		isActive: false,
		sortOrder: 0,
		targetConfigs: createDefaultTargetConfigs(),
		textBlocks: [],
		mechanicBlocks: []
	};
}

export function createSpellDraftFromSpell(
	spell: Spell,
	options: {
		areaShape: MagicWordAreaShape | null;
		spellMechanics: SpellMechanic[];
	}
): SpellDraft {
	return {
		id: spell.id,
		actionId: spell.actionId,
		essenceId: spell.essenceId,
		gestureId: spell.gestureId,
		formulaName: spell.formulaName,
		name: spell.name,
		description: spell.description,
		config: normalizeSpellConfig(
			spell.config,
			options.areaShape,
			spell.gestureId
		),
		status: spell.status,
		isActive: spell.isActive,
		sortOrder: spell.sortOrder,
		targetConfigs: normalizeTargetConfigs(spell.targetConfigs),
		textBlocks: normalizeSpellTextBlocks(spell.textBlocks),
		mechanicBlocks: spell.mechanicBlocks
			.sort((first, second) => first.sortOrder - second.sortOrder)
			.map(block => {
				const mechanic = options.spellMechanics.find(
					item => item.id === block.mechanicId
				);

				return {
					id: block.id,
					mechanicId: block.mechanicId,
					parameterValues: normalizeParameterValues(
						block.parameterValues,
						mechanic?.parameters ?? []
					),
					config: isRecord(block.config) ? block.config : {},
					isActive: block.isActive,
					sortOrder: block.sortOrder
				};
			})
	};
}

export function normalizeSpellConfig(
	config: SpellConfig | Record<string, unknown>,
	areaShape: MagicWordAreaShape | null,
	gestureId: string
): SpellConfig {
	const currentArea =
		isRecord(config) && isRecord(config['area']) ? config['area'] : undefined;

	return {
		...config,
		area: normalizeSpellAreaConfig(currentArea, areaShape, gestureId)
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

function createAreaDimensions(
	areaShape: MagicWordAreaShape | null
): AreaDimension[] {
	if (!areaShape?.isActive) {
		return [];
	}

	return Object.entries(areaShape.dimensions.base)
		.filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
		.map(([key, value]) => ({
			key,
			defaultValue: value
		}));
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

function normalizeSpellTextBlocks(blocks: SpellTextBlock[]): SpellTextBlock[] {
	return blocks
		.filter(block => block.kind === 'text' || block.kind === 'mechanicText')
		.sort((left, right) => left.sortOrder - right.sortOrder)
		.map((block, index) => ({
			id: block.id || crypto.randomUUID(),
			kind: block.kind,
			text: block.text ?? '',
			mechanicBlockId: block.mechanicBlockId ?? '',
			isActive: block.isActive,
			sortOrder: index
		}));
}

export function normalizeParameterValues(
	values: Record<string, unknown>,
	parameters: SpellMechanicParameter[]
) {
	const parametersBySlug = new Map(
		parameters.map(parameter => [parameter.slug, parameter])
	);
	const parameterSlugsById = new Map(
		parameters.map(parameter => [parameter.id, parameterStorageKey(parameter)])
	);

	return Object.fromEntries(
		Object.entries(values).map(([key, value]) => {
			const parameter = parametersBySlug.get(key) ?? null;

			return [
				parameter ? parameterStorageKey(parameter) : key,
				normalizeParameterValue(value, parameter, parameterSlugsById)
			];
		})
	);
}

function normalizeParameterValue(
	value: unknown,
	parameter: SpellMechanicParameter | null,
	parameterSlugsById: Map<string, string> = new Map()
): SpellParameterValue {
	if (isStaticParameterValue(value)) {
		return {
			mode: 'static',
			value: value.value
		};
	}

	if (isProgressionParameterValue(value)) {
		return {
			mode: 'progression',
			sourceKind: value.sourceKind,
			sourceKey:
				value.sourceKind === 'skillLevel'
					? (parameterSlugsById.get(value.sourceKey) ?? value.sourceKey)
					: value.sourceKey,
			presetId: value.presetId,
			config: { ...value.config }
		};
	}

	if (isFormulaParameterValue(value)) {
		return {
			mode: 'formula',
			graph: value.graph
				? {
						nodes: value.graph.nodes.map(node => ({
							...node,
							sourceId:
								typeof node.sourceId === 'string'
									? normalizeFormulaSourceId(node.sourceId, parameterSlugsById)
									: node.sourceId
						})),
						edges: value.graph.edges.map(edge => ({ ...edge }))
					}
				: null
		};
	}

	if (isAutoParameterValue(value)) {
		return {
			mode: 'auto',
			character: value.character,
			scale: value.scale,
			growth: value.growth,
			startLevel: value.startLevel,
			minimum: value.minimum,
			maximum: value.maximum,
			rangeMode: value.rangeMode,
			finalScale: value.finalScale,
			sourceMode: value.sourceMode,
			sources: value.sources.map(source => ({
				...source,
				sourceKey:
					source.sourceKind === 'mechanicParameter'
						? (parameterSlugsById.get(source.sourceKey) ?? source.sourceKey)
						: source.sourceKey
			})),
			essenceInfluence: value.essenceInfluence,
			essenceProfileKey: value.essenceProfileKey,
			roundingMode: value.roundingMode
		};
	}

	if (isRecord(value) && value['mode'] === 'auto') {
		const autoValue = normalizeLooseAutoParameterValue(value);

		if (autoValue) {
			return {
				...autoValue,
				sources: autoValue.sources.map(source => ({
					...source,
					sourceKey:
						source.sourceKind === 'mechanicParameter'
							? (parameterSlugsById.get(source.sourceKey) ?? source.sourceKey)
							: source.sourceKey
				}))
			};
		}
	}

	if (isRecord(value)) {
		return { ...value };
	}

	if (parameter && supportsNumericParameterKind(parameter.kind)) {
		return createStaticParameterValue(String(value ?? ''));
	}

	return String(value ?? '');
}

function normalizeLooseAutoParameterValue(
	value: Record<string, unknown>
): SpellAutoParameterValue | null {
	const sources = Array.isArray(value['sources'])
		? value['sources'].filter(isRecord).map(normalizeLooseAutoParameterSource)
		: [];

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

function normalizeLooseAutoParameterSource(
	source: Record<string, unknown>,
	index: number
): SpellAutoParameterSource {
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

function readAutoCharacter(value: unknown): AutoValueCharacter {
	return value === 'stable' ||
		value === 'scalable' ||
		value === 'elemental' ||
		value === 'masterful' ||
		value === 'limited' ||
		value === 'extreme'
		? value
		: 'scalable';
}

function readAutoScale(value: unknown): AutoValueScale {
	return value === 'tiny' ||
		value === 'small' ||
		value === 'medium' ||
		value === 'large' ||
		value === 'huge'
		? value
		: 'medium';
}

function readAutoRangeMode(value: unknown): AutoValueRangeMode {
	return value === 'scale' ? value : 'none';
}

function readAutoGrowth(value: unknown): AutoValueGrowth {
	return value === 'weak' ||
		value === 'smooth' ||
		value === 'fast' ||
		value === 'saturation' ||
		value === 'explosive'
		? value
		: 'smooth';
}

function readAutoSourceKind(value: unknown): AutoValueSourceKind {
	return value === 'mechanicParameter' ||
		value === 'systemValue' ||
		value === 'essenceProfile' ||
		value === 'manual'
		? value
		: 'manual';
}

function readAutoSourceTarget(value: unknown): AutoValueSourceTarget {
	return value === 'growth' ||
		value === 'multiplier' ||
		value === 'base' ||
		value === 'maximum' ||
		value === 'essenceBonus'
		? value
		: 'growth';
}

function readAutoSourceCurve(value: unknown): AutoValueSourceCurve {
	return value === 'weak' ||
		value === 'smooth' ||
		value === 'fast' ||
		value === 'saturation' ||
		value === 'explosive'
		? value
		: 'smooth';
}

function readAutoSourceTransform(value: unknown): AutoValueSourceTransform {
	return value === 'value' ||
		value === 'aboveStart' ||
		value === 'aboveSource' ||
		value === 'divide'
		? value
		: 'aboveStart';
}

function readAutoEssenceInfluence(value: unknown): AutoValueEssenceInfluence {
	return value === 'light' ||
		value === 'medium' ||
		value === 'strong' ||
		value === 'none'
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

function readRoundingMode(value: unknown): ProgressionPresetRoundingMode {
	return value === 'floor' || value === 'ceil' || value === 'round'
		? value
		: 'round';
}

export function parameterStorageKey(parameter: SpellMechanicParameter) {
	return parameter.slug || parameter.id;
}

function normalizeFormulaSourceId(
	sourceId: string,
	parameterSlugsById: Map<string, string>
) {
	for (const prefix of ['parameter:', 'skillParameterLevel:']) {
		if (sourceId.startsWith(prefix)) {
			const key = sourceId.slice(prefix.length);

			return `${prefix}${parameterSlugsById.get(key) ?? key}`;
		}
	}

	return sourceId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
