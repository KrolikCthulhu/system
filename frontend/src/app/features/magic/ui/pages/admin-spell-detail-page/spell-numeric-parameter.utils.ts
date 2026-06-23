import {
	ProgressionPreset,
	ProgressionPresetConfig,
	ProgressionPresetKind,
	ProgressionPresetRoundingMode
} from '../../../../progression-presets/domain/progression-presets.models';
import { SystemValue } from '../../../../values/domain/values.models';
import {
	SpellMechanicNumericRole,
	SpellMechanicParameter,
	SpellMechanicParameterKind
} from '../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	MechanicCalculationGraphState,
	MechanicCalculationOperation
} from '../../../../spell-mechanics/ui/mechanic-calculation-graph.models';
export type ProgressionSourceKind = 'manual' | 'skillLevel' | 'essenceProfile';
export type AutoValueCharacter =
	| 'stable'
	| 'scalable'
	| 'elemental'
	| 'masterful'
	| 'limited'
	| 'extreme';
export type AutoValueScale = 'small' | 'medium' | 'large' | 'huge';
export type AutoValueGrowth = 'weak' | 'smooth' | 'fast' | 'saturation' | 'explosive';
export type AutoValueSourceMode = 'simple' | 'advanced';
export type AutoValueSourceKind =
	| 'mechanicParameter'
	| 'systemValue'
	| 'essenceProfile'
	| 'manual';
export type AutoValueSourceTarget =
	| 'growth'
	| 'multiplier'
	| 'base'
	| 'maximum'
	| 'essenceBonus';
export type AutoValueSourceCurve = 'weak' | 'smooth' | 'fast' | 'saturation' | 'explosive';
export type AutoValueEssenceInfluence = 'none' | 'light' | 'medium' | 'strong';
export type EssenceProfileKey =
	| 'damage'
	| 'range'
	| 'control'
	| 'duration'
	| 'area'
	| 'stability';

export interface SpellProgressionParameterValue {
	mode: 'progression';
	sourceKind: ProgressionSourceKind;
	sourceKey: string;
	presetId: string;
	config: ProgressionPresetConfig;
}

export interface SpellStaticParameterValue {
	mode: 'static';
	value: string;
}

export interface SpellFormulaParameterValue {
	mode: 'formula';
	graph: MechanicCalculationGraphState | null;
}

export interface SpellAutoParameterValue {
	mode: 'auto';
	character: AutoValueCharacter;
	scale: AutoValueScale;
	growth: AutoValueGrowth;
	startLevel: number;
	minimum: number;
	sourceMode: AutoValueSourceMode;
	sources: SpellAutoParameterSource[];
	essenceInfluence: AutoValueEssenceInfluence;
	essenceProfileKey: EssenceProfileKey;
	roundingMode: ProgressionPresetRoundingMode;
}

export interface SpellAutoParameterSource {
	id: string;
	sourceKind: AutoValueSourceKind;
	sourceKey: string;
	target: AutoValueSourceTarget;
	weight: number;
	curve: AutoValueSourceCurve;
}

export interface NumericParameterPreview {
	formula: string;
	sources: string[];
	rounding: string;
	values: Array<{ x: number; value: string }>;
}

export interface ConfigField {
	key: string;
	label: string;
	min?: number;
	step: number;
}

interface CommandSelectOption {
	label: string;
	value: string;
}

interface CommandSelectOptionGroup {
	label: string;
	items: CommandSelectOption[];
}

export type SpellParameterValue =
	| string
	| Record<string, unknown>
	| SpellStaticParameterValue
	| SpellProgressionParameterValue
	| SpellFormulaParameterValue
	| SpellAutoParameterValue;

export const PROGRESSION_SOURCE_KIND_OPTIONS: Array<{
	label: string;
	value: ProgressionSourceKind;
}> = [
	{ label: 'Навык из параметра', value: 'skillLevel' },
	{ label: 'Профиль сущности', value: 'essenceProfile' },
	{ label: 'Ручной x', value: 'manual' }
];

export const ESSENCE_PROFILE_SOURCE_OPTIONS: Array<{ label: string; value: EssenceProfileKey }> = [
	{ label: 'Урон', value: 'damage' },
	{ label: 'Дальность', value: 'range' },
	{ label: 'Контроль', value: 'control' },
	{ label: 'Длительность', value: 'duration' },
	{ label: 'Область', value: 'area' },
	{ label: 'Стабильность', value: 'stability' }
];

export const ROUNDING_MODE_OPTIONS: Array<{
	label: string;
	value: ProgressionPresetRoundingMode;
}> = [
	{ label: 'Вниз', value: 'floor' },
	{ label: 'Округлить', value: 'round' },
	{ label: 'Вверх', value: 'ceil' }
];

export const AUTO_VALUE_CHARACTER_OPTIONS: Array<{
	label: string;
	value: AutoValueCharacter;
}> = [
	{ label: 'Стабильное', value: 'stable' },
	{ label: 'Скалируемое', value: 'scalable' },
	{ label: 'Стихийное', value: 'elemental' },
	{ label: 'Мастерское', value: 'masterful' },
	{ label: 'Ограниченное', value: 'limited' },
	{ label: 'Экстремальное', value: 'extreme' }
];

export const AUTO_VALUE_SCALE_OPTIONS: Array<{ label: string; value: AutoValueScale }> = [
	{ label: 'Малый', value: 'small' },
	{ label: 'Средний', value: 'medium' },
	{ label: 'Большой', value: 'large' },
	{ label: 'Огромный', value: 'huge' }
];

export const AUTO_VALUE_GROWTH_OPTIONS: Array<{ label: string; value: AutoValueGrowth }> = [
	{ label: 'Слабый', value: 'weak' },
	{ label: 'Плавный', value: 'smooth' },
	{ label: 'Быстрый', value: 'fast' },
	{ label: 'Насыщение', value: 'saturation' },
	{ label: 'Взрывной', value: 'explosive' }
];

export const AUTO_VALUE_SOURCE_MODE_OPTIONS: Array<{
	label: string;
	value: AutoValueSourceMode;
}> = [
	{ label: 'Простой', value: 'simple' },
	{ label: 'Расширенный', value: 'advanced' }
];

export const AUTO_VALUE_SOURCE_KIND_OPTIONS: Array<{
	label: string;
	value: AutoValueSourceKind;
}> = [
	{ label: 'Параметр из механики', value: 'mechanicParameter' },
	{ label: 'Системное значение', value: 'systemValue' },
	{ label: 'Профиль сущности', value: 'essenceProfile' },
	{ label: 'Ручной x', value: 'manual' }
];

