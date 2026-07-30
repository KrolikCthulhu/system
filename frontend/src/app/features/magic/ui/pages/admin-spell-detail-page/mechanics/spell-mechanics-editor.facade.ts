import { computed, inject, Injectable } from '@angular/core';
import { ProgressionPresetRoundingMode } from '../../../../../progression-presets/domain/progression-presets.models';
import {
	SpellEffectScaleConfig,
	SpellEffectScaleItemConfig,
	SpellEffectScaleMode,
	SpellMechanicApplicationConfig,
	SpellMechanicBlockConfig,
	SpellNestedMechanicBlockConfig,
	SpellTargetConfig
} from '../../../../domain/spell.models';
import { MagicWord } from '../../../../domain/magic-word.models';
import {
	SpellMechanic,
	SpellMechanicParameter
} from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { MechanicCalculationSourceGroup } from '../../../../../spell-mechanics/ui/mechanic-calculation-graph.models';
import { formatMechanicCalculationFormula } from '../../../../../spell-mechanics/ui/mechanic-calculation-graph.formula';
import {
	renderApplicationText,
	renderMechanicTextTemplate
} from '../utils/mechanic-text-template-renderer';
import {
	TargetConfigLike,
	TargetTemplateId,
	TargetTemplateOptionGroup,
	createTargetConfigFromMechanicDefault,
	createTargetPreset,
	createTargetTemplateOptionGroups,
	findTargetPresetTemplate,
	targetConfigPreview,
	targetConfigText,
	targetMatchesTemplate,
	targetRuntimeSummary
} from '../utils/spell-target-config.utils';
import {
	AUTO_VALUE_CHARACTER_OPTIONS,
	AUTO_VALUE_SCALE_OPTIONS,
	AUTO_VALUE_SOURCE_CURVE_OPTIONS,
	AUTO_VALUE_SOURCE_KIND_OPTIONS,
	AUTO_VALUE_SOURCE_MODE_OPTIONS,
	AUTO_VALUE_SOURCE_TARGET_OPTIONS,
	AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS,
	AutoValueSourceKind,
	AutoValueSourceMode,
	ESSENCE_PROFILE_SOURCE_OPTIONS,
	PROGRESSION_SOURCE_KIND_OPTIONS,
	ProgressionSourceKind,
	ROUNDING_MODE_OPTIONS,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellFormulaParameterValue,
	SpellParameterValue,
	SpellProgressionParameterValue,
	ConfigField,
	NumericParameterPreview,
	autoParameterFormulaLabel,
	autoParameterSourceLabels,
	buildFormulaLabel,
	createAutoParameterSource,
	createAutoParameterValue,
	createAutoPreset,
	createAutoPresetOptions,
	createAutoSourcesForMode,
	createFormulaParameterValue,
	createGraphFromProgression,
	createProgressionParameterValue,
	createStaticParameterValue,
	evaluateAutoParameterValue,
	evaluateFormulaGraphPreview,
	evaluateRoundedProgression,
	formatPreviewNumber,
	formulaSourceId,
	getConfigFields,
	graphRoundingLabel,
	graphSourceLabels,
	isAutoParameterValue,
	isFormulaParameterValue,
	isProgressionParameterValue,
	isStaticParameterValue,
	isAutoSourceMechanicParameter,
	parameterValueText,
	progressionSourceFormulaSourceId,
	roundingLabel,
	roundingMode,
	supportsNumericParameterKind,
	systemValueSourceLabel
} from '../utils/spell-numeric-parameter.utils';
import {
	CasterLevelMatrixPreview,
	CommandSelectOption,
	SpellDraft,
	SpellMechanicBlockDraft,
	SpellMechanicParameterHeaderPreview,
	SpellParameterValueMode
} from '../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import { SpellMechanicDraftFacade } from '../application/spell-mechanic-draft.facade';
import {
	formatFormulaSourceValueSummary,
	formatParameterPreviewLabel
} from './read-model/spell-mechanic-parameter-labels';

@Injectable()
export class SpellMechanicsEditorFacade {
	private readonly pageStore = inject(AdminSpellDetailPageStore);
	private readonly draftFacade = inject(SpellMechanicDraftFacade);

	readonly parameterValueModeOptions: Array<{
		label: string;
		value: SpellParameterValueMode;
	}> = [
		{ label: 'Значение', value: 'static' },
		{ label: 'Авто', value: 'auto' },
		{ label: 'Прогрессия', value: 'progression' },
		{ label: 'Формула', value: 'formula' }
	];
	readonly effectScaleModeOptions: Array<{
		label: string;
		value: SpellEffectScaleMode;
	}> = [
		{ label: 'Лучший доступный', value: 'best' },
		{ label: 'Выбор доступного', value: 'choice' },
		{ label: 'Все доступные', value: 'all' },
		{ label: 'Точное совпадение', value: 'exact' }
	];
	readonly progressionSourceKindOptions = PROGRESSION_SOURCE_KIND_OPTIONS;
	readonly roundingModeOptions = ROUNDING_MODE_OPTIONS;
	readonly autoValueCharacterOptions = AUTO_VALUE_CHARACTER_OPTIONS;
	readonly autoValueScaleOptions = AUTO_VALUE_SCALE_OPTIONS;
	readonly autoValueSourceModeOptions = AUTO_VALUE_SOURCE_MODE_OPTIONS;
	readonly autoValueSourceKindOptions = AUTO_VALUE_SOURCE_KIND_OPTIONS;
	readonly autoValueSourceTargetOptions = AUTO_VALUE_SOURCE_TARGET_OPTIONS;
	readonly autoValueSourceCurveOptions = AUTO_VALUE_SOURCE_CURVE_OPTIONS;
	readonly autoValueSourceTransformOptions =
		AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS;
	readonly autoValueRangeModeOptions: Array<{
		label: string;
		value: SpellAutoParameterValue['rangeMode'];
	}> = [
		{ label: 'Без диапазона', value: 'none' },
		{ label: 'Масштабировать', value: 'scale' }
	];
	readonly autoPresetPanelStyle = {
		width: '12rem',
		maxWidth: '12rem',
		overflowX: 'hidden'
	};
	readonly draft = this.pageStore.draft;
	readonly selectedIndex = this.pageStore.selectedMechanicBlockIndex;
	readonly selectedBlock = computed(() => {
		const index = this.selectedIndex();
		return index === null
			? null
			: (this.draft()?.mechanicBlocks[index] ?? null);
	});
	readonly mechanicOptions = computed(() =>
		this.pageStore
			.spellMechanics()
			.filter(mechanic => mechanic.isActive)
			.sort(compareByOrderAndName)
			.map(mechanic => ({
				label: mechanic.name,
				value: mechanic.id
			}))
	);
	readonly progressionPresetOptions = computed(() =>
		this.pageStore
			.progressionPresets()
			.filter(preset => preset.isActive)
			.sort(compareByOrderAndName)
			.map(preset => ({
				label: preset.name,
				value: preset.id
			}))
	);

