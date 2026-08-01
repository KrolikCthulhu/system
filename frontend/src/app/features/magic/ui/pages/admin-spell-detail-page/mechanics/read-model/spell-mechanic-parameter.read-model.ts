import { computed, inject, Injectable } from '@angular/core';
import { SpellTargetConfig } from '../../../../../domain/spell.models';
import { SpellMechanicParameter } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { formatMechanicCalculationFormula } from '../../../../../../spell-mechanics/ui/mechanic-calculation-graph.formula';
import {
	TargetConfigLike,
	TargetTemplateId,
	TargetTemplateOptionGroup,
	createTargetTemplateOptionGroups,
	findTargetPresetTemplate,
	targetConfigPreview,
	targetConfigText,
	targetMatchesTemplate,
	targetRuntimeSummary
} from '../../utils/spell-target-config.utils';
import {
	ESSENCE_PROFILE_SOURCE_OPTIONS,
	PROGRESSION_SOURCE_KIND_OPTIONS,
	ProgressionSourceKind,
	ROUNDING_MODE_OPTIONS,
	SpellProgressionParameterValue,
	ConfigField,
	NumericParameterPreview,
	autoParameterFormulaLabel,
	autoParameterSourceLabels,
	buildFormulaLabel,
	evaluateAutoParameterValue,
	evaluateFormulaGraphPreview,
	evaluateRoundedProgression,
	formatPreviewNumber,
	getConfigFields,
	graphRoundingLabel,
	graphSourceLabels,
	isAutoParameterValue,
	isFormulaParameterValue,
	isProgressionParameterValue,
	parameterValueText,
	progressionSourceFormulaSourceId,
	roundingLabel,
	roundingMode,
	supportsNumericParameterKind
} from '../../utils/spell-numeric-parameter.utils';
import {
	CasterLevelMatrixPreview,
	CommandSelectOption,
	SpellMechanicBlockDraft,
	SpellMechanicParameterHeaderPreview,
	SpellParameterValueMode
} from '../../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../../state/admin-spell-detail-page.store';
import { createSpellFormulaSourceNames } from './spell-formula-source.read-model';

@Injectable()
export class SpellMechanicParameterReadModel {
	private readonly store = inject(AdminSpellDetailPageStore);

	readonly parameterValueModeOptions: Array<{
		label: string;
		value: SpellParameterValueMode;
	}> = [
		{ label: 'Значение', value: 'static' },
		{ label: 'Авто', value: 'auto' },
		{ label: 'Прогрессия', value: 'progression' },
		{ label: 'Формула', value: 'formula' }
	];
	readonly progressionSourceKindOptions = PROGRESSION_SOURCE_KIND_OPTIONS;
	readonly roundingModeOptions = ROUNDING_MODE_OPTIONS;
	readonly progressionPresetOptions = computed(() =>
		this.store
			.progressionPresets()
			.filter(preset => preset.isActive)
			.sort(compareByOrderAndName)
			.map(preset => ({
				label: preset.name,
				value: preset.id
			}))
	);

	mechanicBlockParameters(block: SpellMechanicBlockDraft) {
		return this.findMechanic(block.mechanicId)?.parameters ?? [];
	}

	supportsProgression(parameter: SpellMechanicParameter) {
		return supportsNumericParameterKind(parameter.kind);
	}

	parameterHeaderPreview(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	): SpellMechanicParameterHeaderPreview | null {
		const matrixPreview = this.casterLevelMatrixPreview(block, parameter);

		if (matrixPreview) {
			return {
				items: matrixPreview.columnRanges.map(item => ({
					level: item.level,
					label: item.label
				})),
				rangeLabel: `${matrixPreview.minValue}-${matrixPreview.maxValue}`
			};
		}

		const preview = this.numericParameterPreview(block, parameter);

		return preview
			? {
					items: preview.values.map(item => ({
						level: item.x,
						label: item.value
					})),
					rangeLabel: null
				}
			: null;
	}