export const AUTO_VALUE_SOURCE_TARGET_OPTIONS: Array<{
	label: string;
	value: AutoValueSourceTarget;
}> = [
	{ label: 'Базовый масштаб', value: 'base' },
	{ label: 'Рост', value: 'growth' },
	{ label: 'Множитель', value: 'multiplier' },
	{ label: 'Лимит', value: 'maximum' },
	{ label: 'Бонус', value: 'essenceBonus' }
];

export const AUTO_VALUE_SOURCE_CURVE_OPTIONS: Array<{
	label: string;
	value: AutoValueSourceCurve;
}> = [
	{ label: 'Слабая', value: 'weak' },
	{ label: 'Плавная', value: 'smooth' },
	{ label: 'Быстрая', value: 'fast' },
	{ label: 'Насыщение', value: 'saturation' },
	{ label: 'Взрывная', value: 'explosive' }
];

export const AUTO_VALUE_ESSENCE_INFLUENCE_OPTIONS: Array<{
	label: string;
	value: AutoValueEssenceInfluence;
}> = [
	{ label: 'Нет', value: 'none' },
	{ label: 'Лёгкое', value: 'light' },
	{ label: 'Среднее', value: 'medium' },
	{ label: 'Сильное', value: 'strong' }
];

export function createProgressionParameterValue(
	preset: ProgressionPreset | null
): SpellProgressionParameterValue {
	return {
		mode: 'progression',
		sourceKind: 'skillLevel',
		sourceKey: '',
		presetId: preset?.id ?? '',
		config: { ...(preset?.config ?? { base: 0, step: 1, roundingMode: 'round' }) }
	};
}

export function createStaticParameterValue(value: string): SpellStaticParameterValue {
	return {
		mode: 'static',
		value
	};
}

export function createFormulaParameterValue(): SpellFormulaParameterValue {
	return {
		mode: 'formula',
		graph: null
	};
}

export function createAutoParameterValue(): SpellAutoParameterValue {
	return {
		mode: 'auto',
		character: 'scalable',
		scale: 'medium',
		growth: 'smooth',
		startLevel: 0,
		minimum: 0,
		sourceMode: 'simple',
		sources: [createAutoParameterSource()],
		essenceInfluence: 'light',
		essenceProfileKey: 'damage',
		roundingMode: 'round'
	};
}

export function createAutoParameterSource(
	patch: Partial<SpellAutoParameterSource> = {}
): SpellAutoParameterSource {
	return {
		id: crypto.randomUUID(),
		sourceKind: 'manual',
		sourceKey: '',
		target: 'growth',
		weight: 1,
		curve: 'smooth',
		...patch
	};
}

export function createAutoSourcesForMode(
	mode: AutoValueSourceMode,
	currentSources: SpellAutoParameterSource[]
) {
	if (mode === 'simple') {
		return [currentSources[0] ?? createAutoParameterSource()];
	}

	return currentSources.length ? currentSources : [createAutoParameterSource()];
}

export function createAutoPresetOptions(
	role: SpellMechanicNumericRole
): CommandSelectOptionGroup[] {
	const groups: CommandSelectOptionGroup[] = [];

	if (role !== 'custom') {
		groups.push({
			label: `Для роли: ${numericRoleLabel(role)}`,
			items: [
				{
					label: 'Стандарт',
					value: 'role:standard'
				},
				{
					label: 'Сильный рост',
					value: 'role:growth'
				},
				{
					label: 'Стабильный',
					value: 'role:stable'
				}
			]
		});
	}

	groups.push({
		label: 'Общие',
		items: [
			{ label: 'Ручной x', value: 'common:manual' },
			{ label: 'Уровень заклинателя', value: 'common:system' },
			{ label: 'Параметр механики', value: 'common:mechanic' },
			{ label: 'Уровень + параметр', value: 'common:system-mechanic' },
			{ label: 'Параметр + сущность', value: 'common:mechanic-essence' }
		]
	});

	return groups;
}

export function createAutoPreset(
	presetId: string,
	role: SpellMechanicNumericRole,
	systemValueSourceKey: string,
	mechanicParameterSourceKey: string
): Partial<SpellAutoParameterValue> | null {
	switch (presetId) {
		case 'role:standard':
			return createAutoPresetForRole(role, systemValueSourceKey, mechanicParameterSourceKey);
		case 'role:growth':
			return createAutoGrowthPresetForRole(
				role,
				systemValueSourceKey,
				mechanicParameterSourceKey
			);
		case 'role:stable':
			return createAutoStablePresetForRole(
				role,
				systemValueSourceKey,
				mechanicParameterSourceKey
			);
		case 'common:manual':
			return {
				character: 'scalable',
				scale: 'medium',
				growth: 'smooth',
				sourceMode: 'simple',
				sources: [createAutoParameterSource()],
				essenceInfluence: 'none',
				essenceProfileKey: 'damage',
				roundingMode: 'round'
			};
		case 'common:system':
			return {
				character: 'scalable',
				scale: 'medium',
				growth: 'smooth',
				sourceMode: 'simple',
				sources: [
					createRolePresetSource({
						sourceKind: 'systemValue',
						sourceKey: systemValueSourceKey,
						target: 'growth'
					})
				],
				essenceInfluence: 'none',
				essenceProfileKey: 'damage',
				roundingMode: 'round'
			};
		case 'common:mechanic':
			return {
				character: 'scalable',
				scale: 'medium',
				growth: 'smooth',
				sourceMode: 'simple',
				sources: [
					createRolePresetSource({
						sourceKind: 'mechanicParameter',
						sourceKey: mechanicParameterSourceKey,
						target: 'growth'
					})
				],
				essenceInfluence: 'none',
				essenceProfileKey: 'damage',
				roundingMode: 'round'
			};
		case 'common:system-mechanic':
			return {
				character: 'scalable',
				scale: 'medium',
				growth: 'smooth',
				sourceMode: 'advanced',
				sources: [
					createRolePresetSource({
						sourceKind: 'systemValue',
						sourceKey: systemValueSourceKey,
						target: 'base',
						weight: 0.5
					}),
					createRolePresetSource({
						sourceKind: 'mechanicParameter',
						sourceKey: mechanicParameterSourceKey,
						target: 'growth',
						weight: 1
					})
				],
				essenceInfluence: 'none',
				essenceProfileKey: 'damage',
				roundingMode: 'round'
			};
		case 'common:mechanic-essence':
			return {
				character: 'scalable',
				scale: 'medium',
				growth: 'smooth',
				sourceMode: 'advanced',
				sources: [
					createRolePresetSource({
						sourceKind: 'mechanicParameter',
						sourceKey: mechanicParameterSourceKey,
						target: 'growth',
						weight: 1
					}),
					createRolePresetSource({
						sourceKind: 'essenceProfile',
						sourceKey: essenceProfileKeyForRole(role),
						target: 'multiplier',
						curve: 'weak',
						weight: 0.35
					})
				],
				essenceInfluence: 'none',
				essenceProfileKey: essenceProfileKeyForRole(role),
				roundingMode: 'round'
			};
		default:
			return null;
	}
}