	addMechanicBlock() {
		const mechanic = this.pageStore
			.spellMechanics()
			.filter(item => item.isActive)
			.sort(compareByOrderAndName)[0];

		this.pageStore.openAddMechanicWizard(mechanic?.id ?? null);
	}

	selectMechanicBlock(index: number) {
		this.pageStore.setSelectedMechanicBlockIndex(index);
	}

	moveMechanicBlock(index: number, direction: -1 | 1) {
		const draft = this.draft();
		const nextIndex = index + direction;

		if (!draft || nextIndex < 0 || nextIndex >= draft.mechanicBlocks.length) {
			return;
		}

		const blocks = [...draft.mechanicBlocks];
		const current = blocks[index];
		const next = blocks[nextIndex];

		if (!current || !next) {
			return;
		}

		blocks[index] = next;
		blocks[nextIndex] = current;
		this.pageStore.patchDraft({
			mechanicBlocks: blocks.map((block, blockIndex) => ({
				...block,
				sortOrder: blockIndex
			}))
		});
		this.pageStore.selectMovedMechanicBlock(index, direction);
	}

	updateSelectedMechanicBlockMechanic(mechanicId: string) {
		const index = this.selectedIndex();

		if (index !== null) {
			this.updateMechanicBlockMechanic(index, mechanicId);
		}
	}

	updateSelectedMechanicBlockActive(isActive: boolean) {
		const index = this.selectedIndex();

		if (index !== null) {
			this.updateMechanicBlockActive(index, isActive);
		}
	}

	deleteSelectedMechanicBlock() {
		const index = this.selectedIndex();

		if (index !== null) {
			this.deleteMechanicBlock(index);
		}
	}

	mechanicApplicationConfig(
		block: SpellMechanicBlockDraft
	): SpellMechanicApplicationConfig {
		return normalizeApplicationConfig(
			block.config.application ??
				readDefaultApplicationConfig(
					this.findMechanic(block.mechanicId)?.configSchema ?? {}
				)
		);
	}

	mechanicApplicationText(block: SpellMechanicBlockDraft) {
		return renderApplicationText(this.mechanicApplicationConfig(block));
	}

	mechanicName(block: SpellMechanicBlockDraft) {
		return this.findMechanic(block.mechanicId)?.name ?? 'Механика не найдена';
	}

	mechanicBlockTextPreview(block: SpellMechanicBlockDraft) {
		const mechanic = this.findMechanic(block.mechanicId);

		if (!mechanic) {
			return 'Механика не найдена.';
		}

		return renderMechanicTextTemplate(
			mechanic.textTemplate,
			mechanic,
			block.parameterValues,
			this.mechanicApplicationConfig(block),
			value => this.parameterValueLabel(value.kind, value.value)
		);
	}