	parameterValueMode(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellParameterValueMode {
		const value = this.rawParameterValue(block, parameterId);

		if (isProgressionParameterValue(value)) {
			return 'progression';
		}

		if (isFormulaParameterValue(value)) {
			return 'formula';
		}

		if (isAutoParameterValue(value)) {
			return 'auto';
		}

		return 'static';
	}

	progressionParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellProgressionParameterValue | null {
		const value = this.rawParameterValue(block, parameterId);
		return isProgressionParameterValue(value) ? value : null;
	}

	isMechanicParameterExpanded(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return this.store.isMechanicParameterExpanded(
			this.mechanicParameterCollapseKey(block, parameter)
		);
	}

	shouldShowProgressionSourceKey(value: SpellProgressionParameterValue) {
		return (
			value.sourceKind === 'essenceProfile' || value.sourceKind === 'skillLevel'
		);
	}

	progressionSourceKeyLabel(value: SpellProgressionParameterValue) {
		return value.sourceKind === 'skillLevel' ? 'Параметр навыка' : 'Профиль';
	}

	progressionSourceKeyOptions(
		block: SpellMechanicBlockDraft,
		value: SpellProgressionParameterValue
	): CommandSelectOption[] {
		if (value.sourceKind === 'skillLevel') {
			return this.mechanicBlockParameters(block)
				.filter(parameter => parameter.kind === 'skill')
				.sort(compareByOrderAndName)
				.map(parameter => ({
					label: parameter.name,
					value: parameterStorageKey(parameter)
				}));
		}

		if (value.sourceKind === 'essenceProfile') {
			return ESSENCE_PROFILE_SOURCE_OPTIONS.map(option => ({
				label: option.label,
				value: option.value
			}));
		}

		return [];
	}

	defaultProgressionSourceKey(
		block: SpellMechanicBlockDraft,
		sourceKind: ProgressionSourceKind
	) {
		if (sourceKind === 'skillLevel') {
			return (
				this.progressionSourceKeyOptions(block, {
					mode: 'progression',
					sourceKind,
					sourceKey: '',
					presetId: '',
					config: {}
				})[0]?.value ?? ''
			);
		}

		return sourceKind === 'essenceProfile' ? 'damage' : '';
	}

	progressionConfigFields(
		value: SpellProgressionParameterValue
	): ConfigField[] {
		const preset = this.progressionParameterPreset(value);
		return preset ? getConfigFields(preset.kind) : [];
	}

	numericParameterPreview(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	): NumericParameterPreview {
		const value = this.rawParameterValue(block, parameter.id);
		const sourceNames = this.formulaSourceNamesForBlock(block);
		const previewSteps = this.progressionPreviewSteps();

		if (isProgressionParameterValue(value)) {
			const preset = this.progressionParameterPreset(value);
			const sourceName =
				sourceNames.get(progressionSourceFormulaSourceId(value)) ??
				'Источник не выбран';

			return {
				formula: preset
					? buildFormulaLabel(preset.kind, value.config)
					: 'Пресет не выбран',
				sources: [sourceName],
				rounding: roundingLabel(roundingMode(value.config)),
				values: previewSteps.map(x => ({
					x,
					value: preset
						? formatPreviewNumber(
								evaluateRoundedProgression(preset.kind, value.config, x)
							)
						: '0'
				}))
			};
		}

		if (isFormulaParameterValue(value)) {
			return {
				formula: formatMechanicCalculationFormula(value.graph, sourceNames),
				sources: graphSourceLabels(value.graph, sourceNames),
				rounding: graphRoundingLabel(value.graph),
				values: previewSteps.map(x => ({
					x,
					value: formatPreviewNumber(
						evaluateFormulaGraphPreview(value.graph, x)
					)
				}))
			};
		}

		if (isAutoParameterValue(value)) {
			return {
				formula: autoParameterFormulaLabel(value, sourceNames),
				sources: autoParameterSourceLabels(value, sourceNames),
				rounding: roundingLabel(value.roundingMode),
				values: previewSteps.map(x => ({
					x,
					value: formatPreviewNumber(
						evaluateAutoParameterValue(value, x, {
							scaleMaxX: this.maxActiveSkillLevel()
						})
					)
				}))
			};
		}

		const staticValue = this.staticParameterValue(block, parameter.id);

		return {
			formula: staticValue || '0',
			sources: [],
			rounding: 'Не применяется',
			values: previewSteps.map(x => ({
				x,
				value: staticValue || '0'
			}))
		};
	}

	casterLevelMatrixPreview(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	): CasterLevelMatrixPreview | null {
		const value = this.rawParameterValue(block, parameter.id);

		if (!isAutoParameterValue(value)) {
			return null;
		}

		const casterLevelValue = this.casterLevelSystemValue();

		if (!casterLevelValue) {
			return null;
		}

		const casterLevelSources = value.sources.filter(
			source =>
				source.sourceKind === 'systemValue' &&
				this.matchesSystemValueSource(source.sourceKey, casterLevelValue)
		);

		if (!casterLevelSources.length) {
			return null;
		}

		const columns = this.progressionPreviewSteps();
		const rowValues = this.casterLevelPreviewPoints().map(casterLevel => {
			const overrides = new Map(
				casterLevelSources.map(source => [source.id, casterLevel] as const)
			);
			const rawValues = columns.map(x =>
				casterLevel < x
					? null
					: evaluateAutoParameterValue(value, x, {
							sourceValueOverrides: overrides,
							scaleMaxX: this.maxActiveSkillLevel()
						})
			);

			return {
				casterLevel,
				rawValues,
				values: rawValues.map(item =>
					item === null ? '-' : formatPreviewNumber(item)
				)
			};
		});
		const rangeColumns = columns
			.map((level, index) => ({ level, index }))
			.filter(item => item.level > 0);
		const rangeValues = rowValues.flatMap(row =>
			rangeColumns
				.map(column => row.rawValues[column.index])
				.filter((item): item is number => item !== null)
		);

		if (!rangeValues.length) {
			return null;
		}

		return {
			columns,
			columnRanges: columns.map((level, index) => {
				const values = rowValues
					.map(row => row.rawValues[index])
					.filter((item): item is number => item !== null);
				const minValue = values.length ? Math.min(...values) : 0;
				const maxValue = values.length ? Math.max(...values) : 0;
				const formattedMin = formatPreviewNumber(minValue);
				const formattedMax = formatPreviewNumber(maxValue);

				return {
					level,
					minValue: formattedMin,
					maxValue: formattedMax,
					label:
						formattedMin === formattedMax
							? formattedMin
							: `${formattedMin}-${formattedMax}`
				};
			}),
			rows: rowValues.map(row => ({
				casterLevel: row.casterLevel,
				values: row.values
			})),
			minValue: formatPreviewNumber(Math.min(...rangeValues)),
			maxValue: formatPreviewNumber(Math.max(...rangeValues))
		};
	}

	isCasterLevelMatrixExpanded(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return this.store
			.expandedCasterLevelMatrixKeys()
			.has(this.casterLevelMatrixKey(block, parameter));
	}

	mechanicTargetConfig(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellTargetConfig | null {
		const targetId = this.parameterValue(block, parameterId);
		return (
			this.store
				.draft()
				?.targetConfigs.find(target => target.id === targetId) ?? null
		);
	}

	mechanicTargetTemplate(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	): TargetTemplateId {
		const target = this.mechanicTargetConfig(block, parameter.id);

		if (!target) {
			return parameter.defaultTargetConfig ? 'mechanicDefault' : 'custom';
		}

		if (
			parameter.defaultTargetConfig &&
			targetMatchesTemplate(target, parameter.defaultTargetConfig)
		) {
			return 'mechanicDefault';
		}

		return findTargetPresetTemplate(target) ?? 'custom';
	}

	targetTemplateOptionGroupsForParameter(
		parameter: SpellMechanicParameter
	): TargetTemplateOptionGroup[] {
		return createTargetTemplateOptionGroups(parameter.defaultTargetConfig);
	}

	targetCountParameterOptions(
		block: SpellMechanicBlockDraft,
		currentParameterId: string
	): CommandSelectOption[] {
		return this.mechanicBlockParameters(block)
			.filter(
				parameter =>
					parameter.id !== currentParameterId &&
					parameter.slug !== currentParameterId &&
					supportsNumericParameterKind(parameter.kind) &&
					parameter.numericRole === 'targetCount'
			)
			.sort(compareByOrderAndName)
			.map(parameter => ({
				label: parameter.name,
				value: parameterStorageKey(parameter)
			}));
	}

	targetConfigText(target: TargetConfigLike) {
		return targetConfigText(target);
	}

	mechanicTargetPreview(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		const target = this.mechanicTargetConfig(block, parameter.id);

		if (target) {
			return targetConfigPreview(target);
		}

		if (parameter.defaultTargetConfig) {
			return `По умолчанию: ${targetConfigPreview(parameter.defaultTargetConfig)}`;
		}

		return 'Требуется настройка цели';
	}

	mechanicTargetRuntimeSummary(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		const target = this.mechanicTargetConfig(block, parameter.id);
		const fallback = parameter.defaultTargetConfig;
		const config = target ?? fallback;

		if (!config) {
			return 'Runtime: цель не задана';
		}

		return targetRuntimeSummary(config);
	}

	usesParameterSelect(kind: SpellMechanicParameter['kind']) {
		return (
			kind === 'target' ||
			kind === 'skill' ||
			kind === 'damageType' ||
			kind === 'condition'
		);
	}

	parameterOptions(parameter: SpellMechanicParameter): SelectOptionGroup[] {
		switch (parameter.kind) {
			case 'target':
				return createSingleOptionGroup(
					'Цели заклинания',
					(this.store.draft()?.targetConfigs ?? [])
						.slice()
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			case 'skill':
				return createSkillOptionGroups(
					this.store.skillCategories(),
					this.store.skills()
				);
			case 'damageType':
				return createSingleOptionGroup(
					'Типы урона',
					this.store
						.damageTypes()
						.filter(item => item.isActive)
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			case 'condition':
				return createSingleOptionGroup(
					'Состояния',
					this.store
						.conditions()
						.filter(item => item.isActive)
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			default:
				return [];
		}
	}

	parameterValue(block: SpellMechanicBlockDraft, parameterId: string) {
		return parameterValueText(this.rawParameterValue(block, parameterId));
	}

	staticParameterValue(block: SpellMechanicBlockDraft, parameterId: string) {
		return parameterValueText(this.rawParameterValue(block, parameterId));
	}

	parameterKindLabel(kind: SpellMechanicParameter['kind']) {
		switch (kind) {
			case 'target':
				return 'Цель';
			case 'skill':
				return 'Навык';
			case 'number':
				return 'Число';
			case 'formula':
				return 'Формула';
			case 'damageType':
				return 'Тип урона';
			case 'condition':
				return 'Состояние';
			case 'systemValue':
				return 'Значение';
			case 'text':
				return 'Текст';
		}
	}

	casterLevelMatrixKey(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return `${block.id}:${parameterStorageKey(parameter)}:caster-level`;
	}

	mechanicParameterCollapseKey(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return `${block.id}:${parameterStorageKey(parameter)}`;
	}

	rawParameterValue(block: SpellMechanicBlockDraft, parameterIdOrSlug: string) {
		const key = this.parameterStorageKey(block, parameterIdOrSlug);

		return block.parameterValues[key];
	}

	private progressionPreviewSteps() {
		return this.store
			.skillLevels()
			.filter(level => level.isActive)
			.sort((left, right) => left.level - right.level)
			.map(level => level.level);
	}

	private casterLevelPreviewPoints() {
		const maxCasterLevel = this.maxPossibleCasterLevel();
		const points = BASE_CASTER_LEVEL_PREVIEW_POINTS.filter(
			point => point <= maxCasterLevel
		);

		if (maxCasterLevel > 0 && !points.includes(maxCasterLevel)) {
			points.push(maxCasterLevel);
		}

		return Array.from(new Set(points)).sort((left, right) => left - right);
	}

	private maxPossibleCasterLevel() {
		const maxSkillLevel = this.maxActiveSkillLevel();
		const understandingsCount = this.store
			.skills()
			.filter(skill => skill.isActive && isUnderstandingSkill(skill)).length;

		return maxSkillLevel * understandingsCount;
	}

	private maxActiveSkillLevel() {
		return Math.max(
			0,
			...this.store
				.skillLevels()
				.filter(level => level.isActive)
				.map(level => level.level)
		);
	}

	private formulaSourceNamesForBlock(block: SpellMechanicBlockDraft) {
		return createSpellFormulaSourceNames(this.formulaSourceContext(block), {
			skillSourceMode: 'preview'
		});
	}

	private formulaSourceContext(block: SpellMechanicBlockDraft) {
		return {
			block,
			conditions: this.store.conditions(),
			damageTypes: this.store.damageTypes(),
			mechanics: this.store.spellMechanics(),
			progressionPresets: this.store.progressionPresets(),
			skillCategories: this.store.skillCategories(),
			skills: this.store.skills(),
			systemValues: this.store.systemValues(),
			targetConfigs: this.store.draft()?.targetConfigs ?? []
		};
	}

	private parameterStorageKey(
		block: SpellMechanicBlockDraft,
		parameterIdOrSlug: string
	) {
		const parameter = this.findMechanic(block.mechanicId)?.parameters.find(
			item => item.id === parameterIdOrSlug || item.slug === parameterIdOrSlug
		);

		return parameter ? parameterStorageKey(parameter) : parameterIdOrSlug;
	}

	private progressionParameterPreset(value: SpellProgressionParameterValue) {
		return (
			this.store
				.progressionPresets()
				.find(preset => preset.id === value.presetId) ?? null
		);
	}

	private casterLevelSystemValue() {
		return (
			this.store
				.systemValues()
				.find(
					value =>
						value.name === 'Уровень Заклинателя' ||
						value.slug === 'uroven-zaklinatelya'
				) ?? null
		);
	}

	private matchesSystemValueSource(
		sourceKey: string,
		value: { id: string; slug: string }
	) {
		return sourceKey === value.id || sourceKey === value.slug;
	}

	private findMechanic(mechanicId: string) {
		return (
			this.store
				.spellMechanics()
				.find(mechanic => mechanic.id === mechanicId) ?? null
		);
	}
}

function parameterStorageKey(parameter: SpellMechanicParameter) {
	return parameter.slug || parameter.id;
}

function createSkillOptionGroups(
	categories: Array<{
		id: string;
		name: string;
		isActive: boolean;
		sortOrder?: number;
	}>,
	skills: Array<{
		id: string;
		name: string;
		isActive: boolean;
		categoryId: string;
		sortOrder?: number;
	}>
): SelectOptionGroup[] {
	return categories
		.filter(category => category.isActive)
		.sort(compareByOrderAndName)
		.map(category => ({
			label: category.name,
			items: skills
				.filter(skill => skill.isActive && skill.categoryId === category.id)
				.sort(compareByOrderAndName)
				.map(toSelectOption)
		}))
		.filter(group => group.items.length);
}

function createSingleOptionGroup<TItem>(
	label: string,
	items: TItem[]
): Array<{ label: string; items: TItem[] }> {
	return items.length ? [{ label, items }] : [];
}

function toSelectOption(item: { id: string; name: string }): SelectOption {
	return {
		id: item.id,
		name: item.name,
		searchText: item.name.toLowerCase()
	};
}

function compareByOrderAndName<T extends { sortOrder?: number; name: string }>(
	left: T,
	right: T
) {
	return (
		(left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
			(right.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
		left.name.localeCompare(right.name, 'ru')
	);
}

function isUnderstandingSkill(skill: { name: string; slug?: string | null }) {
	return (
		skill.slug?.toLowerCase().includes('ponimanie') ||
		skill.name.toLowerCase().includes('понимание')
	);
}

const BASE_CASTER_LEVEL_PREVIEW_POINTS = [0, 1, 3, 5, 8, 10, 15, 20];

interface SelectOption {
	id: string;
	name: string;
	searchText: string;
}

interface SelectOptionGroup {
	label: string;
	items: SelectOption[];
}