function createAutoPresetForRole(
	role: SpellMechanicNumericRole,
	systemValueSourceKey: string,
	mechanicParameterSourceKey: string
): Partial<SpellAutoParameterValue> | null {
	const systemValueSource = createRolePresetSource({
		sourceKind: 'systemValue',
		sourceKey: systemValueSourceKey
	});
	const mechanicParameterSource = createRolePresetSource({
		sourceKind: 'mechanicParameter',
		sourceKey: mechanicParameterSourceKey
	});

	switch (role) {
		case 'damage':
			return {
				character: 'scalable',
				scale: 'medium',
				growth: 'smooth',
				sourceMode: 'advanced',
				sources: [
					{
						...mechanicParameterSource,
						target: 'growth',
						curve: 'fast',
						weight: 1
					},
					{
						...systemValueSource,
						target: 'maximum',
						curve: 'smooth',
						weight: 0.5
					},
					createRolePresetSource({
						sourceKind: 'essenceProfile',
						sourceKey: 'damage',
						target: 'multiplier',
						curve: 'weak',
						weight: 0.3
					})
				],
				essenceInfluence: 'none',
				essenceProfileKey: 'damage',
				roundingMode: 'round'
			};
		case 'range':
			return {
				character: 'scalable',
				scale: 'large',
				growth: 'smooth',
				sourceMode: 'advanced',
				sources: [
					{
						...systemValueSource,
						target: 'base',
						curve: 'smooth',
						weight: 1
					},
					{
						...mechanicParameterSource,
						target: 'growth',
						curve: 'smooth',
						weight: 1
					},
					createRolePresetSource({
						sourceKind: 'essenceProfile',
						sourceKey: 'range',
						target: 'multiplier',
						curve: 'weak',
						weight: 0.4
					})
				],
				essenceInfluence: 'none',
				essenceProfileKey: 'range',
				roundingMode: 'round'
			};
		case 'duration':
			return {
				character: 'limited',
				scale: 'medium',
				growth: 'saturation',
				sourceMode: 'advanced',
				sources: [
					{
						...mechanicParameterSource,
						target: 'growth',
						curve: 'saturation',
						weight: 1
					},
					{
						...systemValueSource,
						target: 'maximum',
						curve: 'smooth',
						weight: 0.4
					},
					createRolePresetSource({
						sourceKind: 'essenceProfile',
						sourceKey: 'duration',
						target: 'multiplier',
						curve: 'weak',
						weight: 0.25
					})
				],
				essenceInfluence: 'none',
				essenceProfileKey: 'duration',
				roundingMode: 'ceil'
			};
		case 'area':
			return {
				character: 'limited',
				scale: 'small',
				growth: 'smooth',
				sourceMode: 'advanced',
				sources: [
					{
						...systemValueSource,
						target: 'maximum',
						curve: 'smooth',
						weight: 0.5
					},
					{
						...mechanicParameterSource,
						target: 'growth',
						curve: 'smooth',
						weight: 1
					},
					createRolePresetSource({
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
		case 'targetCount':
			return {
				character: 'limited',
				scale: 'small',
				growth: 'weak',
				sourceMode: 'advanced',
				sources: [
					{
						...systemValueSource,
						target: 'maximum',
						curve: 'saturation',
						weight: 0.4
					},
					{
						...mechanicParameterSource,
						target: 'growth',
						curve: 'saturation',
						weight: 0.6
					}
				],
				essenceInfluence: 'none',
				essenceProfileKey: 'control',
				roundingMode: 'floor'
			};
		case 'custom':
			return null;
	}
}

function createRolePresetSource(
	patch: Partial<SpellAutoParameterSource>
): SpellAutoParameterSource {
	return createAutoParameterSource({
		target: 'growth',
		curve: 'smooth',
		weight: 1,
		...patch
	});
}

function createAutoGrowthPresetForRole(
	role: SpellMechanicNumericRole,
	systemValueSourceKey: string,
	mechanicParameterSourceKey: string
): Partial<SpellAutoParameterValue> | null {
	const preset = createAutoPresetForRole(
		role,
		systemValueSourceKey,
		mechanicParameterSourceKey
	);

	if (!preset) {
		return null;
	}

	return {
		...preset,
		character: 'masterful',
		growth: 'fast',
		sources: (preset.sources ?? []).map(source => {
			if (source.sourceKind === 'mechanicParameter') {
				return {
					...source,
					curve: 'fast',
					weight: source.weight * 1.25
				};
			}

			if (source.sourceKind === 'systemValue' && source.target === 'maximum') {
				return {
					...source,
					weight: source.weight * 0.75
				};
			}

			return source;
		})
	};
}

function createAutoStablePresetForRole(
	role: SpellMechanicNumericRole,
	systemValueSourceKey: string,
	mechanicParameterSourceKey: string
): Partial<SpellAutoParameterValue> | null {
	const preset = createAutoPresetForRole(
		role,
		systemValueSourceKey,
		mechanicParameterSourceKey
	);

	if (!preset) {
		return null;
	}

	return {
		...preset,
		character: 'stable',
		growth: 'smooth',
		sources: (preset.sources ?? []).map(source => ({
			...source,
			curve: source.curve === 'explosive' ? 'fast' : 'smooth',
			weight:
				source.sourceKind === 'mechanicParameter'
					? source.weight * 0.75
					: source.weight
		}))
	};
}

function essenceProfileKeyForRole(
	role: SpellMechanicNumericRole
): EssenceProfileKey {
	switch (role) {
		case 'damage':
			return 'damage';
		case 'range':
			return 'range';
		case 'duration':
			return 'duration';
		case 'area':
			return 'area';
		case 'targetCount':
			return 'control';
		case 'custom':
			return 'damage';
	}
}

export function isStaticParameterValue(value: unknown): value is SpellStaticParameterValue {
	if (!isRecord(value)) {
		return false;
	}

	return value['mode'] === 'static' && typeof value['value'] === 'string';
}

export function isProgressionParameterValue(
	value: unknown
): value is SpellProgressionParameterValue {
	if (!isRecord(value)) {
		return false;
	}

	return (
		value['mode'] === 'progression' &&
		isProgressionSourceKind(value['sourceKind']) &&
		typeof value['sourceKey'] === 'string' &&
		typeof value['presetId'] === 'string' &&
		isProgressionPresetConfig(value['config'])
	);
}

export function isFormulaParameterValue(value: unknown): value is SpellFormulaParameterValue {
	if (!isRecord(value)) {
		return false;
	}

	return (
		value['mode'] === 'formula' &&
		(value['graph'] === null || isMechanicCalculationGraph(value['graph']))
	);
}

export function isAutoParameterValue(value: unknown): value is SpellAutoParameterValue {
	if (!isRecord(value)) {
		return false;
	}

	return (
		value['mode'] === 'auto' &&
		isAutoValueCharacter(value['character']) &&
		isAutoValueScale(value['scale']) &&
		isAutoValueGrowth(value['growth']) &&
		typeof value['startLevel'] === 'number' &&
		typeof value['minimum'] === 'number' &&
		isAutoValueSourceMode(value['sourceMode']) &&
		Array.isArray(value['sources']) &&
		value['sources'].every(isAutoParameterSource) &&
		isAutoValueEssenceInfluence(value['essenceInfluence']) &&
		isEssenceProfileKey(value['essenceProfileKey']) &&
		isProgressionRoundingMode(value['roundingMode'])
	);
}

function isAutoParameterSource(value: unknown): value is SpellAutoParameterSource {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value['id'] === 'string' &&
		isAutoValueSourceKind(value['sourceKind']) &&
		typeof value['sourceKey'] === 'string' &&
		isAutoValueSourceTarget(value['target']) &&
		typeof value['weight'] === 'number' &&
		isAutoValueSourceCurve(value['curve'])
	);
}

export function parameterValueText(value: SpellParameterValue | null | undefined) {
	if (typeof value === 'string') {
		return value;
	}

	if (isStaticParameterValue(value)) {
		return value.value;
	}

	return '';
}

export function supportsNumericParameterKind(kind: SpellMechanicParameterKind) {
	return kind === 'number' || kind === 'formula';
}

export function isAutoSourceMechanicParameter(parameter: SpellMechanicParameter) {
	return (
		parameter.kind === 'skill' ||
		parameter.kind === 'number' ||
		parameter.kind === 'formula' ||
		parameter.kind === 'systemValue'
	);
}

function isProgressionSourceKind(value: unknown): value is ProgressionSourceKind {
	return value === 'manual' || value === 'skillLevel' || value === 'essenceProfile';
}

function isAutoValueCharacter(value: unknown): value is AutoValueCharacter {
	return (
		value === 'stable' ||
		value === 'scalable' ||
		value === 'elemental' ||
		value === 'masterful' ||
		value === 'limited' ||
		value === 'extreme'
	);
}

function isAutoValueScale(value: unknown): value is AutoValueScale {
	return (
		value === 'small' ||
		value === 'medium' ||
		value === 'large' ||
		value === 'huge'
	);
}

function isAutoValueGrowth(value: unknown): value is AutoValueGrowth {
	return (
		value === 'weak' ||
		value === 'smooth' ||
		value === 'fast' ||
		value === 'saturation' ||
		value === 'explosive'
	);
}

function isAutoValueSourceMode(value: unknown): value is AutoValueSourceMode {
	return value === 'simple' || value === 'advanced';
}

function isAutoValueSourceKind(value: unknown): value is AutoValueSourceKind {
	return (
		value === 'mechanicParameter' ||
		value === 'systemValue' ||
		value === 'essenceProfile' ||
		value === 'manual'
	);
}

function isAutoValueSourceTarget(value: unknown): value is AutoValueSourceTarget {
	return (
		value === 'growth' ||
		value === 'multiplier' ||
		value === 'base' ||
		value === 'maximum' ||
		value === 'essenceBonus'
	);
}

function isAutoValueSourceCurve(value: unknown): value is AutoValueSourceCurve {
	return (
		value === 'weak' ||
		value === 'smooth' ||
		value === 'fast' ||
		value === 'saturation' ||
		value === 'explosive'
	);
}

function isAutoValueEssenceInfluence(
	value: unknown
): value is AutoValueEssenceInfluence {
	return (
		value === 'none' ||
		value === 'light' ||
		value === 'medium' ||
		value === 'strong'
	);
}

function isEssenceProfileKey(value: unknown): value is EssenceProfileKey {
	return (
		value === 'damage' ||
		value === 'range' ||
		value === 'control' ||
		value === 'duration' ||
		value === 'area' ||
		value === 'stability'
	);
}

function isProgressionRoundingMode(
	value: unknown
): value is ProgressionPresetRoundingMode {
	return value === 'floor' || value === 'round' || value === 'ceil';
}

function isProgressionPresetConfig(value: unknown): value is ProgressionPresetConfig {
	if (!isRecord(value)) {
		return false;
	}

	return Object.values(value).every(
		item =>
			typeof item === 'number' ||
			item === 'floor' ||
			item === 'round' ||
			item === 'ceil'
	);
}

function isMechanicCalculationGraph(
	value: unknown
): value is MechanicCalculationGraphState {
	if (!isRecord(value)) {
		return false;
	}

	return Array.isArray(value['nodes']) && Array.isArray(value['edges']);
}

export function formulaSourceId(kind: string, id: string) {
	return `${kind}:${id}`;
}

export function getConfigFields(kind: ProgressionPresetKind): ConfigField[] {
	switch (kind) {
		case 'LINEAR':
			return [
				{ key: 'base', label: 'База', step: 1 },
				{ key: 'step', label: 'Шаг', step: 1 }
			];
		case 'STEP':
			return [
				{ key: 'base', label: 'База', step: 1 },
				{ key: 'step', label: 'Шаг', step: 1 },
				{ key: 'interval', label: 'Интервал', min: 1, step: 1 }
			];
		case 'QUADRATIC':
		case 'SQUARE_ROOT':
		case 'LOGARITHMIC':
			return [
				{ key: 'base', label: 'База', step: 1 },
				{ key: 'multiplier', label: 'Множитель', step: 0.1 }
			];
		case 'SATURATION':
			return [
				{ key: 'min', label: 'Минимум', step: 1 },
				{ key: 'max', label: 'Максимум', step: 1 },
				{ key: 'speed', label: 'Скорость', min: 0, step: 0.05 }
			];
		case 'PERCENT':
			return [
				{ key: 'base', label: 'База', step: 1 },
				{ key: 'percent', label: 'Процент', step: 0.01 }
			];
	}
}

export function buildFormulaLabel(kind: ProgressionPresetKind, config: ProgressionPresetConfig) {
	switch (kind) {
		case 'LINEAR':
			return `${numericConfigValue(config, 'base')} + x * ${numericConfigValue(config, 'step')}`;
		case 'STEP':
			return `${numericConfigValue(config, 'base')} + floor(x / ${numericConfigValue(config, 'interval')}) * ${numericConfigValue(config, 'step')}`;
		case 'QUADRATIC':
			return `${numericConfigValue(config, 'base')} + x^2 * ${numericConfigValue(config, 'multiplier')}`;
		case 'SQUARE_ROOT':
			return `${numericConfigValue(config, 'base')} + sqrt(x) * ${numericConfigValue(config, 'multiplier')}`;
		case 'LOGARITHMIC':
			return `${numericConfigValue(config, 'base')} + log(x + 1) * ${numericConfigValue(config, 'multiplier')}`;
		case 'SATURATION':
			return `${numericConfigValue(config, 'min')} + (${numericConfigValue(config, 'max')} - ${numericConfigValue(config, 'min')}) * (1 - e^(-x * ${numericConfigValue(config, 'speed')}))`;
		case 'PERCENT':
			return `${numericConfigValue(config, 'base')} * (1 + x * ${numericConfigValue(config, 'percent')})`;
	}
}

function evaluateProgression(
	kind: ProgressionPresetKind,
	config: ProgressionPresetConfig,
	x: number
) {
	switch (kind) {
		case 'LINEAR':
			return numericConfigValue(config, 'base') + x * numericConfigValue(config, 'step');
		case 'STEP':
			return (
				numericConfigValue(config, 'base') +
				Math.floor(x / Math.max(1, numericConfigValue(config, 'interval'))) *
					numericConfigValue(config, 'step')
			);
		case 'QUADRATIC':
			return (
				numericConfigValue(config, 'base') +
				x ** 2 * numericConfigValue(config, 'multiplier')
			);
		case 'SQUARE_ROOT':
			return (
				numericConfigValue(config, 'base') +
				Math.sqrt(x) * numericConfigValue(config, 'multiplier')
			);
		case 'LOGARITHMIC':
			return (
				numericConfigValue(config, 'base') +
				Math.log(x + 1) * numericConfigValue(config, 'multiplier')
			);
		case 'SATURATION':
			return (
				numericConfigValue(config, 'min') +
				(numericConfigValue(config, 'max') - numericConfigValue(config, 'min')) *
					(1 - Math.exp(-x * numericConfigValue(config, 'speed')))
			);
		case 'PERCENT':
			return (
				numericConfigValue(config, 'base') *
				(1 + x * numericConfigValue(config, 'percent'))
			);
	}
}

export function evaluateRoundedProgression(
	kind: ProgressionPresetKind,
	config: ProgressionPresetConfig,
	x: number
) {
	const rawValue = evaluateProgression(kind, config, x);

	switch (roundingMode(config)) {
		case 'floor':
			return Math.floor(rawValue);
		case 'ceil':
			return Math.ceil(rawValue);
		case 'round':
			return Math.round(rawValue);
	}
}

function numericConfigValue(config: ProgressionPresetConfig, key: string) {
	const value = config[key];
	return typeof value === 'number' ? value : 0;
}

export function roundingMode(config: ProgressionPresetConfig): ProgressionPresetRoundingMode {
	const mode = config['roundingMode'];

	if (mode === 'floor' || mode === 'round' || mode === 'ceil') {
		return mode;
	}

	return 'round';
}

export function progressionSourceFormulaSourceId(value: SpellProgressionParameterValue) {
	switch (value.sourceKind) {
		case 'skillLevel':
			return formulaSourceId('skillParameterLevel', value.sourceKey);
		case 'essenceProfile':
			return formulaSourceId('essenceProfile', value.sourceKey);
		case 'manual':
			return formulaSourceId('manual', 'x');
	}
}

export function createGraphFromProgression(
	kind: ProgressionPresetKind,
	config: ProgressionPresetConfig,
	sourceId: string
): MechanicCalculationGraphState {
	const builder = new FormulaGraphBuilder(sourceId);
	const x = builder.source('x');
	const expression = createProgressionExpression(builder, kind, config, x);
	const roundedExpression = wrapRoundingOperation(
		builder,
		expression,
		roundingMode(config)
	);

	builder.result(roundedExpression);
	return builder.graph();
}

function createProgressionExpression(
	builder: FormulaGraphBuilder,
	kind: ProgressionPresetKind,
	config: ProgressionPresetConfig,
	x: string
) {
	switch (kind) {
		case 'LINEAR':
			return builder.sum(
				builder.constant(numericConfigValue(config, 'base')),
				builder.multiply(x, builder.constant(numericConfigValue(config, 'step')))
			);
		case 'STEP':
			return builder.sum(
				builder.constant(numericConfigValue(config, 'base')),
				builder.multiply(
					builder.floor(
						builder.divide(
							x,
							builder.constant(Math.max(1, numericConfigValue(config, 'interval')))
						)
					),
					builder.constant(numericConfigValue(config, 'step'))
				)
			);
		case 'QUADRATIC':
			return builder.sum(
				builder.constant(numericConfigValue(config, 'base')),
				builder.multiply(
					builder.power(x, builder.constant(2)),
					builder.constant(numericConfigValue(config, 'multiplier'))
				)
			);
		case 'SQUARE_ROOT':
			return builder.sum(
				builder.constant(numericConfigValue(config, 'base')),
				builder.multiply(
					builder.sqrt(x),
					builder.constant(numericConfigValue(config, 'multiplier'))
				)
			);
		case 'LOGARITHMIC':
			return builder.sum(
				builder.constant(numericConfigValue(config, 'base')),
				builder.multiply(
					builder.log(builder.sum(x, builder.constant(1))),
					builder.constant(numericConfigValue(config, 'multiplier'))
				)
			);
		case 'SATURATION': {
			const min = builder.constant(numericConfigValue(config, 'min'));
			const maxMinusMin = builder.subtract(
				builder.constant(numericConfigValue(config, 'max')),
				builder.constant(numericConfigValue(config, 'min'))
			);
			const negativeSpeedX = builder.subtract(
				builder.constant(0),
				builder.multiply(
					x,
					builder.constant(numericConfigValue(config, 'speed'))
				)
			);
			return builder.sum(
				min,
				builder.multiply(
					maxMinusMin,
					builder.subtract(builder.constant(1), builder.exp(negativeSpeedX))
				)
			);
		}
		case 'PERCENT':
			return builder.multiply(
				builder.constant(numericConfigValue(config, 'base')),
				builder.sum(
					builder.constant(1),
					builder.multiply(
						x,
						builder.constant(numericConfigValue(config, 'percent'))
					)
				)
			);
	}
}

function wrapRoundingOperation(
	builder: FormulaGraphBuilder,
	nodeId: string,
	mode: ProgressionPresetRoundingMode
) {
	switch (mode) {
		case 'floor':
			return builder.floor(nodeId);
		case 'ceil':
			return builder.ceil(nodeId);
		case 'round':
			return builder.round(nodeId);
	}
}

export function graphSourceLabels(
	graph: MechanicCalculationGraphState | null,
	sourceNames: ReadonlyMap<string, string>
) {
	if (!graph) {
		return [];
	}

	return Array.from(
		new Set(
			graph.nodes
				.filter(node => node.kind === 'source' && node.sourceId)
				.map(node => sourceNames.get(node.sourceId as string) ?? 'Источник')
		)
	);
}

export function autoParameterFormulaLabel(
	value: SpellAutoParameterValue,
	sourceNames: ReadonlyMap<string, string>
) {
	const config = autoParameterConfig(value);
	const groups = autoSourceFormulaGroups(value, sourceNames);
	const essenceWeight = autoEssenceInfluenceWeight(value.essenceInfluence);
	const profile = autoEssenceProfileLabel(value.essenceProfileKey, sourceNames);
	const base = [`${config.base}`, ...groups.base];
	const growth =
		groups.growth.length > 0
			? `(${groups.growth.join(' + ')}) * ${config.powerMultiplier}`
			: '0';
	const parts = [base.join(' + '), growth];

	if (essenceWeight > 0) {
		parts.push(`${profile} * ${essenceWeight}`);
	}

	if (groups.essenceBonus.length > 0) {
		parts.push(...groups.essenceBonus);
	}

	let expression = parts.join(' + ');

	if (groups.multiplier.length > 0) {
		expression = `(${expression}) * (1 + ${groups.multiplier.join(' + ')})`;
	}

	const limitBase =
		config.limitMax === null && groups.maximum.length > 0 ? config.base : config.limitMax;
	const limitParts = [
		...(limitBase === null ? [] : [`${limitBase}`]),
		...groups.maximum
	];

	const limitedExpression = limitParts.length
		? `min(${expression}, ${limitParts.join(' + ')})`
		: expression;
	const boundedExpression =
		value.minimum > 0
			? `max(${formatPreviewNumber(value.minimum)}, ${limitedExpression})`
			: limitedExpression;

	return `${boundedExpression}; ${roundingLabel(value.roundingMode)}`;
}

export function autoParameterSourceLabels(
	value: SpellAutoParameterValue,
	sourceNames: ReadonlyMap<string, string>
) {
	const sources = value.sources.map(source => autoSourceLabel(source, sourceNames));

	if (value.essenceInfluence !== 'none') {
		sources.push(autoEssenceProfileLabel(value.essenceProfileKey, sourceNames));
	}

	return Array.from(new Set(sources));
}

export function evaluateAutoParameterValue(value: SpellAutoParameterValue, x: number) {
	const config = autoParameterConfig(value);
	const groups = autoSourceValueGroups(value, x);
	const base = config.base + groups.base;
	const power = groups.growth * config.powerMultiplier;
	const essence = autoEssenceInfluenceWeight(value.essenceInfluence) * x;
	const multiplied = (base + power + essence + groups.essenceBonus) * (1 + groups.multiplier);
	const limitBase =
		config.limitMax === null && groups.maximum > 0 ? config.base : config.limitMax;
	const limit = limitBase === null ? null : limitBase + groups.maximum;
	const limited = limit === null ? multiplied : Math.min(multiplied, limit);

	return Math.max(value.minimum, applyRoundingMode(limited, value.roundingMode));
}

function autoParameterConfig(value: SpellAutoParameterValue) {
	const scale = autoScaleConfig(value.scale);
	const character = autoCharacterConfig(value.character);

	return {
		base: scale.base,
		powerMultiplier: scale.powerMultiplier * character.powerMultiplier,
		limitMax: character.limitMax === null ? null : scale.base + character.limitMax
	};
}

function autoScaleConfig(scale: AutoValueScale) {
	switch (scale) {
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

function autoCharacterConfig(character: AutoValueCharacter) {
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

function applyAutoGrowth(growth: AutoValueGrowth, x: number) {
	switch (growth) {
		case 'weak':
			return x * 0.5;
		case 'smooth':
			return x;
		case 'fast':
			return x * 1.5;
		case 'saturation':
			return 5 * (1 - Math.exp(-x * 0.45));
		case 'explosive':
			return x ** 2 * 0.35;
	}
}

function applyAutoSourceCurve(curve: AutoValueSourceCurve, x: number) {
	return applyAutoGrowth(curve, x);
}

function autoSourceFormulaGroups(
	value: SpellAutoParameterValue,
	sourceNames: ReadonlyMap<string, string>
) {
	const groups: Record<AutoValueSourceTarget, string[]> = {
		growth: [],
		multiplier: [],
		base: [],
		maximum: [],
		essenceBonus: []
	};

	for (const source of value.sources) {
		groups[source.target].push(
			autoSourceFormulaLabel(source, sourceNames, value.startLevel)
		);
	}

	return groups;
}

function autoSourceValueGroups(value: SpellAutoParameterValue, x: number) {
	const groups: Record<AutoValueSourceTarget, number> = {
		growth: 0,
		multiplier: 0,
		base: 0,
		maximum: 0,
		essenceBonus: 0
	};

	for (const source of value.sources) {
		groups[source.target] +=
			applyAutoSourceCurve(
				source.curve,
				autoEffectiveSourceValue(source, x, value.startLevel)
			) * source.weight;
	}

	return groups;
}

function autoSourceFormulaLabel(
	source: SpellAutoParameterSource,
	sourceNames: ReadonlyMap<string, string>,
	startLevel: number
) {
	const sourceLabel = autoSourceLabel(source, sourceNames);
	const effectiveSourceLabel =
		source.sourceKind !== 'essenceProfile' && startLevel > 0
			? `max(0, ${sourceLabel} - ${formatPreviewNumber(startLevel)})`
			: sourceLabel;

	return `${autoSourceCurveFormulaLabel(
		source.curve,
		effectiveSourceLabel
	)} * ${formatPreviewNumber(source.weight)}`;
}

function autoEffectiveSourceValue(
	source: SpellAutoParameterSource,
	value: number,
	startLevel: number
) {
	return source.sourceKind === 'essenceProfile' ? value : Math.max(0, value - startLevel);
}

function autoGrowthFormulaLabel(growth: AutoValueGrowth, source: string) {
	switch (growth) {
		case 'weak':
			return `${source} * 0.5`;
		case 'smooth':
			return source;
		case 'fast':
			return `${source} * 1.5`;
		case 'saturation':
			return `насыщение(${source})`;
		case 'explosive':
			return `${source}^2 * 0.35`;
	}
}

function autoSourceCurveFormulaLabel(curve: AutoValueSourceCurve, source: string) {
	return autoGrowthFormulaLabel(curve, source);
}

function autoEssenceInfluenceWeight(influence: AutoValueEssenceInfluence) {
	switch (influence) {
		case 'none':
			return 0;
		case 'light':
			return 1;
		case 'medium':
			return 2;
		case 'strong':
			return 4;
	}
}

function autoSourceLabel(
	source: SpellAutoParameterSource,
	sourceNames: ReadonlyMap<string, string>
) {
	switch (source.sourceKind) {
		case 'mechanicParameter':
			return (
				sourceNames.get(formulaSourceId('skillParameterLevel', source.sourceKey)) ??
				sourceNames.get(formulaSourceId('parameter', source.sourceKey)) ??
				'Параметр механики'
			);
		case 'systemValue':
			return (
				sourceNames.get(formulaSourceId('systemValue', source.sourceKey)) ??
				'Значение системы'
			);
		case 'essenceProfile':
			return (
				sourceNames.get(formulaSourceId('essenceProfile', source.sourceKey)) ??
				'Профиль сущности'
			);
		case 'manual':
			return 'x';
	}
}

function autoEssenceProfileLabel(
	key: EssenceProfileKey,
	sourceNames: ReadonlyMap<string, string>
) {
	return (
		sourceNames.get(formulaSourceId('essenceProfile', key)) ??
		ESSENCE_PROFILE_SOURCE_OPTIONS.find(option => option.value === key)?.label ??
		'Профиль сущности'
	);
}

export function systemValueSourceLabel(value: SystemValue) {
	return value.displaySection
		? `Система: ${value.displaySection}: ${value.name}`
		: `Система: ${value.name}`;
}

export function graphRoundingLabel(graph: MechanicCalculationGraphState | null) {
	if (!graph?.nodes.length) {
		return 'Не задано';
	}

	const roundingNodes = graph.nodes
		.filter(
			node =>
				node.kind === 'operation' &&
				(node.operation === 'floor' ||
					node.operation === 'round' ||
					node.operation === 'ceil')
		)
		.map(node => roundingLabel(node.operation as ProgressionPresetRoundingMode));

	return roundingNodes.length
		? Array.from(new Set(roundingNodes)).join(', ')
		: 'Не применяется';
}

export function roundingLabel(mode: ProgressionPresetRoundingMode) {
	switch (mode) {
		case 'floor':
			return 'Округлить вниз';
		case 'round':
			return 'Округлить';
		case 'ceil':
			return 'Округлить вверх';
	}
}

export function numericRoleLabel(role: SpellMechanicNumericRole) {
	switch (role) {
		case 'damage':
			return 'Урон';
		case 'range':
			return 'Дальность';
		case 'duration':
			return 'Длительность';
		case 'area':
			return 'Область';
		case 'targetCount':
			return 'Количество целей';
		case 'custom':
			return 'Без роли';
	}
}

function applyRoundingMode(value: number, mode: ProgressionPresetRoundingMode) {
	switch (mode) {
		case 'floor':
			return Math.floor(value);
		case 'round':
			return Math.round(value);
		case 'ceil':
			return Math.ceil(value);
	}
}

export function evaluateFormulaGraphPreview(
	graph: MechanicCalculationGraphState | null,
	x: number
) {
	if (!graph) {
		return 0;
	}

	const resultNode = graph.nodes.find(node => node.kind === 'result');

	if (!resultNode) {
		return 0;
	}

	return evaluateIncomingFormulaValue(resultNode.id, 'in', graph, x, new Set());
}

function evaluateIncomingFormulaValue(
	nodeId: string,
	handleId: string,
	graph: MechanicCalculationGraphState,
	x: number,
	visited: Set<string>
) {
	const edge = graph.edges.find(
		item =>
			item.target === nodeId &&
			(item.targetHandle ?? 'in') === handleId
	);

	return edge ? evaluateFormulaNodeValue(edge.source, graph, x, visited) : 0;
}

function evaluateFormulaNodeValue(
	nodeId: string,
	graph: MechanicCalculationGraphState,
	x: number,
	visited: Set<string>
): number {
	if (visited.has(nodeId)) {
		return 0;
	}

	const node = graph.nodes.find(item => item.id === nodeId);

	if (!node) {
		return 0;
	}

	visited.add(nodeId);

	const value = (() => {
		switch (node.kind) {
			case 'source':
				return x;
			case 'constant':
				return node.constantValue ?? 0;
			case 'operation':
				return evaluateFormulaOperationValue(node.id, node.operation, graph, x, visited);
			case 'comparison':
				return evaluateFormulaComparisonValue(node.id, node.comparison, graph, x, visited);
			case 'condition':
				return evaluateIncomingFormulaValue(
					node.id,
					evaluateIncomingFormulaValue(
						node.id,
						'condition',
						graph,
						x,
						visited
					) !== 0
						? 'then'
						: 'else',
					graph,
					x,
					visited
				);
			case 'result':
				return evaluateIncomingFormulaValue(node.id, 'in', graph, x, visited);
		}
	})();

	visited.delete(nodeId);
	return Number.isFinite(value) ? value : 0;
}

function evaluateFormulaOperationValue(
	nodeId: string,
	operation: MechanicCalculationOperation | undefined,
	graph: MechanicCalculationGraphState,
	x: number,
	visited: Set<string>
) {
	const actualOperation = operation ?? 'sum';

	if (
		actualOperation === 'subtract' ||
		actualOperation === 'divide' ||
		actualOperation === 'power'
	) {
		const left = evaluateIncomingFormulaValue(nodeId, 'a', graph, x, visited);
		const right = evaluateIncomingFormulaValue(nodeId, 'b', graph, x, visited);

		switch (actualOperation) {
			case 'subtract':
				return left - right;
			case 'divide':
				return right === 0 ? 0 : left / right;
			case 'power':
				return left ** right;
		}
	}

	if (isUnaryFormulaOperation(actualOperation)) {
		const value = evaluateIncomingFormulaValue(nodeId, 'in', graph, x, visited);

		switch (actualOperation) {
			case 'sqrt':
				return Math.sqrt(Math.max(0, value));
			case 'log':
				return Math.log(Math.max(0, value));
			case 'exp':
				return Math.exp(value);
			case 'floor':
				return Math.floor(value);
			case 'round':
				return Math.round(value);
			case 'ceil':
				return Math.ceil(value);
		}
	}

	const values = graph.edges
		.filter(edge => edge.target === nodeId)
		.map(edge => evaluateFormulaNodeValue(edge.source, graph, x, visited));

	if (!values.length) {
		return 0;
	}

	switch (actualOperation) {
		case 'sum':
			return values.reduce((sum, value) => sum + value, 0);
		case 'multiply':
			return values.reduce((product, value) => product * value, 1);
		case 'average':
			return values.reduce((sum, value) => sum + value, 0) / values.length;
		case 'min':
			return Math.min(...values);
		case 'max':
			return Math.max(...values);
		default:
			return 0;
	}
}

function evaluateFormulaComparisonValue(
	nodeId: string,
	comparison: MechanicCalculationGraphState['nodes'][number]['comparison'],
	graph: MechanicCalculationGraphState,
	x: number,
	visited: Set<string>
) {
	const left = evaluateIncomingFormulaValue(nodeId, 'a', graph, x, visited);
	const right = evaluateIncomingFormulaValue(nodeId, 'b', graph, x, visited);

	switch (comparison ?? 'gte') {
		case 'eq':
			return left === right ? 1 : 0;
		case 'ne':
			return left !== right ? 1 : 0;
		case 'gt':
			return left > right ? 1 : 0;
		case 'gte':
			return left >= right ? 1 : 0;
		case 'lt':
			return left < right ? 1 : 0;
		case 'lte':
			return left <= right ? 1 : 0;
	}
}

function isUnaryFormulaOperation(operation: MechanicCalculationOperation) {
	return (
		operation === 'sqrt' ||
		operation === 'log' ||
		operation === 'exp' ||
		operation === 'floor' ||
		operation === 'round' ||
		operation === 'ceil'
	);
}

export function formatPreviewNumber(value: number) {
	return Number.isInteger(value)
		? String(value)
		: value.toLocaleString('ru-RU', {
				maximumFractionDigits: 2
			});
}

class FormulaGraphBuilder {
	private readonly nodes: MechanicCalculationGraphState['nodes'] = [];
	private readonly edges: MechanicCalculationGraphState['edges'] = [];
	private nodeIndex = 0;
	private edgeIndex = 0;

	constructor(private readonly sourceId: string) {}

	source(label: string) {
		return this.addNode({
			id: this.nodeId('source', label),
			kind: 'source',
			x: 40,
			y: 80,
			sourceId: this.sourceId
		});
	}

	constant(value: number) {
		return this.addNode({
			id: this.nodeId('constant', String(value)),
			kind: 'constant',
			x: 40,
			y: 150 + this.nodeIndex * 16,
			constantValue: value
		});
	}

	sum(...inputIds: string[]) {
		return this.multiOperation('sum', inputIds);
	}

	multiply(...inputIds: string[]) {
		return this.multiOperation('multiply', inputIds);
	}

	subtract(leftId: string, rightId: string) {
		return this.binaryOperation('subtract', leftId, rightId);
	}

	divide(leftId: string, rightId: string) {
		return this.binaryOperation('divide', leftId, rightId);
	}

	power(leftId: string, rightId: string) {
		return this.binaryOperation('power', leftId, rightId);
	}

	sqrt(inputId: string) {
		return this.unaryOperation('sqrt', inputId);
	}

	log(inputId: string) {
		return this.unaryOperation('log', inputId);
	}

	exp(inputId: string) {
		return this.unaryOperation('exp', inputId);
	}

	floor(inputId: string) {
		return this.unaryOperation('floor', inputId);
	}

	round(inputId: string) {
		return this.unaryOperation('round', inputId);
	}

	ceil(inputId: string) {
		return this.unaryOperation('ceil', inputId);
	}

	result(inputId: string) {
		const resultId = this.addNode({
			id: this.nodeId('result', 'result'),
			kind: 'result',
			x: 760,
			y: 140
		});
		this.connect(inputId, resultId, 'out', 'in');
	}

	graph(): MechanicCalculationGraphState {
		return {
			nodes: this.nodes,
			edges: this.edges
		};
	}

	private multiOperation(
		operation: 'sum' | 'multiply',
		inputIds: string[]
	) {
		const operationId = this.addOperationNode(operation);
		inputIds.forEach(inputId => this.connect(inputId, operationId, 'out', 'in'));
		return operationId;
	}

	private binaryOperation(
		operation: 'subtract' | 'divide' | 'power',
		leftId: string,
		rightId: string
	) {
		const operationId = this.addOperationNode(operation);
		this.connect(leftId, operationId, 'out', 'a');
		this.connect(rightId, operationId, 'out', 'b');
		return operationId;
	}

	private unaryOperation(
		operation: 'sqrt' | 'log' | 'exp' | 'floor' | 'round' | 'ceil',
		inputId: string
	) {
		const operationId = this.addOperationNode(operation);
		this.connect(inputId, operationId, 'out', 'in');
		return operationId;
	}

	private addOperationNode(operation: MechanicCalculationOperation) {
		return this.addNode({
			id: this.nodeId('operation', operation),
			kind: 'operation',
			x: 280 + (this.nodeIndex % 4) * 120,
			y: 80 + this.nodeIndex * 36,
			operation
		});
	}

	private addNode(node: MechanicCalculationGraphState['nodes'][number]) {
		this.nodes.push(node);
		this.nodeIndex += 1;
		return node.id;
	}

	private connect(
		source: string,
		target: string,
		sourceHandle: string,
		targetHandle: string
	) {
		this.edges.push({
			id: `edge-${this.edgeIndex++}`,
			source,
			target,
			sourceHandle,
			targetHandle
		});
	}

	private nodeId(kind: string, label: string) {
		return `${kind}-${label}-${this.nodeIndex}`;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