	isMechanicBlockInvalid(block: SpellMechanicBlockDraft) {
		return this.mechanicReadinessStatus(block).severity === 'warn';
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
				rangeLabel: `${matrixPreview.minValue}–${matrixPreview.maxValue}`
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

	formulaPreview(block: SpellMechanicBlockDraft, parameterId: string) {
		return formatMechanicCalculationFormula(
			this.formulaParameterValue(block, parameterId)?.graph,
			this.formulaSourceNamesForBlock(block)
		);
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
					item === null ? '—' : formatPreviewNumber(item)
				)
			};
		});
		const rangeColumns = columns
			.map((level, index) => ({ level, index }))
			.filter(item => item.level > 0);
		const rangeValues = rowValues.flatMap(row =>
			rangeColumns
				.map(column => row.rawValues[column.index])
				.filter((value): value is number => value !== null)
		);

		if (!rangeValues.length) {
			return null;
		}

		return {
			columns,
			columnRanges: columns.map((level, index) => {
				const values = rowValues
					.map(row => row.rawValues[index])
					.filter((value): value is number => value !== null);
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
							: `${formattedMin}–${formattedMax}`
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
		return this.pageStore
			.expandedCasterLevelMatrixKeys()
			.has(this.casterLevelMatrixKey(block, parameter));
	}

	toggleCasterLevelMatrix(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		this.pageStore.toggleCasterLevelMatrixExpanded(
			this.casterLevelMatrixKey(block, parameter)
		);
	}

	updateSelectedMechanicApplication(
		patch: Partial<SpellMechanicApplicationConfig>
	) {
		const index = this.selectedIndex();
		const block = index === null ? null : this.draft()?.mechanicBlocks[index];

		if (index === null || !block) {
			return;
		}

		this.updateMechanicBlock(index, {
			...block,
			config: {
				...block.config,
				application: {
					...this.mechanicApplicationConfig(block),
					...patch
				}
			}
		});
	}

	mechanicBlockParameters(block: SpellMechanicBlockDraft) {
		return this.findMechanic(block.mechanicId)?.parameters ?? [];
	}

	supportsProgression(parameter: SpellMechanicParameter) {
		return supportsNumericParameterKind(parameter.kind);
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

	staticParameterValue(block: SpellMechanicBlockDraft, parameterId: string) {
		return parameterValueText(this.rawParameterValue(block, parameterId));
	}

	parameterValue(block: SpellMechanicBlockDraft, parameterId: string) {
		const value = this.rawParameterValue(block, parameterId);
		return parameterValueText(value);
	}

	parameterOptions(parameter: SpellMechanicParameter): SelectOptionGroup[] {
		switch (parameter.kind) {
			case 'target':
				return createSingleOptionGroup(
					'Цели заклинания',
					(this.draft()?.targetConfigs ?? [])
						.slice()
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			case 'skill':
				return createSkillOptionGroups(
					this.pageStore.skillCategories(),
					this.pageStore.skills()
				);
			case 'damageType':
				return createSingleOptionGroup(
					'Типы урона',
					this.pageStore
						.damageTypes()
						.filter(item => item.isActive)
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			case 'condition':
				return createSingleOptionGroup(
					'Состояния',
					this.pageStore
						.conditions()
						.filter(item => item.isActive)
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			default:
				return [];
		}
	}

	usesParameterSelect(kind: SpellMechanicParameter['kind']) {
		return (
			kind === 'target' ||
			kind === 'skill' ||
			kind === 'damageType' ||
			kind === 'condition'
		);
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

	mechanicTargetConfig(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellTargetConfig | null {
		const targetId = this.parameterValue(block, parameterId);
		return (
			this.draft()?.targetConfigs.find(target => target.id === targetId) ?? null
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

	updateMechanicTargetConfig(
		block: SpellMechanicBlockDraft,
		parameterId: string,
		patch: Partial<SpellTargetConfig>
	) {
		const targetId = this.parameterValue(block, parameterId);
		this.draftFacade.updateMechanicTargetConfig(targetId, patch);
	}

	updateMechanicTargetTemplate(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter,
		templateId: TargetTemplateId
	) {
		this.draftFacade.updateMechanicTargetTemplate(
			block,
			parameter.id,
			templateId
		);
	}

	progressionConfigFields(
		value: SpellProgressionParameterValue
	): ConfigField[] {
		const preset = this.progressionParameterPreset(value);
		return preset ? getConfigFields(preset.kind) : [];
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

	updateSelectedProgressionSourceKind(
		block: SpellMechanicBlockDraft,
		parameterId: string,
		sourceKind: ProgressionSourceKind
	) {
		const nextSourceKey =
			sourceKind === 'skillLevel'
				? (this.progressionSourceKeyOptions(block, {
						mode: 'progression',
						sourceKind,
						sourceKey: '',
						presetId: '',
						config: {}
					})[0]?.value ?? '')
				: sourceKind === 'essenceProfile'
					? 'damage'
					: '';

		this.draftFacade.updateSelectedProgressionSourceKind(
			parameterId,
			sourceKind,
			nextSourceKey
		);
	}

	readonly autoTransformSourceOptions = (
		value: SpellAutoParameterValue,
		currentSource: SpellAutoParameterSource
	) => {
		return [
			{
				label: 'Влияния',
				items: value.sources
					.filter(source => source.id !== currentSource.id)
					.map((source, index) => ({
						label: `${index + 1}. ${this.autoSourceKindLabel(source.sourceKind)}`,
						value: source.sourceKey || source.id
					}))
			}
		];
	};

	progressionParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellProgressionParameterValue | null {
		const value = this.rawParameterValue(block, parameterId);
		return isProgressionParameterValue(value) ? value : null;
	}

	formulaParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellFormulaParameterValue | null {
		const value = this.rawParameterValue(block, parameterId);
		return isFormulaParameterValue(value) ? value : null;
	}

	autoParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellAutoParameterValue | null {
		const value = this.rawParameterValue(block, parameterId);
		return isAutoParameterValue(value) ? value : null;
	}

	updateSelectedMechanicBlockParameter(
		parameterId: string,
		value: SpellParameterValue | null
	) {
		const index = this.selectedIndex();

		if (index !== null) {
			this.updateMechanicBlockParameter(index, parameterId, value);
		}
	}

	updateSelectedPlainParameterValue(
		parameter: SpellMechanicParameter,
		value: string
	) {
		this.updateSelectedMechanicBlockParameter(
			parameter.id,
			this.supportsProgression(parameter)
				? createStaticParameterValue(value)
				: value
		);
	}

	updateSelectedMechanicBlockParameterMode(
		parameterId: string,
		mode: SpellParameterValueMode
	) {
		const index = this.selectedIndex();

		if (index !== null) {
			this.updateMechanicBlockParameterMode(index, parameterId, mode);
		}
	}

	updateSelectedProgressionParameter(
		parameterId: string,
		patch: Partial<SpellProgressionParameterValue>
	) {
		const index = this.selectedIndex();
		const block = this.selectedBlock();

		if (index === null || !block) {
			return;
		}

		const current = this.progressionParameterValue(block, parameterId);

		if (!current) {
			return;
		}

		this.updateMechanicBlockParameter(index, parameterId, {
			...current,
			...patch
		});
	}

	updateSelectedProgressionPreset(parameterId: string, presetId: string) {
		const preset = this.pageStore
			.progressionPresets()
			.find(item => item.id === presetId);

		this.updateSelectedProgressionParameter(parameterId, {
			presetId,
			config: { ...(preset?.config ?? {}) }
		});
	}

	updateSelectedProgressionConfig(
		parameterId: string,
		key: string,
		value: unknown
	) {
		const block = this.selectedBlock();
		const current = block
			? this.progressionParameterValue(block, parameterId)
			: null;

		if (!current) {
			return;
		}

		this.updateSelectedProgressionParameter(parameterId, {
			config: {
				...current.config,
				[key]: typeof value === 'number' ? value : 0
			}
		});
	}

	updateSelectedProgressionRoundingMode(
		parameterId: string,
		roundingModeValue: ProgressionPresetRoundingMode
	) {
		const block = this.selectedBlock();
		const current = block
			? this.progressionParameterValue(block, parameterId)
			: null;

		if (!current) {
			return;
		}

		this.updateSelectedProgressionParameter(parameterId, {
			config: {
				...current.config,
				roundingMode: roundingModeValue
			}
		});
	}

	updateSelectedAutoParameter(
		parameterId: string,
		patch: Partial<SpellAutoParameterValue>
	) {
		const index = this.selectedIndex();
		const block = this.selectedBlock();

		if (index === null || !block) {
			return;
		}

		const current = this.autoParameterValue(block, parameterId);

		if (!current) {
			return;
		}

		this.updateMechanicBlockParameter(index, parameterId, {
			...current,
			...patch
		});
	}

	updateSelectedAutoSourceMode(
		parameterId: string,
		sourceMode: AutoValueSourceMode
	) {
		const block = this.selectedBlock();
		const current = block ? this.autoParameterValue(block, parameterId) : null;

		if (!current) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sourceMode,
			sources: createAutoSourcesForMode(sourceMode, current.sources)
		});
	}

	addSelectedAutoSource(parameterId: string) {
		const block = this.selectedBlock();
		const current = block ? this.autoParameterValue(block, parameterId) : null;

		if (!current) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sources: [...current.sources, createAutoParameterSource()]
		});
	}

	updateSelectedAutoSource(
		parameterId: string,
		sourceId: string,
		patch: Partial<SpellAutoParameterSource>
	) {
		const block = this.selectedBlock();
		const current = block ? this.autoParameterValue(block, parameterId) : null;

		if (!current) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sources: current.sources.map(source =>
				source.id === sourceId ? { ...source, ...patch } : source
			)
		});
	}

	deleteSelectedAutoSource(parameterId: string, sourceId: string) {
		const block = this.selectedBlock();
		const current = block ? this.autoParameterValue(block, parameterId) : null;

		if (!current || current.sources.length <= 1) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sources: current.sources.filter(source => source.id !== sourceId)
		});
	}

	autoPresetOptions(parameter: SpellMechanicParameter) {
		return createAutoPresetOptions(parameter.numericRole);
	}

	applySelectedAutoPreset(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter,
		presetId: string | null
	) {
		if (!presetId) {
			return;
		}

		const preset = createAutoPreset(
			presetId,
			parameter.numericRole,
			this.defaultAutoSourceKey(block, 'systemValue'),
			this.defaultAutoSourceKey(block, 'mechanicParameter')
		);

		if (!preset) {
			return;
		}

		this.updateSelectedAutoParameter(parameter.id, preset);
	}

	openSelectedFormulaGraphEditor(parameterId: string) {
		const blockIndex = this.selectedIndex();

		if (blockIndex !== null) {
			this.pageStore.setSelectedFormulaParameter({ blockIndex, parameterId });
		}
	}

	openProgressionAsFormulaGraphEditor(
		block: SpellMechanicBlockDraft,
		parameterId: string
	) {
		const index = this.selectedIndex();
		const progressionValue = this.progressionParameterValue(block, parameterId);
		const preset = progressionValue
			? this.progressionParameterPreset(progressionValue)
			: null;

		if (index === null || !progressionValue || !preset) {
			return;
		}

		this.updateMechanicBlockParameter(index, parameterId, {
			mode: 'formula',
			graph: createGraphFromProgression(
				preset.kind,
				progressionValue.config,
				progressionSourceFormulaSourceId(progressionValue)
			)
		});
		this.openSelectedFormulaGraphEditor(parameterId);
	}

	isMechanicParameterExpanded(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return this.pageStore.isMechanicParameterExpanded(
			this.mechanicParameterCollapseKey(block, parameter)
		);
	}

	toggleMechanicParameterExpanded(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		this.pageStore.toggleMechanicParameterExpanded(
			this.mechanicParameterCollapseKey(block, parameter)
		);
	}

	readonly isAutoSourceCollapsed = (
		scope: string,
		source: SpellAutoParameterSource
	) => {
		return this.pageStore.isAutoSourceCollapsed(
			this.autoSourceCollapseKey(scope, source)
		);
	};

	toggleAutoSourceCollapsed(scope: string, source: SpellAutoParameterSource) {
		this.pageStore.toggleAutoSourceCollapsed(
			this.autoSourceCollapseKey(scope, source)
		);
	}

	defaultAutoSourceKeyRenderer(block: SpellMechanicBlockDraft) {
		return (sourceKind: AutoValueSourceKind) =>
			this.defaultAutoSourceKey(block, sourceKind);
	}

	mechanicAutoSourceKeyOptionsRenderer(block: SpellMechanicBlockDraft) {
		return (source: SpellAutoParameterSource) =>
			this.autoSourceKeyOptions(block, source);
	}

	readonly autoSourceKeyLabel = (source: SpellAutoParameterSource) => {
		switch (source.sourceKind) {
			case 'mechanicParameter':
				return 'Параметр';
			case 'systemValue':
				return 'Значение системы';
			case 'essenceProfile':
				return 'Профиль';
			case 'manual':
				return '';
		}
	};

	readonly autoSourceSummary = (source: SpellAutoParameterSource) => {
		return `${this.autoSourceKindLabel(source.sourceKind)} / ${this.autoSourceTargetLabel(source.target)}`;
	};

	isEffectScaleBlock(block: SpellMechanicBlockDraft) {
		return (
			this.findMechanic(block.mechanicId)?.actions.some(
				action => action.kind === 'effectScale'
			) ?? false
		);
	}

	effectScaleConfig(block: SpellMechanicBlockDraft): SpellEffectScaleConfig {
		return readSpellEffectScaleConfig(block.config['effectScale']);
	}

	readonly effectScaleMechanicParameters = (
		block: SpellNestedMechanicBlockConfig
	) => this.mechanicBlockParameters(block as SpellMechanicBlockDraft);

	readonly effectScaleUsesParameterSelect = (
		kind: SpellMechanicParameter['kind']
	) => this.usesParameterSelect(kind);

	readonly effectScaleParameterOptions = (parameter: SpellMechanicParameter) =>
		this.parameterOptions(parameter);

	readonly effectScaleParameterValue = (
		block: SpellNestedMechanicBlockConfig,
		parameterId: string
	) => this.parameterValue(block as SpellMechanicBlockDraft, parameterId);

	readonly effectScaleStaticParameterValue = (
		block: SpellNestedMechanicBlockConfig,
		parameterId: string
	) => this.staticParameterValue(block as SpellMechanicBlockDraft, parameterId);

	readonly effectScaleConfigChangeHandler = (
		block: SpellMechanicBlockDraft,
		patch: Partial<SpellEffectScaleConfig>
	) => this.updateEffectScaleConfig(block, patch);

	readonly effectScaleNestedMechanicAddHandler = (
		block: SpellMechanicBlockDraft,
		itemId: string
	) => this.addEffectScaleNestedMechanic(block, itemId);

	readonly effectScaleNestedMechanicChangeHandler = (
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		mechanicId: string
	) =>
		this.updateEffectScaleNestedMechanic(
			block,
			itemId,
			nestedBlockId,
			mechanicId
		);

	readonly effectScaleNestedMechanicDeleteHandler = (
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string
	) => this.deleteEffectScaleNestedMechanic(block, itemId, nestedBlockId);

	readonly effectScaleNestedParameterChangeHandler = (
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		parameterId: string,
		value: SpellParameterValue | null
	) =>
		this.updateEffectScaleNestedParameter(
			block,
			itemId,
			nestedBlockId,
			parameterId,
			value
		);

	effectScaleRequirementText(item: SpellEffectScaleItemConfig) {
		if (item.requirement === 'automatic') {
			return 'Без проверки';
		}

		return item.isOpenEnded
			? `${item.threshold}+ успеха`
			: `${item.threshold} успех`;
	}

	effectScaleReadinessIssues(block: SpellMechanicBlockDraft) {
		const config = this.effectScaleConfig(block);
		const issues: string[] = [];

		if (!config.items.length) {
			issues.push('Не заполнена таблица эффектов');
		}

		for (const item of config.items) {
			if (!item.name.trim()) {
				issues.push(
					`Не назван пункт шкалы ${
						item.requirement === 'automatic' ? 'без проверки' : item.threshold
					}`
				);
			}

			for (const nestedBlock of item.mechanicBlocks) {
				const nestedDraft = nestedBlock as SpellMechanicBlockDraft;
				const nestedMechanic = this.findMechanic(nestedDraft.mechanicId);

				if (!nestedMechanic) {
					issues.push(`${item.name}: вложенная механика не найдена`);
					continue;
				}

				for (const parameter of nestedMechanic.parameters.filter(
					value => value.required
				)) {
					if (
						!isConfiguredParameterValue(
							parameter,
							this.rawParameterValue(nestedDraft, parameter.id),
							this.draft()
						)
					) {
						issues.push(
							`${item.name}: ${mechanicParameterMissingLabel(parameter)}`
						);
					}
				}
			}
		}

		return issues;
	}

	private updateEffectScaleConfig(
		block: SpellMechanicBlockDraft,
		patch: Partial<SpellEffectScaleConfig>
	) {
		const index = this.draft()?.mechanicBlocks.findIndex(
			item => item.id === block.id
		);

		if (index === undefined || index < 0) {
			return;
		}

		const currentBlock = this.draft()?.mechanicBlocks[index];

		if (!currentBlock) {
			return;
		}

		this.updateMechanicBlock(index, {
			...currentBlock,
			config: {
				...currentBlock.config,
				effectScale: {
					...this.effectScaleConfig(currentBlock),
					...patch
				}
			}
		});
	}

	private updateEffectScaleItem(
		block: SpellMechanicBlockDraft,
		itemId: string,
		patch: Partial<SpellEffectScaleItemConfig>
	) {
		const config = this.effectScaleConfig(block);

		this.updateEffectScaleConfig(block, {
			items: config.items.map(item =>
				item.id === itemId ? { ...item, ...patch } : item
			)
		});
	}

	private addEffectScaleNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string
	) {
		const mechanic = this.pageStore
			.spellMechanics()
			.filter(item => item.isActive)
			.sort(compareByOrderAndName)[0];

		if (!mechanic) {
			return;
		}

		const item = this.effectScaleConfig(block).items.find(
			value => value.id === itemId
		);

		if (!item) {
			return;
		}

		this.updateEffectScaleItem(block, itemId, {
			mechanicBlocks: [
				...item.mechanicBlocks,
				createMechanicBlockDraft(
					mechanic,
					item.mechanicBlocks.length,
					this.essenceMagicWord(),
					{}
				)
			]
		});
	}

	private updateEffectScaleNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		mechanicId: string
	) {
		const mechanic = this.findMechanic(mechanicId);
		const item = this.effectScaleConfig(block).items.find(
			value => value.id === itemId
		);

		if (!mechanic || !item) {
			return;
		}

		this.updateEffectScaleItem(block, itemId, {
			mechanicBlocks: item.mechanicBlocks.map((nestedBlock, index) =>
				nestedBlock.id === nestedBlockId
					? createMechanicBlockDraft(
							mechanic,
							index,
							this.essenceMagicWord(),
							{},
							nestedBlock.id
						)
					: nestedBlock
			)
		});
	}

	private updateEffectScaleNestedParameter(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		parameterId: string,
		value: SpellParameterValue | null
	) {
		const item = this.effectScaleConfig(block).items.find(
			data => data.id === itemId
		);

		if (!item) {
			return;
		}

		this.updateEffectScaleItem(block, itemId, {
			mechanicBlocks: item.mechanicBlocks.map(nestedBlock =>
				nestedBlock.id === nestedBlockId
					? {
							...nestedBlock,
							parameterValues: {
								...nestedBlock.parameterValues,
								[this.parameterStorageKey(
									nestedBlock as SpellMechanicBlockDraft,
									parameterId
								)]: value ?? ''
							}
						}
					: nestedBlock
			)
		});
	}

	private deleteEffectScaleNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string
	) {
		const item = this.effectScaleConfig(block).items.find(
			data => data.id === itemId
		);

		if (!item) {
			return;
		}

		this.updateEffectScaleItem(block, itemId, {
			mechanicBlocks: item.mechanicBlocks
				.filter(nestedBlock => nestedBlock.id !== nestedBlockId)
				.map((nestedBlock, index) => ({ ...nestedBlock, sortOrder: index }))
		});
	}

	private updateMechanicBlockMechanic(index: number, mechanicId: string) {
		const mechanic = this.findMechanic(mechanicId);

		if (!mechanic) {
			return;
		}

		const draft = this.draft();
		const existingBlock = draft?.mechanicBlocks[index];

		if (!draft || !existingBlock) {
			return;
		}

		this.pageStore.patchDraft(
			createMechanicBlockPatch(
				{
					...draft,
					mechanicBlocks: draft.mechanicBlocks.filter(
						(_, blockIndex) => blockIndex !== index
					)
				},
				mechanic,
				this.essenceMagicWord(),
				existingBlock.id,
				index
			)
		);
		this.pageStore.setSelectedMechanicBlockIndex(index);
	}

	private updateMechanicBlockActive(index: number, isActive: boolean) {
		const block = this.draft()?.mechanicBlocks[index];

		if (block) {
			this.updateMechanicBlock(index, { ...block, isActive });
		}
	}

	private deleteMechanicBlock(index: number) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.pageStore.patchDraft({
			mechanicBlocks: draft.mechanicBlocks
				.filter((_, blockIndex) => blockIndex !== index)
				.map((block, blockIndex) => ({ ...block, sortOrder: blockIndex })),
			textBlocks: draft.textBlocks
				.filter(
					block => block.mechanicBlockId !== draft.mechanicBlocks[index]?.id
				)
				.map((block, blockIndex) => ({ ...block, sortOrder: blockIndex }))
		});
		this.pageStore.selectMechanicBlockAfterDelete(
			index,
			draft.mechanicBlocks.length
		);
	}

	private updateMechanicBlock(index: number, block: SpellMechanicBlockDraft) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.pageStore.patchDraft({
			mechanicBlocks: draft.mechanicBlocks.map((item, blockIndex) =>
				blockIndex === index ? block : item
			)
		});
	}

	private updateMechanicBlockParameter(
		blockIndex: number,
		parameterId: string,
		value: SpellParameterValue | null
	) {
		const block = this.draft()?.mechanicBlocks[blockIndex];

		if (!block) {
			return;
		}

		const key = this.parameterStorageKey(block, parameterId);

		this.updateMechanicBlock(blockIndex, {
			...block,
			parameterValues: {
				...block.parameterValues,
				[key]: value ?? ''
			}
		});
	}

	private updateMechanicBlockParameterMode(
		blockIndex: number,
		parameterId: string,
		mode: SpellParameterValueMode
	) {
		const block = this.draft()?.mechanicBlocks[blockIndex];
		const currentValue = block
			? this.rawParameterValue(block, parameterId)
			: null;
		const nextValue =
			mode === 'progression'
				? createProgressionParameterValue(this.firstProgressionPreset())
				: mode === 'auto'
					? createAutoParameterValue()
					: mode === 'formula'
						? createFormulaParameterValue()
						: isStaticParameterValue(currentValue)
							? currentValue
							: createStaticParameterValue(parameterValueText(currentValue));

		this.updateMechanicBlockParameter(blockIndex, parameterId, nextValue);
	}

	private autoSourceKeyOptions(
		block: SpellMechanicBlockDraft,
		source: SpellAutoParameterSource
	) {
		switch (source.sourceKind) {
			case 'mechanicParameter':
				return this.mechanicParameterSourceOptionGroups(block);
			case 'systemValue':
				return this.systemValueSourceOptionGroups();
			case 'essenceProfile':
				return [
					{
						label: 'Профиль сущности',
						items: ESSENCE_PROFILE_SOURCE_OPTIONS
					}
				];
			case 'manual':
				return [];
		}
	}

	private mechanicParameterSourceOptionGroups(block: SpellMechanicBlockDraft) {
		const parameters = this.mechanicBlockParameters(block)
			.filter(isAutoSourceMechanicParameter)
			.sort(compareByOrderAndName);

		return [
			{
				label: 'Навыки',
				items: parameters
					.filter(parameter => parameter.kind === 'skill')
					.map(parameter => ({
						label: parameter.name,
						value: parameterStorageKey(parameter)
					}))
			},
			{
				label: 'Числа',
				items: parameters
					.filter(parameter => parameter.kind === 'number')
					.map(parameter => ({
						label: parameter.name,
						value: parameterStorageKey(parameter)
					}))
			},
			{
				label: 'Значения системы',
				items: parameters
					.filter(parameter => parameter.kind === 'systemValue')
					.map(parameter => ({
						label: parameter.name,
						value: parameterStorageKey(parameter)
					}))
			}
		].filter(group => group.items.length > 0);
	}

	private systemValueSourceOptionGroups() {
		const groups = new Map<string, Array<{ label: string; value: string }>>();

		for (const value of this.pageStore
			.systemValues()
			.slice()
			.sort(compareBySectionAndName)) {
			const label = value.displaySection || 'Значения';
			const items = groups.get(label) ?? [];
			items.push({
				label: value.name,
				value: value.id
			});
			groups.set(label, items);
		}

		return Array.from(groups, ([label, items]) => ({ label, items }));
	}

	private defaultAutoSourceKey(
		block: SpellMechanicBlockDraft,
		sourceKind: AutoValueSourceKind
	) {
		switch (sourceKind) {
			case 'mechanicParameter':
				return (
					this.mechanicBlockParameters(block)
						.filter(isAutoSourceMechanicParameter)
						.sort(compareByOrderAndName)
						.find(parameter => parameter.name.toLowerCase().includes('атаки'))
						?.slug ??
					this.mechanicBlockParameters(block)
						.filter(isAutoSourceMechanicParameter)
						.sort(compareByOrderAndName)[0]?.slug ??
					''
				);
			case 'systemValue':
				return (
					this.pageStore
						.systemValues()
						.find(value => value.name === 'Уровень Заклинателя')?.id ??
					this.pageStore.systemValues().slice().sort(compareBySectionAndName)[0]
						?.id ??
					''
				);
			case 'essenceProfile':
				return 'damage';
			case 'manual':
				return '';
		}
	}

	private autoSourceKindLabel(sourceKind: AutoValueSourceKind) {
		return (
			this.autoValueSourceKindOptions.find(
				option => option.value === sourceKind
			)?.label ?? 'Источник'
		);
	}

	private autoSourceTargetLabel(target: SpellAutoParameterSource['target']) {
		return (
			this.autoValueSourceTargetOptions.find(option => option.value === target)
				?.label ?? 'Влияние'
		);
	}

	private autoSourceCollapseKey(
		scope: string,
		source: SpellAutoParameterSource
	) {
		return `${scope}:${source.id}`;
	}

	private mechanicParameterCollapseKey(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return `${block.id}:${parameterStorageKey(parameter)}`;
	}

	private mechanicReadinessStatus(block: SpellMechanicBlockDraft): {
		severity: 'success' | 'warn' | 'danger' | 'secondary';
	} {
		const mechanic = this.findMechanic(block.mechanicId);

		if (!mechanic) {
			return { severity: 'danger' };
		}

		if (!block.isActive) {
			return { severity: 'secondary' };
		}

		const issues = mechanic.parameters
			.filter(parameter => parameter.required)
			.filter(
				parameter =>
					!isConfiguredParameterValue(
						parameter,
						this.rawParameterValue(block, parameter.id),
						this.draft()
					)
			);
		const effectScaleIssues = this.isEffectScaleBlock(block)
			? this.effectScaleReadinessIssues(block)
			: [];

		return {
			severity: issues.length || effectScaleIssues.length ? 'warn' : 'success'
		};
	}

	private progressionPreviewSteps() {
		return this.pageStore
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
		const understandingsCount = this.pageStore
			.skills()
			.filter(skill => skill.isActive && isUnderstandingSkill(skill)).length;

		return maxSkillLevel * understandingsCount;
	}

	private maxActiveSkillLevel() {
		return Math.max(
			0,
			...this.pageStore
				.skillLevels()
				.filter(level => level.isActive)
				.map(level => level.level)
		);
	}

	private casterLevelMatrixKey(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return `${block.id}:${parameterStorageKey(parameter)}:caster-level`;
	}

	private formulaSourceGroupsForBlock(
		block: SpellMechanicBlockDraft | null
	): MechanicCalculationSourceGroup[] {
		const mechanic = block ? this.findMechanic(block.mechanicId) : null;
		const parameters = mechanic?.parameters ?? [];
		const mechanicParameterSources = parameters
			.filter(
				parameter => parameter.kind === 'number' || parameter.kind === 'formula'
			)
			.sort(compareByOrderAndName)
			.map(parameter => ({
				id: formulaSourceId('parameter', parameterStorageKey(parameter)),
				name: this.formulaSourceParameterLabel(block, parameter),
				searchText: `${parameter.name} параметр число формула`
			}));
		const skillParameterSources = parameters
			.filter(parameter => parameter.kind === 'skill')
			.sort(compareByOrderAndName)
			.map(parameter => ({
				id: formulaSourceId(
					'skillParameterLevel',
					parameterStorageKey(parameter)
				),
				name: this.formulaSourceParameterLabel(block, parameter),
				searchText: `${parameter.name} уровень навык`
			}));
		const staticSkillSources = createSkillOptionGroups(
			this.pageStore.skillCategories(),
			this.pageStore.skills()
		).map(group => ({
			label: `Навыки: ${group.label}`,
			items: group.items.map(skill => ({
				id: formulaSourceId('skillLevel', skill.id),
				name: `Уровень: ${skill.name}`,
				searchText: `${skill.searchText} уровень навык`
			}))
		}));
		const essenceProfileSources = ESSENCE_PROFILE_SOURCE_OPTIONS.map(
			option => ({
				id: formulaSourceId('essenceProfile', option.value),
				name: `Профиль сущности: ${option.label}`,
				searchText: `${option.label.toLowerCase()} профиль сущности`
			})
		);
		const systemValueSources = this.pageStore
			.systemValues()
			.slice()
			.sort(compareBySectionAndName)
			.map(value => ({
				id: formulaSourceId('systemValue', value.id),
				name: systemValueSourceLabel(value),
				searchText:
					`${value.name} ${value.displaySection} значение системы`.toLowerCase()
			}));
		const manualSources = [
			{
				id: formulaSourceId('manual', 'x'),
				name: 'Ручной x',
				searchText: 'ручной x икс'
			}
		];

		return [
			...createSingleOptionGroup(
				'Параметры механики',
				mechanicParameterSources
			),
			...createSingleOptionGroup('Навыки из параметров', skillParameterSources),
			...createSingleOptionGroup('Значения системы', systemValueSources),
			...staticSkillSources,
			...createSingleOptionGroup('Профиль сущности', essenceProfileSources),
			...createSingleOptionGroup('Ручные источники', manualSources)
		];
	}

	private formulaSourceNamesForBlock(block: SpellMechanicBlockDraft) {
		return new Map(
			this.formulaSourceGroupsForBlock(block)
				.flatMap(group => group.items)
				.map(item => [item.id, item.name] as const)
		);
	}

	private formulaSourceParameterLabel(
		block: SpellMechanicBlockDraft | null,
		parameter: SpellMechanicParameter
	) {
		if (!block) {
			return parameter.name;
		}

		const value = this.rawParameterValue(block, parameter.id);
		const label = formatFormulaSourceValueSummary(
			parameter.kind,
			value,
			this.parameterLabelLookup()
		);

		return `${parameter.name}: ${label}`;
	}

	private parameterValueLabel(
		kind: SpellMechanicParameter['kind'],
		value: unknown
	): string {
		return formatParameterPreviewLabel(
			kind,
			value,
			this.parameterPreviewLabelLookup()
		);
	}

	private parameterPreviewLabelLookup() {
		return {
			...this.parameterLabelLookup(),
			formulaText: (value: SpellFormulaParameterValue) =>
				formatMechanicCalculationFormula(
					value.graph,
					this.formulaSourceNames()
				),
			autoText: (value: SpellAutoParameterValue) =>
				autoParameterFormulaLabel(value, this.formulaSourceNames())
		};
	}

	private parameterLabelLookup() {
		return {
			progressionPresetName: (presetId: string) =>
				this.pageStore.progressionPresets().find(item => item.id === presetId)
					?.name ?? null,
			skillName: (value: string) =>
				this.pageStore.skills().find(item => item.id === value)?.name ?? null,
			targetText: (value: string) =>
				targetConfigText(
					this.draft()?.targetConfigs.find(
						item => item.id === value || item.slug === value
					) ?? createTargetPreset('Цель', 'selected', 'any', 'one')
				),
			damageTypeName: (value: string) =>
				this.pageStore.damageTypes().find(item => item.id === value)?.name ??
				null,
			conditionName: (value: string) =>
				this.pageStore.conditions().find(item => item.id === value)?.name ??
				null
		};
	}

	private formulaSourceNames() {
		const block = this.selectedBlock();

		return block
			? this.formulaSourceNamesForBlock(block)
			: new Map<string, string>();
	}

	private casterLevelSystemValue() {
		return (
			this.pageStore
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

	private rawParameterValue(
		block: SpellMechanicBlockDraft,
		parameterIdOrSlug: string
	) {
		const key = this.parameterStorageKey(block, parameterIdOrSlug);

		return block.parameterValues[key];
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

	private findMechanic(mechanicId: string) {
		return (
			this.pageStore
				.spellMechanics()
				.find(mechanic => mechanic.id === mechanicId) ?? null
		);
	}

	private firstProgressionPreset() {
		return (
			this.pageStore
				.progressionPresets()
				.filter(preset => preset.isActive)
				.sort(compareByOrderAndName)[0] ?? null
		);
	}

	private progressionParameterPreset(value: SpellProgressionParameterValue) {
		return (
			this.pageStore
				.progressionPresets()
				.find(preset => preset.id === value.presetId) ?? null
		);
	}

	private essenceMagicWord() {
		const essenceId = this.draft()?.essenceId;
		return (
			this.pageStore
				.magicWords()
				.find(word => word.id === essenceId && word.type === 'ESSENCE') ?? null
		);
	}
}

function createMechanicBlockPatch(
	draft: SpellDraft,
	mechanic: SpellMechanic,
	essence: MagicWord | null,
	blockId: string = crypto.randomUUID(),
	insertIndex: number = draft.mechanicBlocks.length
): Pick<SpellDraft, 'mechanicBlocks' | 'targetConfigs'> {
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
		blockId
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

function createMechanicBlockDraft(
	mechanic: SpellMechanic,
	sortOrder: number,
	essence: MagicWord | null,
	targetIdsByParameterId: Record<string, string>,
	id: string = crypto.randomUUID()
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

function createMechanicBlockConfig(
	mechanic: SpellMechanic
): SpellMechanicBlockConfig {
	const defaultApplication = normalizeApplicationConfig(
		readDefaultApplicationConfig(mechanic.configSchema)
	);
	const effectScaleAction = mechanic.actions.find(
		action => action.kind === 'effectScale'
	);
	const config: SpellMechanicBlockConfig = {
		application: defaultApplication
	};

	if (effectScaleAction) {
		config.effectScale = readSpellEffectScaleConfig(effectScaleAction.config);
	}

	return config;
}

function readDefaultApplicationConfig(
	configSchema: Record<string, unknown>
): Partial<SpellMechanicApplicationConfig> | null {
	const value = configSchema['defaultApplication'];

	return isRecord(value) ? value : null;
}

function normalizeApplicationConfig(
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

function defaultParameterValue(
	parameter: SpellMechanic['parameters'][number],
	essence: MagicWord | null,
	targetIdsByParameterId: Record<string, string>
) {
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

function parameterStorageKey(parameter: SpellMechanic['parameters'][number]) {
	return parameter.slug || parameter.id;
}

function readSpellEffectScaleConfig(value: unknown): SpellEffectScaleConfig {
	const config = isRecord(value) ? value : {};
	const mode = isEffectScaleMode(config['mode']) ? config['mode'] : 'choice';
	const resultName =
		typeof config['resultName'] === 'string' && config['resultName'].trim()
			? config['resultName']
			: 'Выбранный эффект';

	return {
		mode,
		resultName,
		items: readSpellEffectScaleItems(config['items'])
	};
}

function readSpellEffectScaleItems(
	value: unknown
): SpellEffectScaleItemConfig[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isRecord).map((item, index) => ({
		id:
			typeof item['id'] === 'string' && item['id']
				? item['id']
				: crypto.randomUUID(),
		requirement:
			item['requirement'] === 'automatic' || item['requirement'] === 'successes'
				? item['requirement']
				: 'successes',
		threshold:
			typeof item['threshold'] === 'number' &&
			Number.isFinite(item['threshold'])
				? item['threshold']
				: index,
		name:
			typeof item['name'] === 'string' && item['name'].trim()
				? item['name']
				: `${index} успехов`,
		description:
			typeof item['description'] === 'string' ? item['description'] : '',
		isOpenEnded: item['isOpenEnded'] === true,
		mechanicBlocks: []
	}));
}

function isEffectScaleMode(value: unknown): value is SpellEffectScaleMode {
	return (
		value === 'best' ||
		value === 'choice' ||
		value === 'all' ||
		value === 'exact'
	);
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

function compareBySectionAndName(
	left: Pick<SystemValueLike, 'displaySection' | 'name'>,
	right: Pick<SystemValueLike, 'displaySection' | 'name'>
) {
	return (
		left.displaySection.localeCompare(right.displaySection, 'ru') ||
		left.name.localeCompare(right.name, 'ru')
	);
}

interface SystemValueLike {
	displaySection: string;
	name: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isConfiguredParameterValue(
	parameter: SpellMechanicParameter,
	value: SpellParameterValue | undefined,
	draft: SpellDraft | null
) {
	if (parameter.kind === 'target') {
		return (
			typeof value === 'string' &&
			value.length > 0 &&
			!!draft?.targetConfigs.some(
				target => target.id === value || target.slug === value
			)
		);
	}

	if (parameter.kind === 'number' || parameter.kind === 'formula') {
		if (isStaticParameterValue(value)) {
			return value.value.trim().length > 0;
		}

		if (isProgressionParameterValue(value)) {
			return !!value.presetId;
		}

		if (isFormulaParameterValue(value)) {
			return !!value.graph?.nodes.some(node => node.kind === 'result');
		}

		if (isAutoParameterValue(value)) {
			return value.sources.length > 0;
		}

		return false;
	}

	return typeof value === 'string' ? value.trim().length > 0 : !!value;
}

function mechanicParameterMissingLabel(parameter: SpellMechanicParameter) {
	if (parameter.kind === 'target') {
		return 'Не выбрана цель';
	}

	if (parameter.kind === 'damageType') {
		return 'Не выбран тип урона';
	}

	if (parameter.kind === 'condition') {
		return 'Не выбрано состояние';
	}

	if (parameter.kind === 'skill') {
		return `Не выбран ${parameter.name.toLocaleLowerCase('ru')}`;
	}

	if (parameter.kind === 'number' || parameter.kind === 'formula') {
		switch (parameter.numericRole) {
			case 'range':
				return 'Не настроена дальность';
			case 'damage':
				return 'Не настроен урон';
			case 'duration':
				return 'Не настроена длительность';
			case 'area':
				return 'Не настроена область';
			case 'targetCount':
				return 'Не настроено количество целей';
			default:
				return `Не настроено ${parameter.name.toLocaleLowerCase('ru')}`;
		}
	}

	return `Не заполнено ${parameter.name.toLocaleLowerCase('ru')}`;
}

function isUnderstandingSkill(skill: { name: string }) {
	return skill.name.toLocaleLowerCase('ru').includes('понимание');
}
