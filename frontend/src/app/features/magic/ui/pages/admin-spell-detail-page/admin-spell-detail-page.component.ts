import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	computed,
	inject
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { Popover } from 'primeng/popover';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { CONDITIONS_REPOSITORY } from '../../../../conditions/data/conditions-repository.port';
import { CREATURES_REPOSITORY } from '../../../../creatures/data/creatures-repository.port';
import { DAMAGE_TYPES_REPOSITORY } from '../../../../damage-types/data/damage-types-repository.port';
import { PROGRESSION_PRESETS_REPOSITORY } from '../../../../progression-presets/data/progression-presets-repository.port';
import { ProgressionPresetRoundingMode } from '../../../../progression-presets/domain/progression-presets.models';
import { SKILLS_REPOSITORY } from '../../../../skills/data/skills-repository.port';
import {
	Skill,
	SkillCategory,
	SkillLevel
} from '../../../../skills/domain/skills.models';
import { VALUES_REPOSITORY } from '../../../../values/data/values-repository.port';
import {
	CHARACTER_INPUT_OVERRIDE_KEY,
	evaluateGraph
} from '../../../../values/domain/value-graph.engine';
import { SystemValue } from '../../../../values/domain/values.models';
import { CHARACTER_SHEET_SANDBOX_REPOSITORY } from '../../../../character-sheet/data/character-sheet-sandbox-repository.port';
import { SPELL_MECHANICS_REPOSITORY } from '../../../../spell-mechanics/data/spell-mechanics-repository.port';
import { MechanicCalculationGraphEditorComponent } from '../../../../spell-mechanics/ui/components/mechanic-calculation-graph-editor/mechanic-calculation-graph-editor.component';
import { formatMechanicCalculationFormula } from '../../../../spell-mechanics/ui/mechanic-calculation-graph.formula';
import { SpellAddMechanicDialogComponent } from './dialogs/add-mechanic/spell-add-mechanic-dialog.component';
import { SpellAreaEditorComponent } from './area/spell-area-editor.component';
import { SpellDetailEditorHeaderComponent } from './shell/spell-detail-editor-header.component';
import {
	SpellMechanicsEditorComponent,
	SpellMechanicsEditorContext
} from './mechanics/spell-mechanics-editor.component';
import { SpellMainEditorComponent } from './main/spell-main-editor.component';
import { SpellBalanceTabComponent } from './tabs/balance/spell-balance-tab.component';
import { SpellProblemsTabComponent } from './tabs/problems/spell-problems-tab.component';
import { SpellRuntimePreviewDrawerComponent } from './runtime/preview-drawer/spell-runtime-preview-drawer.component';
import { SpellTextTabComponent } from './tabs/text/spell-text-tab.component';
import { SpellTargetConfigsEditorComponent } from './targets/spell-target-configs-editor.component';
import { AdminSpellDetailPageStore } from './state/admin-spell-detail-page.store';
import {
	createSpellDraftFromFormula,
	createSpellDraftFromSpell,
	normalizeSpellConfig
} from './mappers/spell-detail-draft.mapper';
import {
	MechanicProblemItem,
	RuntimeTraceRow,
	SpellDraft,
	SpellMechanicBlockDraft,
	SpellParameterValueMode,
	SpellTextPreviewMode,
	SpellTextPreviewPart,
	TagSeverity
} from './models/spell-detail-page.types';
import {
	MechanicCalculationGraphState,
	MechanicCalculationSourceGroup
} from '../../../../spell-mechanics/ui/mechanic-calculation-graph.models';
import {
	SpellMechanic,
	SpellMechanicParameter,
	SpellMechanicParameterKind
} from '../../../../spell-mechanics/domain/spell-mechanics.models';
import { MAGIC_WORDS_REPOSITORY } from '../../../data/magic-words-repository.port';
import { MagicWord } from '../../../domain/magic-word.models';
import {
	PersistedSpellStatus,
	Spell,
	SpellCatalog,
	SpellFormulaCandidate,
	SpellMechanicApplicationConfig,
	SpellMechanicBlockConfig,
	SpellEffectScaleConfig,
	SpellEffectScaleItemConfig,
	SpellEffectScaleMode,
	SpellRuntimePendingChoice,
	SpellRuntimePendingRoll,
	SpellRuntimePreview,
	SpellRuntimeEffect,
	SpellRuntimeTraceEntry,
	SpellTextBlock,
	SpellTextBlockKind,
	SpellTargetConfig,
	spellStatusLabel
} from '../../../domain/spell.models';
import {
	TARGET_COUNT_MODE_OPTIONS,
	TARGET_COUNT_VALUE_MODE_OPTIONS,
	TARGET_RELATION_OPTIONS,
	TARGET_SOURCE_OPTIONS,
	TARGET_TEMPLATE_OPTIONS,
	TargetConfigLike,
	TargetTemplateId,
	TargetTemplateOptionGroup,
	createTargetConfigFromMechanicDefault,
	createTargetConfigFromTemplate,
	createTargetPreset,
	createTargetTemplateOptionGroups,
	findTargetPresetTemplate,
	targetConfigPreview,
	targetConfigText,
	targetMatchesTemplate,
	targetRuntimeSummary
} from './utils/spell-target-config.utils';
import { renderMechanicTextTemplate } from './utils/mechanic-text-template-renderer';
import {
	AUTO_VALUE_CHARACTER_OPTIONS,
	AUTO_VALUE_GROWTH_OPTIONS,
	AUTO_VALUE_SCALE_OPTIONS,
	AUTO_VALUE_SOURCE_CURVE_OPTIONS,
	AUTO_VALUE_SOURCE_KIND_OPTIONS,
	AUTO_VALUE_SOURCE_MODE_OPTIONS,
	AUTO_VALUE_SOURCE_TARGET_OPTIONS,
	AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS,
	AutoValueSourceKind,
	AutoValueRangeMode,
	AutoValueSourceMode,
	AutoValueSourceTarget,
	ESSENCE_PROFILE_SOURCE_OPTIONS,
	PROGRESSION_SOURCE_KIND_OPTIONS,
	ProgressionSourceKind,
	ROUNDING_MODE_OPTIONS,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellFormulaParameterValue,
	SpellParameterValue,
	SpellProgressionParameterValue,
	autoParameterFormulaLabel,
	createAutoParameterSource,
	createAutoParameterValue,
	createAutoPreset,
	createAutoPresetOptions,
	createAutoSourcesForMode,
	createFormulaParameterValue,
	createProgressionParameterValue,
	createStaticParameterValue,
	formatPreviewNumber,
	formulaSourceId,
	isAutoParameterValue,
	isAutoSourceMechanicParameter,
	isFormulaParameterValue,
	isProgressionParameterValue,
	isStaticParameterValue,
	parameterValueText,
	supportsNumericParameterKind,
	systemValueSourceLabel
} from './utils/spell-numeric-parameter.utils';

interface SelectOption {
	id: string;
	name: string;
	searchText: string;
}

interface SelectOptionGroup {
	label: string;
	items: SelectOption[];
}

interface CommandSelectOption {
	label: string;
	value: string;
}

interface CommandSelectOptionGroup {
	label: string;
	items: CommandSelectOption[];
}

interface SerializedSpellMechanicBlock {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, SpellParameterValue>;
	config: SpellMechanicBlockConfig;
	isActive: boolean;
	sortOrder: number;
}

interface MechanicReadinessStatus {
	label: string;
	severity: 'success' | 'warn' | 'danger' | 'secondary';
	issues: string[];
}

type AutoHelpKey =
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

interface AutoHelpItem {
	term: string;
	description: string;
}

interface AutoHelpContent {
	title: string;
	description: string;
	items: AutoHelpItem[];
}

const PARAMETER_VALUE_MODE_OPTIONS: Array<{
	label: string;
	value: SpellParameterValueMode;
}> = [
	{ label: 'Значение', value: 'static' },
	{ label: 'Авто', value: 'auto' },
	{ label: 'Прогрессия', value: 'progression' },
	{ label: 'Формула', value: 'formula' }
];

const SPELL_TEXT_BLOCK_KIND_OPTIONS: Array<{
	label: string;
	value: SpellTextBlockKind;
}> = [
	{ label: 'Текст', value: 'text' },
	{ label: 'Текст механики', value: 'mechanicText' }
];

const SPELL_TEXT_PREVIEW_MODE_OPTIONS: Array<{
	label: string;
	value: SpellTextPreviewMode;
}> = [
	{ label: 'Игровой', value: 'game' },
	{ label: 'Формулы', value: 'formula' }
];

const AUTO_VALUE_RANGE_MODE_OPTIONS: Array<{
	label: string;
	value: AutoValueRangeMode;
}> = [
	{ label: 'Без диапазона', value: 'none' },
	{ label: 'Масштабировать', value: 'scale' }
];

@Component({
	selector: 'app-admin-spell-detail-page',
	standalone: true,
	imports: [
		CommonModule,
		Breadcrumb,
		ConfirmDialog,
		Dialog,
		Popover,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		EditorActionsBarComponent,
		MechanicCalculationGraphEditorComponent,
		SpellAddMechanicDialogComponent,
		SpellAreaEditorComponent,
		SpellDetailEditorHeaderComponent,
		SpellMechanicsEditorComponent,
		SpellMainEditorComponent,
		SpellBalanceTabComponent,
		SpellProblemsTabComponent,
		SpellRuntimePreviewDrawerComponent,
		SpellTextTabComponent,
		SpellTargetConfigsEditorComponent
	],
	templateUrl: './admin-spell-detail-page.component.html',
	styleUrl: './admin-spell-detail-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, AdminSpellDetailPageStore]
})
export class AdminSpellDetailPageComponent {
	private readonly pageStore = inject(AdminSpellDetailPageStore);
	private readonly repository = inject(MAGIC_WORDS_REPOSITORY);
	private readonly spellMechanicsRepository = inject(
		SPELL_MECHANICS_REPOSITORY
	);
	private readonly skillsRepository = inject(SKILLS_REPOSITORY);
	private readonly damageTypesRepository = inject(DAMAGE_TYPES_REPOSITORY);
	private readonly conditionsRepository = inject(CONDITIONS_REPOSITORY);
	private readonly creaturesRepository = inject(CREATURES_REPOSITORY);
	private readonly progressionPresetsRepository = inject(
		PROGRESSION_PRESETS_REPOSITORY
	);
	private readonly valuesRepository = inject(VALUES_REPOSITORY);
	private readonly characterSheetSandboxRepository = inject(
		CHARACTER_SHEET_SANDBOX_REPOSITORY
	);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly draft = this.pageStore.draft;
	protected readonly originalDraft = this.pageStore.originalDraft;
	protected readonly spellMechanics = this.pageStore.spellMechanics;
	protected readonly magicWords = this.pageStore.magicWords;
	protected readonly skills = this.pageStore.skills;
	protected readonly skillCategories = this.pageStore.skillCategories;
	protected readonly skillLevels = this.pageStore.skillLevels;
	protected readonly damageTypes = this.pageStore.damageTypes;
	protected readonly conditions = this.pageStore.conditions;
	protected readonly creatures = this.pageStore.creatures;
	protected readonly creatureCharacteristics =
		this.pageStore.creatureCharacteristics;
	protected readonly progressionPresets = this.pageStore.progressionPresets;
	protected readonly systemValues = this.pageStore.systemValues;
	protected readonly sandboxInputValues = this.pageStore.sandboxInputValues;
	protected readonly selectedMechanicBlockIndex =
		this.pageStore.selectedMechanicBlockIndex;
	protected readonly selectedTargetConfigIndex =
		this.pageStore.selectedTargetConfigIndex;
	protected readonly selectedFormulaParameter =
		this.pageStore.selectedFormulaParameter;
	protected readonly activeTab = this.pageStore.activeTab;
	protected readonly savedDraftSignature = this.pageStore.savedDraftSignature;
	protected readonly loading = this.pageStore.loading;
	protected readonly saving = this.pageStore.saving;
	protected readonly errorMessage = this.pageStore.errorMessage;
	protected readonly runtimePreviewVisible =
		this.pageStore.runtimePreviewVisible;
	protected readonly runtimePreviewLoading =
		this.pageStore.runtimePreviewLoading;
	protected readonly runtimePreviewError = this.pageStore.runtimePreviewError;
	protected readonly runtimePreview = this.pageStore.runtimePreview;
	protected readonly runtimeRollResults = this.pageStore.runtimeRollResults;
	protected readonly runtimeChoiceResults = this.pageStore.runtimeChoiceResults;
	protected readonly runtimeRollDrafts = this.pageStore.runtimeRollDrafts;
	protected readonly runtimeRollKeyRenderer = (roll: SpellRuntimePendingRoll) =>
		this.runtimeRollKey(roll);
	protected readonly runtimeChoiceKeyRenderer = (
		choice: SpellRuntimePendingChoice
	) => this.runtimeChoiceKey(choice);
	protected readonly runtimeRollDraftRenderer = (
		roll: SpellRuntimePendingRoll
	) => this.runtimeRollDraft(roll);
	protected readonly runtimeValueLabelRenderer = (value: unknown) =>
		this.runtimeValueLabel(value);
	protected readonly runtimePreviewStatusLabelRenderer = (
		status: SpellRuntimePreview['status']
	) => this.runtimePreviewStatusLabel(status);
	protected readonly runtimePreviewStatusSeverityRenderer = (
		status: SpellRuntimePreview['status']
	) => this.runtimePreviewStatusSeverity(status);
	protected readonly runtimeEffectTitleRenderer = (
		effect: SpellRuntimeEffect
	) => this.runtimeEffectTitle(effect);
	protected readonly runtimeEffectTextRenderer = (effect: SpellRuntimeEffect) =>
		this.runtimeEffectText(effect);
	protected readonly runtimeTraceSeverityRenderer = (trace: RuntimeTraceRow) =>
		this.runtimeTraceSeverity(trace);
	protected readonly runtimeTraceRowsRenderer = (
		trace: SpellRuntimeTraceEntry[]
	) => this.runtimeTraceRows(trace);
	protected readonly addMechanicWizardVisible =
		this.pageStore.addMechanicWizardVisible;
	protected readonly selectedWizardMechanicId =
		this.pageStore.selectedWizardMechanicId;
	protected readonly wizardRequiredParametersRenderer = (
		mechanic: SpellMechanic
	) => this.wizardRequiredParameters(mechanic);
	protected readonly wizardParameterDefaultLabelRenderer = (
		parameter: SpellMechanicParameter
	) => this.wizardParameterDefaultLabel(parameter);
	protected readonly wizardParameterReadyRenderer = (
		parameter: SpellMechanicParameter
	) => this.wizardParameterReady(parameter);
	protected readonly breadcrumbs = computed(() => [
		{ label: 'Правила системы', routerLink: '/admin/rules/spells' },
		{ label: 'Заклинания', routerLink: '/admin/rules/spells' },
		{ label: this.draft()?.name || 'Заклинание' }
	]);
	protected readonly hasChanges = this.pageStore.hasChanges;
	protected readonly mechanicOptions = computed(() =>
		this.spellMechanics()
			.filter(mechanic => mechanic.isActive)
			.sort(compareByOrderAndName)
			.map(mechanic => ({
				label: mechanic.name,
				value: mechanic.id
			}))
	);
	protected readonly mechanicProblems = computed<MechanicProblemItem[]>(() => {
		const draft = this.draft();

		if (!draft) {
			return [];
		}

		return draft.mechanicBlocks.flatMap((block, blockIndex) => {
			const status = this.mechanicReadinessStatus(block);
			const mechanicName =
				this.mechanicBlockMechanic(block)?.name ?? 'Механика не найдена';

			return status.issues.map(issue => ({
				blockIndex,
				mechanicName,
				issue
			}));
		});
	});
	protected readonly selectedMechanicBlock = computed(() => {
		const index = this.selectedMechanicBlockIndex();
		return index === null
			? null
			: (this.draft()?.mechanicBlocks[index] ?? null);
	});
	protected readonly selectedWizardMechanic = computed(() => {
		const mechanicId = this.selectedWizardMechanicId();
		return mechanicId ? this.findMechanic(mechanicId) : null;
	});
	protected readonly targetSourceOptions = TARGET_SOURCE_OPTIONS;
	protected readonly targetRelationOptions = TARGET_RELATION_OPTIONS;
	protected readonly targetCountModeOptions = TARGET_COUNT_MODE_OPTIONS;
	protected readonly targetCountValueModeOptions =
		TARGET_COUNT_VALUE_MODE_OPTIONS;
	protected readonly targetTemplateOptions = TARGET_TEMPLATE_OPTIONS;
	protected readonly parameterValueModeOptions = PARAMETER_VALUE_MODE_OPTIONS;
	protected readonly spellTextBlockKindOptions = SPELL_TEXT_BLOCK_KIND_OPTIONS;
	protected readonly spellTextPreviewModeOptions =
		SPELL_TEXT_PREVIEW_MODE_OPTIONS;
	protected readonly spellTextPreviewMode = this.pageStore.spellTextPreviewMode;
	protected readonly spellTextBlockPreviewRenderer = (block: SpellTextBlock) =>
		this.spellTextBlockPreview(block);
	protected readonly effectScaleRequirementTextRenderer = (
		item: SpellEffectScaleItemConfig
	) => this.effectScaleRequirementText(item);
	protected readonly collapsedAutoSourceKeys =
		this.pageStore.collapsedAutoSourceKeys;
	protected readonly expandedMechanicParameterKeys =
		this.pageStore.expandedMechanicParameterKeys;
	protected readonly activeAutoHelpKey = this.pageStore.activeAutoHelpKey;
	protected readonly activeAutoHelp = computed(
		() => this.autoHelpContent[this.activeAutoHelpKey()]
	);
	protected readonly progressionSourceKindOptions =
		PROGRESSION_SOURCE_KIND_OPTIONS;
	protected readonly essenceProfileSourceOptions =
		ESSENCE_PROFILE_SOURCE_OPTIONS;
	protected readonly roundingModeOptions = ROUNDING_MODE_OPTIONS;
	protected readonly autoValueCharacterOptions = AUTO_VALUE_CHARACTER_OPTIONS;
	protected readonly autoValueScaleOptions = AUTO_VALUE_SCALE_OPTIONS;
	protected readonly autoValueGrowthOptions = AUTO_VALUE_GROWTH_OPTIONS;
	protected readonly autoValueSourceModeOptions =
		AUTO_VALUE_SOURCE_MODE_OPTIONS;
	protected readonly autoValueSourceKindOptions =
		AUTO_VALUE_SOURCE_KIND_OPTIONS;
	protected readonly autoValueSourceTargetOptions =
		AUTO_VALUE_SOURCE_TARGET_OPTIONS;
	protected readonly autoValueSourceCurveOptions =
		AUTO_VALUE_SOURCE_CURVE_OPTIONS;
	protected readonly autoValueSourceTransformOptions =
		AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS;
	protected readonly autoValueRangeModeOptions = AUTO_VALUE_RANGE_MODE_OPTIONS;
	protected readonly autoTransformSourceOptionsRenderer = (
		value: SpellAutoParameterValue,
		source: SpellAutoParameterSource
	) => this.autoTransformSourceOptions(value, source);
	protected readonly autoSourceKeyLabelRenderer = (
		source: SpellAutoParameterSource
	) => this.autoSourceKeyLabel(source);
	protected readonly autoSourceSummaryRenderer = (
		source: SpellAutoParameterSource
	) => this.autoSourceSummary(source);
	protected readonly isAutoSourceCollapsedRenderer = (
		scope: string,
		source: SpellAutoParameterSource
	) => this.isAutoSourceCollapsed(scope, source);
	protected readonly autoHelpContent: Record<AutoHelpKey, AutoHelpContent> = {
		character: {
			title: 'Поведение',
			description:
				'Определяет общий характер числа и то, насколько охотно оно растёт от выбранных источников.',
			items: [
				{
					term: 'Стабильное',
					description:
						'почти не разгоняется от источников и подходит для предсказуемых значений.'
				},
				{
					term: 'Скалируемое',
					description:
						'растёт ровно и понятно, хороший базовый вариант для большинства параметров.'
				},
				{
					term: 'Стихийное',
					description:
						'лучше подходит для эффектов, где важны свойства выбранной сущности.'
				},
				{
					term: 'Мастерское',
					description:
						'заметнее раскрывается на высоких навыках и хуже ощущается на низких.'
				},
				{
					term: 'Ограниченное',
					description:
						'сильнее держит потолок и не даёт значению слишком быстро разгоняться.'
				},
				{
					term: 'Экстремальное',
					description:
						'даёт высокий потенциал, но требует сильных источников, чтобы раскрыться.'
				}
			]
		},
		scale: {
			title: 'Размер значения',
			description: 'Задаёт базовый масштаб результата до применения влияний.',
			items: [
				{
					term: 'Очень малый',
					description:
						'для бонусов, которые могут начинаться с нуля и расти осторожно.'
				},
				{
					term: 'Малый',
					description:
						'для точечных эффектов, небольшого урона, короткой длительности или малого числа целей.'
				},
				{
					term: 'Средний',
					description:
						'для обычных заклинаний, где значение должно расти без резких скачков.'
				},
				{
					term: 'Большой',
					description:
						'для дальности, области или заметных эффектов, которые должны быть ощутимыми.'
				},
				{
					term: 'Огромный',
					description:
						'для параметров, где нужны крупные числа и широкий диапазон роста.'
				}
			]
		},
		startLevel: {
			title: 'Старт расчёта',
			description:
				'Задаёт уровень, с которого источники начинают давать вклад в формулу.',
			items: [
				{ term: '0', description: 'значение считается уже с нулевого уровня.' },
				{
					term: '1',
					description:
						'на нулевом уровне параметр остаётся на минимуме, рост начинается с первого уровня.'
				},
				{
					term: 'Выше 1',
					description:
						'позволяет открыть заметный рост только на более сильном навыке.'
				}
			]
		},
		minimum: {
			title: 'Минимум',
			description:
				'Нижняя граница итогового значения и значение, которое используется до старта расчёта.',
			items: [
				{
					term: '0',
					description:
						'параметр может быть полностью недоступен или не давать эффекта.'
				},
				{
					term: 'Больше 0',
					description:
						'заклинание всегда сохраняет базовый минимум, даже при слабых источниках.'
				}
			]
		},
		maximum: {
			title: 'Максимум',
			description:
				'Верхняя граница параметра. Используется только если включён режим диапазона.',
			items: [
				{
					term: 'Пусто',
					description:
						'верхняя граница не задана, формула работает без масштабирования в диапазон.'
				},
				{
					term: 'Число',
					description:
						'итоговая прогрессия будет уложена между минимумом и этим максимумом.'
				}
			]
		},
		rangeMode: {
			title: 'Диапазон',
			description:
				'Определяет, нужно ли приводить итоговую прогрессию к заданному коридору значений.',
			items: [
				{
					term: 'Без диапазона',
					description:
						'формула считается напрямую и ограничивается только своим обычным минимумом.'
				},
				{
					term: 'Масштабировать',
					description:
						'результат растягивается или сжимается так, чтобы уровни укладывались между минимумом и максимумом.'
				}
			]
		},
		finalScale: {
			title: 'Итоговый масштаб',
			description: 'Умножает уже рассчитанное значение перед округлением.',
			items: [
				{
					term: '100%',
					description: 'оставляет рассчитанные числа без изменений.'
				},
				{
					term: '50%',
					description:
						'сохраняет форму роста, но делает все значения в два раза меньше.'
				},
				{
					term: 'Больше 100%',
					description:
						'усиливает готовую прогрессию без изменения вкладов источников.'
				}
			]
		},
		sourceMode: {
			title: 'Режим влияний',
			description:
				'Определяет, сколько источников участвует в формуле и насколько подробно они настраиваются.',
			items: [
				{
					term: 'Простой',
					description: 'оставляет одну базовую связь и быстрее настраивается.'
				},
				{
					term: 'Расширенный',
					description:
						'позволяет добавить несколько источников и отдельно задать роль каждого источника.'
				}
			]
		},
		sourceKind: {
			title: 'Что влияет',
			description: 'Выбирает тип данных, который будет участвовать в расчёте.',
			items: [
				{
					term: 'Системное значение',
					description:
						'берёт общий показатель системы, например уровень заклинателя.'
				},
				{
					term: 'Параметр механики',
					description:
						'берёт значение из текущей механики, например выбранный навык атаки.'
				},
				{
					term: 'Профиль сущности',
					description:
						'берёт вес свойства сущности: урон, дальность, область, длительность и т.д.'
				},
				{
					term: 'Ручной x',
					description:
						'даёт быстрый тестовый источник без привязки к справочникам.'
				}
			]
		},
		sourceKey: {
			title: 'Значение источника',
			description:
				'Выбирает конкретное значение внутри выбранного типа источника.',
			items: [
				{
					term: 'Для системного значения',
					description:
						'указывает конкретный системный показатель, который будет подставлен в формулу.'
				},
				{
					term: 'Для параметра механики',
					description:
						'указывает параметр текущей механики, значение которого станет источником расчёта.'
				},
				{
					term: 'Для профиля сущности',
					description:
						'указывает, какое свойство сущности будет влиять на итог.'
				}
			]
		},
		sourceTransform: {
			title: 'Что взять',
			description:
				'Определяет, какая часть выбранного источника попадёт в расчёт.',
			items: [
				{
					term: 'Как есть',
					description: 'использует полное значение источника без вычитаний.'
				},
				{
					term: 'Сверх старта',
					description: 'берёт только часть выше начального уровня расчёта.'
				},
				{
					term: 'Сверх источника',
					description:
						'берёт разницу между этим источником и другой строкой влияния.'
				},
				{
					term: 'Доля значения',
					description:
						'делит источник на заданное число и делает его вклад мягче.'
				}
			]
		},
		sourceTransformSource: {
			title: 'Сверх источника',
			description:
				'Выбирает строку влияния, которую нужно вычесть из текущего источника.',
			items: [
				{
					term: 'Пример использования',
					description:
						'уровень заклинателя может давать бонус только за значение выше выбранного навыка.'
				},
				{
					term: 'Если разница отрицательная',
					description: 'вклад становится 0 и не уменьшает итоговое значение.'
				}
			]
		},
		sourceTransformDivisor: {
			title: 'Делитель',
			description: 'Ослабляет вклад источника перед применением кривой и веса.',
			items: [
				{ term: '2', description: 'примерно половина значения источника.' },
				{
					term: '8',
					description:
						'каждые восемь пунктов источника дают около одного шага до округления.'
				}
			]
		},
		sourceTarget: {
			title: 'Влияет на',
			description: 'Определяет место источника в формуле.',
			items: [
				{
					term: 'Базовый масштаб',
					description: 'добавляет вклад к основе значения до основного роста.'
				},
				{
					term: 'Рост',
					description:
						'усиливает прогрессию по уровню навыка или другому основному источнику.'
				},
				{
					term: 'Множитель',
					description: 'умножает итог после базовых добавок и роста.'
				},
				{
					term: 'Максимум',
					description: 'задаёт или расширяет верхнюю границу значения.'
				},
				{
					term: 'Бонус сущности',
					description: 'добавляет вклад сущности до финального умножения.'
				}
			]
		},
		sourceCurve: {
			title: 'Кривая',
			description: 'Преобразует значение источника перед применением веса.',
			items: [
				{ term: 'Слабая', description: 'даёт мягкий вклад и сдерживает рост.' },
				{ term: 'Плавная', description: 'растёт ровно и предсказуемо.' },
				{
					term: 'Быстрая',
					description: 'сильнее раскрывается на ранних значениях.'
				},
				{
					term: 'Насыщение',
					description: 'быстро растёт в начале и постепенно замедляется.'
				},
				{
					term: 'Взрывная',
					description: 'заметнее награждает высокие значения источника.'
				}
			]
		},
		sourceWeight: {
			title: 'Вес',
			description: 'Задаёт силу выбранной строки влияния.',
			items: [
				{
					term: '0',
					description: 'отключает вклад, но оставляет строку в настройке.'
				},
				{ term: '0.5', description: 'использует половину вклада источника.' },
				{ term: '1', description: 'использует источник как есть.' },
				{ term: 'Больше 1', description: 'усиливает вклад источника.' }
			]
		},
		rounding: {
			title: 'Округление',
			description:
				'Определяет, как дробный результат формулы превращается в игровое целое число.',
			items: [
				{
					term: 'Округлить вниз',
					description: 'всегда берёт меньшее целое значение.'
				},
				{ term: 'Округлить', description: 'берёт ближайшее целое значение.' },
				{
					term: 'Округлить вверх',
					description: 'всегда берёт большее целое значение.'
				}
			]
		}
	};
	protected readonly autoPresetPanelStyle = {
		width: '12rem',
		maxWidth: '12rem',
		overflowX: 'hidden'
	};
	protected readonly mechanicsEditorContext: SpellMechanicsEditorContext = {
		autoValueRangeModeOptions: this.autoValueRangeModeOptions,
		updateSelectedProgressionSourceKind: (block, parameterId, sourceKind) =>
			this.updateSelectedProgressionSourceKind(block, parameterId, sourceKind),
		autoTransformSourceOptionsRenderer: (value, source) =>
			this.autoTransformSourceOptions(value, source),
		updateMechanicTargetTemplate: (block, parameter, templateId) =>
			this.updateMechanicTargetTemplate(block, parameter, templateId),
		updateMechanicTargetConfig: (block, parameterId, config) =>
			this.updateMechanicTargetConfig(block, parameterId, config)
	};
	protected readonly progressionPreviewSteps = computed(() =>
		this.skillLevels()
			.filter(level => level.isActive)
			.sort((left, right) => left.level - right.level)
			.map(level => level.level)
	);
	protected readonly skillLevelOptions = computed(() =>
		this.skillLevels()
			.filter(level => level.isActive)
			.sort((left, right) => left.level - right.level)
			.map(level => ({
				label: `${level.level} - ${level.name}`,
				value: level.level
			}))
	);
	protected readonly progressionPresetOptions = computed(() =>
		this.progressionPresets()
			.filter(preset => preset.isActive)
			.sort(compareByOrderAndName)
			.map(preset => ({
				label: preset.name,
				value: preset.id
			}))
	);
	protected readonly textMechanicBlockOptions = computed(() => {
		const draft = this.draft();

		return (draft?.mechanicBlocks ?? []).map((block, index) => ({
			label: `${index + 1}. ${
				this.mechanicBlockMechanic(block)?.name ?? 'Механика не найдена'
			}`,
			value: block.id
		}));
	});
	protected readonly spellTextPreviewBlocks = computed(() => {
		const draft = this.draft();

		if (!draft) {
			return [];
		}

		const parts = draft.textBlocks
			.slice()
			.sort((left, right) => left.sortOrder - right.sortOrder)
			.filter(block => block.isActive)
			.flatMap(block =>
				this.renderSpellTextBlockParts(block, this.spellTextPreviewMode())
			)
			.filter(part => part.kind === 'effectScale' || part.text.trim().length);

		if (this.spellTextPreviewMode() !== 'game') {
			return parts;
		}

		const unavailableReason = this.spellCastingUnavailableReason();

		return unavailableReason
			? [{ kind: 'paragraph' as const, text: unavailableReason }, ...parts]
			: parts;
	});
	protected readonly spellTextPreview = computed(() => {
		const draft = this.draft();

		if (!draft) {
			return '';
		}

		const text = draft.textBlocks
			.slice()
			.sort((left, right) => left.sortOrder - right.sortOrder)
			.filter(block => block.isActive)
			.map(block =>
				this.renderSpellTextBlock(block, this.spellTextPreviewMode())
			)
			.filter(text => text.trim().length)
			.join('\n\n');

		if (this.spellTextPreviewMode() !== 'game') {
			return text;
		}

		const unavailableReason = this.spellCastingUnavailableReason();

		return unavailableReason ? `${unavailableReason}\n\n${text}`.trim() : text;
	});
	protected readonly formulaSourceGroups = computed<
		MechanicCalculationSourceGroup[]
	>(() => {
		const selection = this.selectedFormulaParameter();
		const block = selection
			? (this.draft()?.mechanicBlocks[selection.blockIndex] ?? null)
			: null;

		return this.formulaSourceGroupsForBlock(block);
	});
	protected readonly formulaSourceNames = computed(
		() =>
			new Map(
				this.formulaSourceGroups()
					.flatMap(group => group.items)
					.map(item => [item.id, item.name] as const)
			)
	);

	constructor() {
		this.loadSpell();
	}

	protected autoTransformSourceOptions(
		value: SpellAutoParameterValue,
		currentSource: SpellAutoParameterSource
	): CommandSelectOptionGroup[] {
		const options = value.sources
			.filter(source => source.id !== currentSource.id)
			.map((source, index) => ({
				label: `${index + 1}. ${this.autoSourceKindLabel(source.sourceKind)}`,
				value: source.sourceKey || source.id
			}));

		return createSingleCommandOptionGroup('Влияния', options);
	}

	protected addSpellTextBlock(kind: SpellTextBlockKind) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			textBlocks: [
				...draft.textBlocks,
				createSpellTextBlockDraft(kind, draft.textBlocks.length, {
					mechanicBlockId: draft.mechanicBlocks[0]?.id ?? ''
				})
			]
		});
	}

	protected addSpellMechanicTextBlocks() {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		const existingMechanicBlockIds = new Set(
			draft.textBlocks
				.filter(block => block.kind === 'mechanicText')
				.map(block => block.mechanicBlockId)
		);
		const missingBlocks = draft.mechanicBlocks
			.filter(block => !existingMechanicBlockIds.has(block.id))
			.map((block, index) =>
				createSpellTextBlockDraft(
					'mechanicText',
					draft.textBlocks.length + index,
					{
						mechanicBlockId: block.id
					}
				)
			);

		if (!missingBlocks.length) {
			return;
		}

		this.patchDraft({
			textBlocks: [...draft.textBlocks, ...missingBlocks]
		});
	}

	protected updateSpellTextBlock(
		blockId: string,
		patch: Partial<SpellTextBlock>
	) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			textBlocks: draft.textBlocks.map(block =>
				block.id === blockId ? { ...block, ...patch } : block
			)
		});
	}

	protected deleteSpellTextBlock(blockId: string) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			textBlocks: draft.textBlocks
				.filter(block => block.id !== blockId)
				.map((block, index) => ({ ...block, sortOrder: index }))
		});
	}

	protected moveSpellTextBlock(index: number, direction: -1 | 1) {
		const draft = this.draft();
		const nextIndex = index + direction;

		if (!draft || nextIndex < 0 || nextIndex >= draft.textBlocks.length) {
			return;
		}

		const blocks = [...draft.textBlocks];
		const current = blocks[index];
		const next = blocks[nextIndex];

		if (!current || !next) {
			return;
		}

		blocks[index] = next;
		blocks[nextIndex] = current;
		this.patchDraft({
			textBlocks: blocks.map((block, blockIndex) => ({
				...block,
				sortOrder: blockIndex
			}))
		});
	}

	protected isFirstSpellTextBlock(index: number) {
		return index === 0;
	}

	protected isLastSpellTextBlock(index: number) {
		return index === (this.draft()?.textBlocks.length ?? 0) - 1;
	}

	protected setActiveTab(value: string | number | undefined) {
		this.pageStore.setActiveTab(value);
	}

	protected updateMechanicTargetConfig(
		block: SpellMechanicBlockDraft,
		parameterId: string,
		patch: Partial<SpellTargetConfig>
	) {
		const targetId = this.parameterValue(block, parameterId);

		if (!targetId) {
			return;
		}

		this.updateTargetConfigById(targetId, patch);
	}

	protected updateMechanicTargetTemplate(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter,
		templateId: TargetTemplateId
	) {
		const draft = this.draft();
		const blockIndex = draft?.mechanicBlocks.findIndex(
			item => item.id === block.id
		);

		if (!draft || blockIndex === undefined || blockIndex < 0) {
			return;
		}

		const currentTargetId = this.parameterValue(block, parameter.id);
		const currentTarget =
			draft.targetConfigs.find(target => target.id === currentTargetId) ?? null;
		const nextTarget = createTargetConfigFromTemplate(
			templateId,
			parameter.defaultTargetConfig,
			currentTarget?.id ?? crypto.randomUUID(),
			currentTarget?.sortOrder ?? draft.targetConfigs.length,
			currentTarget
		);

		if (!nextTarget) {
			return;
		}

		const nextTargets = currentTarget
			? draft.targetConfigs.map(target =>
					target.id === currentTarget.id ? nextTarget : target
				)
			: [...draft.targetConfigs, nextTarget];

		this.patchDraft({
			targetConfigs: nextTargets.map((target, index) => ({
				...target,
				sortOrder: index
			})),
			mechanicBlocks: draft.mechanicBlocks.map((item, index) =>
				index === blockIndex
					? {
							...item,
							parameterValues: {
								...item.parameterValues,
								[parameter.id]: nextTarget.id
							}
						}
					: item
			)
		});
	}

	protected mechanicTargetConfig(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellTargetConfig | null {
		const targetId = this.parameterValue(block, parameterId);
		return (
			this.draft()?.targetConfigs.find(target => target.id === targetId) ?? null
		);
	}

	protected mechanicTargetTemplate(
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

	protected targetTemplateOptionGroupsForParameter(
		parameter: SpellMechanicParameter
	): TargetTemplateOptionGroup[] {
		return createTargetTemplateOptionGroups(parameter.defaultTargetConfig);
	}

	protected targetCountParameterOptions(
		block: SpellMechanicBlockDraft,
		currentParameterId: string
	) {
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

	protected updateSpellTextPreviewMode(mode: SpellTextPreviewMode) {
		this.pageStore.setSpellTextPreviewMode(mode);
	}

	protected targetConfigText(target: TargetConfigLike) {
		return targetConfigText(target);
	}

	protected mechanicTargetPreview(
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

	protected mechanicTargetRuntimeSummary(
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

	protected setAddMechanicWizardVisible(visible: boolean) {
		this.pageStore.setAddMechanicWizardVisible(visible);
	}

	protected updateWizardMechanic(mechanicId: string | null) {
		this.pageStore.setSelectedWizardMechanicId(mechanicId);
	}

	protected confirmAddMechanicBlock() {
		const mechanic = this.spellMechanics().find(
			item => item.id === this.selectedWizardMechanicId()
		);

		if (!mechanic) {
			return;
		}

		const draft = this.draft();

		if (!draft) {
			return;
		}

		const patch = createMechanicBlockPatch(
			draft,
			mechanic,
			this.essenceMagicWord()
		);

		this.patchDraft({
			...patch,
			textBlocks: [
				...draft.textBlocks,
				createSpellTextBlockDraft('mechanicText', draft.textBlocks.length, {
					mechanicBlockId:
						patch.mechanicBlocks[draft.mechanicBlocks.length]?.id ?? ''
				})
			]
		});
		this.pageStore.selectAppendedMechanicBlock(draft.mechanicBlocks.length);
	}

	protected selectMechanicProblem(problem: MechanicProblemItem) {
		this.pageStore.selectMechanicProblem(problem.blockIndex);
	}

	protected updateMechanicBlockParameter(
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

	protected updateMechanicBlockParameterMode(
		blockIndex: number,
		parameterId: string,
		mode: SpellParameterValueMode
	) {
		const block = this.draft()?.mechanicBlocks[blockIndex];
		const currentValue = block
			? this.rawParameterValue(block, parameterId)
			: undefined;
		const nextValue =
			mode === 'progression'
				? createProgressionParameterValue(this.firstProgressionPreset())
				: mode === 'formula'
					? createFormulaParameterValue()
					: mode === 'auto'
						? createAutoParameterValue()
						: createStaticParameterValue(parameterValueText(currentValue));

		this.updateMechanicBlockParameter(blockIndex, parameterId, nextValue);
	}

	protected updateSelectedMechanicBlockParameter(
		parameterId: string,
		value: SpellParameterValue | null
	) {
		const index = this.selectedMechanicBlockIndex();

		if (index !== null) {
			this.updateMechanicBlockParameter(index, parameterId, value);
		}
	}

	protected updateSelectedMechanicBlockParameterMode(
		parameterId: string,
		mode: SpellParameterValueMode
	) {
		const index = this.selectedMechanicBlockIndex();

		if (index !== null) {
			this.updateMechanicBlockParameterMode(index, parameterId, mode);
		}
	}

	protected updateSelectedStaticParameterValue(
		parameterId: string,
		value: string
	) {
		this.updateSelectedMechanicBlockParameter(
			parameterId,
			createStaticParameterValue(value)
		);
	}

	protected updateSelectedPlainParameterValue(
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

	protected updateSelectedProgressionParameter(
		parameterId: string,
		patch: Partial<SpellProgressionParameterValue>
	) {
		const index = this.selectedMechanicBlockIndex();
		const block = this.selectedMechanicBlock();

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

	protected updateSelectedProgressionPreset(
		parameterId: string,
		presetId: string
	) {
		const preset = this.progressionPresets().find(item => item.id === presetId);

		this.updateSelectedProgressionParameter(parameterId, {
			presetId,
			config: { ...(preset?.config ?? {}) }
		});
	}

	protected updateSelectedProgressionConfig(
		parameterId: string,
		key: string,
		value: number | null
	) {
		const block = this.selectedMechanicBlock();
		const current = block
			? this.progressionParameterValue(block, parameterId)
			: null;

		if (!current) {
			return;
		}

		this.updateSelectedProgressionParameter(parameterId, {
			config: {
				...current.config,
				[key]: value ?? 0
			}
		});
	}

	protected updateSelectedProgressionRoundingMode(
		parameterId: string,
		roundingModeValue: ProgressionPresetRoundingMode
	) {
		const block = this.selectedMechanicBlock();
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

	protected updateSelectedAutoParameter(
		parameterId: string,
		patch: Partial<SpellAutoParameterValue>
	) {
		const index = this.selectedMechanicBlockIndex();
		const block = this.selectedMechanicBlock();

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

	protected updateSelectedAutoSourceMode(
		parameterId: string,
		sourceMode: AutoValueSourceMode
	) {
		const block = this.selectedMechanicBlock();
		const current = block ? this.autoParameterValue(block, parameterId) : null;

		if (!current) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sourceMode,
			sources: createAutoSourcesForMode(sourceMode, current.sources)
		});
	}

	protected addSelectedAutoSource(parameterId: string) {
		const block = this.selectedMechanicBlock();
		const current = block ? this.autoParameterValue(block, parameterId) : null;

		if (!current) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sources: [...current.sources, createAutoParameterSource()]
		});
	}

	protected updateSelectedAutoSource(
		parameterId: string,
		sourceId: string,
		patch: Partial<SpellAutoParameterSource>
	) {
		const block = this.selectedMechanicBlock();
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

	protected autoSourceKeyOptions(
		block: SpellMechanicBlockDraft,
		source: SpellAutoParameterSource
	): CommandSelectOptionGroup[] {
		switch (source.sourceKind) {
			case 'mechanicParameter':
				return this.mechanicParameterSourceOptionGroups(block);
			case 'systemValue':
				return this.systemValueSourceOptionGroups();
			case 'essenceProfile':
				return createSingleCommandOptionGroup(
					'Профиль сущности',
					ESSENCE_PROFILE_SOURCE_OPTIONS
				);
			case 'manual':
				return [];
		}
	}

	protected mechanicAutoSourceKeyOptionsRenderer(
		block: SpellMechanicBlockDraft
	) {
		return (source: SpellAutoParameterSource) =>
			this.autoSourceKeyOptions(block, source);
	}

	protected autoSourceKeyLabel(source: SpellAutoParameterSource) {
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
	}

	protected autoSourceSummary(source: SpellAutoParameterSource) {
		return `${this.autoSourceKindLabel(source.sourceKind)} / ${this.autoSourceTargetLabel(source.target)}`;
	}

	protected autoSourceKindLabel(sourceKind: AutoValueSourceKind) {
		return (
			this.autoValueSourceKindOptions.find(
				option => option.value === sourceKind
			)?.label ?? 'Источник'
		);
	}

	protected autoSourceTargetLabel(target: AutoValueSourceTarget) {
		return (
			this.autoValueSourceTargetOptions.find(option => option.value === target)
				?.label ?? 'Влияние'
		);
	}

	protected autoSourceCollapseKey(
		scope: string,
		source: SpellAutoParameterSource
	) {
		return `${scope}:${source.id}`;
	}

	protected isAutoSourceCollapsed(
		scope: string,
		source: SpellAutoParameterSource
	) {
		return this.pageStore.isAutoSourceCollapsed(
			this.autoSourceCollapseKey(scope, source)
		);
	}

	protected toggleAutoSourceCollapsed(
		scope: string,
		source: SpellAutoParameterSource
	) {
		this.pageStore.toggleAutoSourceCollapsed(
			this.autoSourceCollapseKey(scope, source)
		);
	}

	protected mechanicParameterCollapseKey(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return `${block.id}:${parameterStorageKey(parameter)}`;
	}

	protected isMechanicParameterExpanded(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return this.pageStore.isMechanicParameterExpanded(
			this.mechanicParameterCollapseKey(block, parameter)
		);
	}

	protected toggleMechanicParameterExpanded(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		this.pageStore.toggleMechanicParameterExpanded(
			this.mechanicParameterCollapseKey(block, parameter)
		);
	}

	protected defaultAutoSourceKey(
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
					this.systemValues().find(
						value => value.name === 'Уровень Заклинателя'
					)?.id ??
					this.systemValues().slice().sort(compareBySectionAndName)[0]?.id ??
					''
				);
			case 'essenceProfile':
				return 'damage';
			case 'manual':
				return '';
		}
	}

	protected defaultAutoSourceKeyRenderer(block: SpellMechanicBlockDraft) {
		return (sourceKind: AutoValueSourceKind) =>
			this.defaultAutoSourceKey(block, sourceKind);
	}

	protected deleteSelectedAutoSource(parameterId: string, sourceId: string) {
		const block = this.selectedMechanicBlock();
		const current = block ? this.autoParameterValue(block, parameterId) : null;

		if (!current || current.sources.length <= 1) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sources: current.sources.filter(source => source.id !== sourceId)
		});
	}

	protected autoPresetOptions(
		parameter: SpellMechanicParameter
	): CommandSelectOptionGroup[] {
		return createAutoPresetOptions(parameter.numericRole);
	}

	protected applySelectedAutoPreset(
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

	protected mechanicBlockMechanic(block: SpellMechanicBlockDraft) {
		return this.findMechanic(block.mechanicId);
	}

	protected mechanicBlockParameters(block: SpellMechanicBlockDraft) {
		return this.mechanicBlockMechanic(block)?.parameters ?? [];
	}

	protected isEffectScaleBlock(block: SpellMechanicBlockDraft) {
		return (
			this.mechanicBlockMechanic(block)?.actions.some(
				action => action.kind === 'effectScale'
			) ?? false
		);
	}

	protected effectScaleConfig(
		block: SpellMechanicBlockDraft
	): SpellEffectScaleConfig {
		return readSpellEffectScaleConfig(block.config['effectScale']);
	}

	protected mechanicBlockTextPreview(
		block: SpellMechanicBlockDraft,
		mode: SpellTextPreviewMode = this.spellTextPreviewMode()
	) {
		const mechanic = this.mechanicBlockMechanic(block);

		if (!mechanic) {
			return 'Механика не найдена.';
		}

		return renderMechanicTextTemplate(
			mechanic.textTemplate,
			mechanic,
			block.parameterValues,
			this.mechanicApplicationConfig(block),
			value =>
				mode === 'game'
					? this.gameParameterValueLabel(block, value.value, value.parameter)
					: this.parameterValueLabel(value.kind, value.value)
		);
	}

	protected mechanicApplicationConfig(
		block: SpellMechanicBlockDraft
	): SpellMechanicApplicationConfig {
		return normalizeApplicationConfig(
			block.config.application ??
				readDefaultApplicationConfig(
					this.mechanicBlockMechanic(block)?.configSchema ?? {}
				)
		);
	}

	protected renderSpellTextBlock(
		block: SpellTextBlock,
		mode: SpellTextPreviewMode = this.spellTextPreviewMode()
	) {
		if (block.kind === 'text') {
			return block.text;
		}

		const mechanicBlock = this.draft()?.mechanicBlocks.find(
			item => item.id === block.mechanicBlockId
		);

		return mechanicBlock
			? this.mechanicBlockTextPreview(mechanicBlock, mode)
			: '';
	}

	protected renderSpellTextBlockParts(
		block: SpellTextBlock,
		mode: SpellTextPreviewMode = this.spellTextPreviewMode()
	): SpellTextPreviewPart[] {
		if (block.kind === 'text') {
			return [{ kind: 'paragraph', text: block.text }];
		}

		const mechanicBlock = this.draft()?.mechanicBlocks.find(
			item => item.id === block.mechanicBlockId
		);

		if (!mechanicBlock) {
			return [];
		}

		if (this.isEffectScaleBlock(mechanicBlock)) {
			return [
				{
					kind: 'effectScale',
					intro: this.effectScaleTextIntro(mechanicBlock, mode),
					items: this.effectScaleConfig(mechanicBlock).items
				}
			];
		}

		return [
			{
				kind: 'paragraph',
				text: this.mechanicBlockTextPreview(mechanicBlock, mode)
			}
		];
	}

	protected effectScaleTextIntro(
		block: SpellMechanicBlockDraft,
		mode: SpellTextPreviewMode = this.spellTextPreviewMode()
	) {
		const skill = this.effectScaleSkillText(block, mode);
		const config = this.effectScaleConfig(block);
		const hasAutomaticItem = config.items.some(
			item => item.requirement === 'automatic'
		);
		const automaticText = hasAutomaticItem
			? ' Пункт без проверки можно выбрать без броска.'
			: '';

		return `Если цель — объект, совершите проверку навыком ${skill}. По количеству успехов выберите доступный эффект из таблицы.${automaticText}`;
	}

	protected effectScaleRequirementText(item: SpellEffectScaleItemConfig) {
		if (item.requirement === 'automatic') {
			return 'Без проверки';
		}

		return item.isOpenEnded
			? `${item.threshold}+ успеха`
			: `${item.threshold} успех`;
	}

	private effectScaleSkillText(
		block: SpellMechanicBlockDraft,
		mode: SpellTextPreviewMode
	) {
		const mechanic = this.mechanicBlockMechanic(block);
		const parameter = mechanic?.parameters.find(
			item => item.slug === 'navyk-proverki'
		);
		const value = block.parameterValues['navyk-proverki'];

		if (!parameter) {
			return 'проверки';
		}

		return mode === 'game'
			? this.gameParameterValueLabel(block, value, parameter)
			: this.parameterValueLabel(parameter.kind, value);
	}

	protected spellTextBlockPreview(block: SpellTextBlock) {
		const text = this.renderSpellTextBlock(
			block,
			this.spellTextPreviewMode()
		).trim();
		return text || 'Текст пока пустой.';
	}

	protected mechanicReadinessStatus(
		block: SpellMechanicBlockDraft
	): MechanicReadinessStatus {
		const mechanic = this.mechanicBlockMechanic(block);

		if (!mechanic) {
			return {
				label: 'Ошибка',
				severity: 'danger',
				issues: ['Механика не найдена']
			};
		}

		if (!block.isActive) {
			return {
				label: 'Отключено',
				severity: 'secondary',
				issues: ['Механика отключена']
			};
		}

		const issues = mechanic.parameters
			.filter(parameter => parameter.required)
			.filter(
				parameter => !this.isMechanicParameterConfigured(block, parameter)
			)
			.map(parameter => mechanicParameterMissingLabel(parameter));
		const effectScaleIssues = this.isEffectScaleBlock(block)
			? this.effectScaleReadinessIssues(block)
			: [];

		return {
			label:
				issues.length || effectScaleIssues.length
					? [...issues, ...effectScaleIssues][0]
					: 'Готово',
			severity: issues.length || effectScaleIssues.length ? 'warn' : 'success',
			issues: [...issues, ...effectScaleIssues]
		};
	}

	protected effectScaleReadinessIssues(block: SpellMechanicBlockDraft) {
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
				const nestedMechanic = this.mechanicBlockMechanic(nestedDraft);

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

	protected wizardRequiredParameters(mechanic: SpellMechanic) {
		return mechanic.parameters.filter(parameter => parameter.required);
	}

	protected wizardParameterDefaultLabel(parameter: SpellMechanicParameter) {
		const essence = this.essenceMagicWord();

		if (parameter.kind === 'target' && parameter.defaultTargetConfig) {
			return targetConfigText(parameter.defaultTargetConfig);
		}

		const value = defaultParameterValue(parameter, essence, {});

		if (isStaticParameterValue(value)) {
			return value.value || 'Требуется настройка';
		}

		if (typeof value === 'string' && value) {
			return this.parameterValueLabel(parameter.kind, value);
		}

		if (parameter.defaultValue.mode === 'fromMagicWord') {
			return 'Из сущности, если связь задана';
		}

		return 'Требуется настройка';
	}

	protected wizardParameterReady(parameter: SpellMechanicParameter) {
		const essence = this.essenceMagicWord();

		if (parameter.kind === 'target') {
			return !!parameter.defaultTargetConfig;
		}

		const value = defaultParameterValue(parameter, essence, {});
		return isConfiguredParameterValue(parameter, value, this.draft());
	}

	protected parameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	) {
		const value = this.rawParameterValue(block, parameterId);
		return parameterValueText(value);
	}

	protected parameterValueMode(
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

	protected staticParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	) {
		return parameterValueText(this.rawParameterValue(block, parameterId));
	}

	protected supportsProgression(parameter: SpellMechanicParameter) {
		return supportsNumericParameterKind(parameter.kind);
	}

	protected progressionParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellProgressionParameterValue | null {
		const value = this.rawParameterValue(block, parameterId);
		return isProgressionParameterValue(value) ? value : null;
	}

	protected formulaParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellFormulaParameterValue | null {
		const value = this.rawParameterValue(block, parameterId);
		return isFormulaParameterValue(value) ? value : null;
	}

	protected autoParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellAutoParameterValue | null {
		const value = this.rawParameterValue(block, parameterId);
		if (isAutoParameterValue(value)) {
			return value;
		}

		return isRecord(value) && value['mode'] === 'auto'
			? normalizeLooseAutoParameterValue(value)
			: null;
	}

	private maxActiveSkillLevel() {
		return Math.max(
			0,
			...this.skillLevels()
				.filter(level => level.isActive)
				.map(level => level.level)
		);
	}

	protected formulaSourceGroupsForBlock(
		block: SpellMechanicBlockDraft | null
	): MechanicCalculationSourceGroup[] {
		const mechanic = block ? this.mechanicBlockMechanic(block) : null;
		const parameters = mechanic?.parameters ?? [];
		const mechanicParameterSources = parameters
			.filter(
				parameter => parameter.kind === 'number' || parameter.kind === 'formula'
			)
			.sort(compareByOrderAndName)
			.map(parameter => ({
				id: formulaSourceId('parameter', parameterStorageKey(parameter)),
				name: this.mechanicParameterSourceLabel(block, parameter),
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
				name: this.mechanicParameterSourceLabel(block, parameter),
				searchText: `${parameter.name} уровень навык`
			}));
		const staticSkillSources = createSkillOptionGroups(
			this.skillCategories(),
			this.skills()
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
		const systemValueSources = this.systemValues()
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

	protected formulaSourceNamesForBlock(block: SpellMechanicBlockDraft) {
		return new Map(
			this.formulaSourceGroupsForBlock(block)
				.flatMap(group => group.items)
				.map(item => [item.id, item.name] as const)
		);
	}

	private rawParameterValue(
		block: SpellMechanicBlockDraft,
		parameterIdOrSlug: string
	) {
		const key = this.parameterStorageKey(block, parameterIdOrSlug);

		return block.parameterValues[key];
	}

	private mechanicParameterSourceOptionGroups(
		block: SpellMechanicBlockDraft
	): CommandSelectOptionGroup[] {
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

	private systemValueSourceOptionGroups(): CommandSelectOptionGroup[] {
		const groups = new Map<string, CommandSelectOption[]>();

		for (const value of this.systemValues()
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

	private casterLevelSystemValue() {
		return this.systemValues().find(
			value =>
				value.slug === 'uroven-zaklinatelya' ||
				value.name === 'Уровень Заклинателя'
		);
	}

	private matchesSystemValueSource(sourceKey: string, value: SystemValue) {
		return sourceKey === value.id || sourceKey === value.slug;
	}

	private parameterStorageKey(
		block: SpellMechanicBlockDraft,
		parameterIdOrSlug: string
	) {
		const parameter = this.mechanicBlockMechanic(block)?.parameters.find(
			item => item.id === parameterIdOrSlug || item.slug === parameterIdOrSlug
		);

		return parameter ? parameterStorageKey(parameter) : parameterIdOrSlug;
	}

	private serializeMechanicBlock(
		block: SpellMechanicBlockDraft,
		sortOrder: number
	): SerializedSpellMechanicBlock {
		return {
			id: block.id,
			mechanicId: block.mechanicId,
			parameterValues: this.normalizeBlockParameterValues(block),
			config: this.normalizeBlockConfig(block),
			isActive: block.isActive,
			sortOrder
		};
	}

	private normalizeBlockParameterValues(
		block: SpellMechanicBlockDraft
	): Record<string, SpellParameterValue> {
		return normalizeParameterValues(
			block.parameterValues,
			this.mechanicBlockMechanic(block)?.parameters ?? []
		);
	}

	private normalizeBlockConfig(
		block: SpellMechanicBlockDraft
	): SpellMechanicBlockConfig {
		const config: SpellMechanicBlockConfig = {
			...block.config,
			application: this.mechanicApplicationConfig(block)
		};
		const effectScale = config['effectScale'];

		if (!isRecord(effectScale) || !Array.isArray(effectScale['items'])) {
			return config;
		}

		return {
			...config,
			effectScale: {
				...effectScale,
				items: effectScale['items'].map((item): unknown => {
					if (!isRecord(item) || !Array.isArray(item['mechanicBlocks'])) {
						return item;
					}

					return {
						...item,
						mechanicBlocks: item['mechanicBlocks'].map(
							(nestedBlock, index): unknown =>
								isSpellMechanicBlockDraft(nestedBlock)
									? this.serializeMechanicBlock(nestedBlock, index)
									: nestedBlock
						)
					};
				})
			}
		} as SpellMechanicBlockConfig;
	}

	private mechanicParameterSourceLabel(
		block: SpellMechanicBlockDraft | null,
		parameter: SpellMechanicParameter
	) {
		const value = block
			? this.rawParameterValue(block, parameter.id)
			: undefined;
		const valueLabel =
			value === undefined
				? 'Не выбрано'
				: this.parameterValueLabel(parameter.kind, value);

		if (parameter.kind === 'skill') {
			return `Уровень: ${parameter.name} → ${valueLabel}`;
		}

		if (parameter.kind === 'systemValue') {
			return `Значение: ${parameter.name} → ${valueLabel}`;
		}

		return `Параметр: ${parameter.name} → ${valueLabel}`;
	}

	protected openFormulaGraphEditor(blockIndex: number, parameterId: string) {
		this.pageStore.setSelectedFormulaParameter({ blockIndex, parameterId });
	}

	protected openSelectedFormulaGraphEditor(parameterId: string) {
		const blockIndex = this.selectedMechanicBlockIndex();

		if (blockIndex !== null) {
			this.openFormulaGraphEditor(blockIndex, parameterId);
		}
	}

	protected closeFormulaGraphEditor() {
		this.pageStore.setSelectedFormulaParameter(null);
	}

	protected setFormulaGraphEditorVisible(visible: boolean) {
		if (!visible) {
			this.closeFormulaGraphEditor();
		}
	}

	protected selectedFormulaGraph() {
		const selection = this.selectedFormulaParameter();
		const block = selection
			? (this.draft()?.mechanicBlocks[selection.blockIndex] ?? null)
			: null;

		return block
			? (this.formulaParameterValue(block, selection?.parameterId ?? '')
					?.graph ?? null)
			: null;
	}

	protected updateSelectedFormulaGraph(
		graph: MechanicCalculationGraphState | null
	) {
		const selection = this.selectedFormulaParameter();
		const block = selection
			? (this.draft()?.mechanicBlocks[selection.blockIndex] ?? null)
			: null;

		if (!selection || !block) {
			return;
		}

		this.updateMechanicBlockParameter(
			selection.blockIndex,
			selection.parameterId,
			{
				mode: 'formula',
				graph
			}
		);
	}

	protected progressionSourceKeyOptions(
		block: SpellMechanicBlockDraft,
		value: SpellProgressionParameterValue
	) {
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
			return this.essenceProfileSourceOptions.map(option => ({
				label: option.label,
				value: option.value
			}));
		}

		return [];
	}

	protected updateSelectedProgressionSourceKind(
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

		this.updateSelectedProgressionParameter(parameterId, {
			sourceKind,
			sourceKey: nextSourceKey
		});
	}

	protected showAutoHelp(event: Event, key: AutoHelpKey, popover: Popover) {
		this.pageStore.setActiveAutoHelpKey(key);
		popover.toggle(event);
	}

	protected resetDraft() {
		if (!this.hasChanges()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Сбросить изменения?',
			message: 'Все несохранённые изменения будут потеряны.',
			acceptLabel: 'Сбросить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.pageStore.resetDraftSnapshot();
			}
		});
	}

	protected saveDraft() {
		const draft = this.draft();

		if (!draft || !this.hasChanges() || this.saving()) {
			return;
		}

		const name = draft.name.trim();

		if (!name) {
			this.pageStore.setErrorMessage('Название заклинания обязательно.');
			return;
		}

		const command = {
			actionId: draft.actionId,
			essenceId: draft.essenceId,
			gestureId: draft.gestureId,
			name,
			description: draft.description.trim(),
			config: normalizeSpellConfig(
				draft.config,
				this.findAreaShapeByGestureId(draft.gestureId),
				draft.gestureId
			),
			status: draft.status,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			mechanicBlocks: draft.mechanicBlocks.map((block, index) =>
				this.serializeMechanicBlock(block, index)
			),
			targetConfigs: draft.targetConfigs.map((target, index) => ({
				...target,
				sortOrder: index
			})),
			textBlocks: draft.textBlocks.map((block, index) => ({
				...block,
				sortOrder: index
			}))
		};
		const request = draft.id
			? this.repository.updateSpell(draft.id, command)
			: this.repository.createSpell(command);

		this.pageStore.setSaving(true);
		this.pageStore.setErrorMessage(null);
		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.setDraftFromSpell(saved);
				this.pageStore.setSaving(false);

				if (!draft.id) {
					void this.router.navigate(['/admin/rules/spells', saved.id], {
						replaceUrl: true
					});
				}
			},
			error: error => {
				this.pageStore.setErrorMessage(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить заклинание.'
				);
				this.pageStore.setSaving(false);
			}
		});
	}

	protected deleteSpell() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить заклинание?',
			message: `«${draft.name}» вернётся в состояние «Не заполнено».`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteSpellInternal(draft.id as string)
		});
	}

	protected statusLabel(status: PersistedSpellStatus) {
		return spellStatusLabel(status);
	}

	protected statusSeverity(status: PersistedSpellStatus) {
		switch (status) {
			case 'READY':
				return 'success';
			case 'TESTING':
				return 'info';
			case 'DRAFT':
				return 'warn';
		}
	}

	protected setRuntimePreviewVisible(visible: boolean) {
		this.pageStore.setRuntimePreviewVisible(visible);
	}

	protected runRuntimePreview(resetRolls = true) {
		this.pageStore.runRuntimePreview({
			resetRolls,
			hasChanges: this.hasChanges(),
			defaultSkillLevel: this.defaultRuntimeSkillLevel()
		});
	}

	protected runtimeRollKey(roll: SpellRuntimePendingRoll) {
		return this.pageStore.runtimeRollKey(roll);
	}

	protected runtimeChoiceKey(choice: SpellRuntimePendingChoice) {
		return this.pageStore.runtimeChoiceKey(choice);
	}

	protected runtimeRollDraft(roll: SpellRuntimePendingRoll) {
		return this.pageStore.runtimeRollDraft(
			roll,
			this.defaultRuntimeSkillLevel()
		);
	}

	protected updateRuntimeRollDiceCount(
		roll: SpellRuntimePendingRoll,
		diceCount: number | null
	) {
		this.pageStore.updateRuntimeRollDiceCount(
			roll,
			diceCount,
			this.defaultRuntimeSkillLevel()
		);
	}

	protected updateRuntimeRollSkillLevel(
		roll: SpellRuntimePendingRoll,
		skillLevel: number | null
	) {
		this.pageStore.updateRuntimeRollSkillLevel(
			roll,
			skillLevel,
			this.defaultRuntimeSkillLevel()
		);
	}

	protected rollRuntimePendingRoll(roll: SpellRuntimePendingRoll) {
		const draft = this.runtimeRollDraft(roll);
		const dice = Array.from({ length: draft.diceCount }, () => randomD6());
		const successes = countRuntimeSuccesses(
			dice,
			this.skillLevels(),
			draft.skillLevel
		);

		this.pageStore.submitRuntimeRoll({
			roll,
			dice,
			successes,
			hasChanges: this.hasChanges(),
			defaultSkillLevel: this.defaultRuntimeSkillLevel()
		});
	}

	protected chooseRuntimePendingChoice(
		choice: SpellRuntimePendingChoice,
		optionId: string
	) {
		this.pageStore.chooseRuntimePendingChoice({
			choice,
			optionId,
			hasChanges: this.hasChanges(),
			defaultSkillLevel: this.defaultRuntimeSkillLevel()
		});
	}

	protected runtimeValueLabel(value: unknown) {
		if (value === 'caster') {
			return 'Кастер';
		}

		if (value === 'spellTarget') {
			return 'Цель заклинания';
		}

		if (typeof value === 'string') {
			return this.skills().find(skill => skill.id === value)?.name ?? value;
		}

		if (typeof value === 'number') {
			return `${value}`;
		}

		if (typeof value === 'boolean') {
			return value ? 'Да' : 'Нет';
		}

		return 'Не выбрано';
	}

	protected runtimePreviewStatusLabel(status: SpellRuntimePreview['status']) {
		switch (status) {
			case 'BLOCKED':
				return 'Недоступно';
			case 'COMPLETED':
				return 'Выполнено';
			case 'WAITING_FOR_CHOICE':
				return 'Ожидает выбор';
			case 'WAITING_FOR_ROLLS':
				return 'Ожидает броски';
		}
	}

	protected runtimePreviewStatusSeverity(
		status: SpellRuntimePreview['status']
	): TagSeverity {
		switch (status) {
			case 'BLOCKED':
				return 'danger';
			case 'COMPLETED':
				return 'success';
			case 'WAITING_FOR_CHOICE':
			case 'WAITING_FOR_ROLLS':
				return 'warn';
		}
	}

	protected runtimeEffectTitle(effect: SpellRuntimeEffect) {
		switch (effect.kind) {
			case 'valueChange':
				return 'Изменение значения';
			case 'conditionAdd':
				return 'Наложение состояния';
			case 'conditionRemove':
				return 'Снятие состояния';
			case 'text':
				return 'Текст';
		}
	}

	protected runtimeEffectText(effect: SpellRuntimeEffect) {
		if (effect.kind === 'valueChange') {
			const valueName =
				effect.systemValueName ?? effect.systemValueId ?? 'значение';
			const operation =
				effect.operation === 'increase'
					? '+'
					: effect.operation === 'decrease'
						? '-'
						: '=';
			return `${valueName}: ${operation}${effect.amount ?? 0}`;
		}

		if (effect.kind === 'conditionAdd') {
			return `Состояние ${effect.conditionId ?? 'не выбрано'}, длительность ${effect.duration ?? 'не задана'}`;
		}

		if (effect.kind === 'conditionRemove') {
			return `Состояние ${effect.conditionId ?? 'не выбрано'}`;
		}

		return effect.text ?? '';
	}

	protected runtimeTraceSeverity(trace: RuntimeTraceRow): TagSeverity {
		return trace.status === 'pending' ? 'warn' : 'success';
	}

	protected runtimeTraceRows(trace: SpellRuntimeTraceEntry[]) {
		return flattenRuntimeTrace(trace);
	}

	private defaultRuntimeSkillLevel() {
		return (
			this.skillLevels()
				.filter(level => level.isActive && level.canRoll)
				.sort((left, right) => left.level - right.level)[0]?.level ?? 0
		);
	}

	private loadSpell() {
		this.pageStore.beginLoading();

		forkJoin({
			spells: this.repository.loadSpellCatalog(),
			mechanics: this.spellMechanicsRepository.loadCatalog(),
			words: this.repository.loadCatalog(),
			skills: this.skillsRepository.loadAdminCatalog(),
			damageTypes: this.damageTypesRepository.loadCatalog(),
			conditions: this.conditionsRepository.loadCatalog(),
			creatures: this.creaturesRepository.loadCatalog(),
			progressionPresets: this.progressionPresetsRepository.loadCatalog(),
			systemValues: this.valuesRepository.loadCatalog(),
			sandboxDraft: this.characterSheetSandboxRepository.loadDraft()
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: ({
					spells,
					mechanics,
					words,
					skills,
					damageTypes,
					conditions,
					creatures,
					progressionPresets,
					systemValues,
					sandboxDraft
				}) => {
					this.pageStore.setReferenceData({
						spellMechanics: mechanics.mechanics,
						magicWords: words.words,
						skills: skills.skills,
						skillCategories: skills.categories,
						skillLevels: skills.levels,
						damageTypes: damageTypes.damageTypes,
						conditions: conditions.conditions,
						creatures: creatures.creatures,
						creatureCharacteristics: creatures.characteristics,
						progressionPresets: progressionPresets.presets,
						systemValues: systemValues.values
					});
					this.pageStore.applySandboxInputValues(sandboxDraft.inputValues);

					const formula = findFormulaFromRoute(spells, this.route);

					if (!formula) {
						this.pageStore.setSpellNotFound();
						return;
					}

					this.setDraftFromFormula(formula);
				},
				error: error => {
					this.pageStore.failLoading(error);
				}
			});
	}

	private setDraftFromFormula(formula: SpellFormulaCandidate) {
		if (formula.spell) {
			this.repository
				.loadSpell(formula.spell.id)
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe({
					next: spell => {
						this.setDraftFromSpell(spell);
						this.pageStore.completeLoading();
					},
					error: error => this.pageStore.failLoading(error)
				});
			return;
		}

		this.setDraftSnapshot(
			createSpellDraftFromFormula(
				formula,
				this.findAreaShapeByGestureId(formula.gesture.id)
			)
		);
		this.pageStore.completeLoading();
	}

	private setDraftFromSpell(spell: Spell) {
		this.setDraftSnapshot(
			createSpellDraftFromSpell(spell, {
				areaShape: this.findAreaShapeByGestureId(spell.gestureId),
				spellMechanics: this.spellMechanics()
			})
		);
	}

	private setDraftSnapshot(draft: SpellDraft) {
		this.pageStore.setDraftSnapshot(draft);
	}

	private patchDraft(patch: Partial<SpellDraft>) {
		this.pageStore.patchDraft(patch);
	}

	private updateTargetConfigById(
		targetId: string,
		patch: Partial<SpellTargetConfig>
	) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			targetConfigs: draft.targetConfigs.map(target =>
				target.id === targetId ? { ...target, ...patch } : target
			)
		});
	}

	private updateMechanicBlock(index: number, block: SpellMechanicBlockDraft) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			mechanicBlocks: draft.mechanicBlocks.map((item, blockIndex) =>
				blockIndex === index ? block : item
			)
		});
	}

	private findMechanic(mechanicId: string) {
		return (
			this.spellMechanics().find(mechanic => mechanic.id === mechanicId) ?? null
		);
	}

	private findAreaShapeByGestureId(gestureId: string) {
		return (
			this.magicWords().find(word => word.id === gestureId)?.areaShape ?? null
		);
	}

	private firstProgressionPreset() {
		return (
			this.progressionPresets()
				.filter(preset => preset.isActive)
				.sort(compareByOrderAndName)[0] ?? null
		);
	}

	private essenceMagicWord() {
		const essenceId = this.draft()?.essenceId;
		return (
			this.magicWords().find(
				word => word.id === essenceId && word.type === 'ESSENCE'
			) ?? null
		);
	}

	private parameterValueLabel(
		kind: SpellMechanicParameterKind,
		value: unknown
	): string {
		if (isProgressionParameterValue(value)) {
			const preset = this.progressionPresets().find(
				item => item.id === value.presetId
			);
			return preset ? `Прогрессия: ${preset.name}` : 'Прогрессия';
		}

		if (isFormulaParameterValue(value)) {
			return formatMechanicCalculationFormula(
				value.graph,
				this.formulaSourceNames()
			);
		}

		if (isAutoParameterValue(value)) {
			return autoParameterFormulaLabel(value, this.formulaSourceNames());
		}

		if (isRecord(value) && value['mode'] === 'auto') {
			const autoValue = normalizeLooseAutoParameterValue(value);
			return autoValue
				? autoParameterFormulaLabel(autoValue, this.formulaSourceNames())
				: 'автоматически рассчитанное значение';
		}

		if (isStaticParameterValue(value)) {
			return this.parameterValueLabel(kind, value.value);
		}

		if (isRecord(value) && value['mode'] === 'static') {
			return this.parameterValueLabel(kind, value['value']);
		}

		if (!value) {
			return 'Не выбрано';
		}

		if (isRecord(value)) {
			if (kind === 'target' && typeof value['target'] === 'string') {
				const targetConfig = this.draft()?.targetConfigs.find(
					item => item.id === value['target'] || item.slug === value['target']
				);

				return targetConfig ? targetConfigText(targetConfig) : 'Не выбрано';
			}

			const linkedLabel = this.linkedParameterValueLabel(value);

			if (linkedLabel) {
				return this.parameterValueLabel(kind, linkedLabel);
			}
		}

		if (typeof value !== 'string') {
			return 'Настроено';
		}

		switch (kind) {
			case 'skill':
				return this.skills().find(item => item.id === value)?.name ?? value;
			case 'target':
				return targetConfigText(
					this.draft()?.targetConfigs.find(
						item => item.id === value || item.slug === value
					) ?? createTargetPreset('Цель', 'selected', 'any', 'one')
				);
			case 'damageType':
				return (
					this.damageTypes().find(item => item.id === value)?.name ?? value
				);
			case 'condition':
				return this.conditions().find(item => item.id === value)?.name ?? value;
			default:
				return value;
		}
	}

	private gameParameterValueLabel(
		block: SpellMechanicBlockDraft,
		value: unknown,
		parameter: SpellMechanicParameter
	): string {
		const kind = parameter.kind;

		if (kind === 'number' || kind === 'formula') {
			if (isAutoParameterValue(value)) {
				return this.gameNumberParameterLabel(
					this.evaluateAutoParameterForGameText(block, value),
					parameter
				);
			}

			if (isRecord(value) && value['mode'] === 'auto') {
				const autoValue = normalizeLooseAutoParameterValue(value);

				return autoValue
					? this.gameNumberParameterLabel(
							this.evaluateAutoParameterForGameText(block, autoValue),
							parameter
						)
					: 'не рассчитано';
			}

			if (isStaticParameterValue(value)) {
				return this.gameNumberParameterLabel(value.value, parameter);
			}

			if (isRecord(value) && value['mode'] === 'static') {
				return this.gameNumberParameterLabel(value['value'], parameter);
			}
		}

		return this.parameterValueLabel(kind, value);
	}

	private gameNumberParameterLabel(
		value: number | string | unknown,
		parameter: SpellMechanicParameter
	) {
		const numericValue =
			typeof value === 'number'
				? value
				: typeof value === 'string'
					? Number(value.replace(',', '.'))
					: Number.NaN;
		const label = Number.isFinite(numericValue)
			? formatPreviewNumber(numericValue)
			: this.parameterValueLabel(parameter.kind, value);

		if (parameter.numericRole === 'range' && Number.isFinite(numericValue)) {
			return `${label} ${meterGenitiveWord(numericValue)}`;
		}

		return label;
	}

	private evaluateAutoParameterForGameText(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue
	) {
		if (this.shouldUseAutoMinimumForGameText(block, value)) {
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
			const sourceValue = this.autoSourceRuntimeValue(block, source);
			const transformSourceValue = this.autoTransformRuntimeSourceValue(
				block,
				value,
				source,
				sourceValue
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
			config.limitMax === null && this.hasAutoMaximumSource(value)
				? config.base
				: config.limitMax;
		const limit = limitBase === null ? null : limitBase + groups.maximum;
		const limited = limit === null ? multiplied : Math.min(multiplied, limit);
		const raw = Math.max(value.minimum, limited);
		const ranged = this.applyAutoRuntimeRange(block, value, raw);
		const scaled = ranged * value.finalScale;

		return applyRuntimeRounding(scaled, value.roundingMode);
	}

	private applyAutoRuntimeRange(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue,
		raw: number
	) {
		if (
			value.rangeMode !== 'scale' ||
			value.maximum === null ||
			value.maximum <= value.minimum
		) {
			return raw;
		}

		const minRaw = this.evaluateAutoRuntimeRawValue(
			block,
			value,
			value.startLevel
		);
		const maxRaw = this.evaluateAutoRuntimeRawValue(
			block,
			value,
			this.maxActiveSkillLevel()
		);

		if (maxRaw === minRaw) {
			return value.minimum;
		}

		const ratio = (raw - minRaw) / (maxRaw - minRaw);
		const clampedRatio = Math.min(1, Math.max(0, ratio));

		return value.minimum + (value.maximum - value.minimum) * clampedRatio;
	}

	private evaluateAutoRuntimeRawValue(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue,
		x: number
	) {
		if (x < value.startLevel) {
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
				source.sourceKind === 'mechanicParameter'
					? x
					: this.autoSourceRuntimeValue(block, source);
			const transformSourceValue = this.autoTransformRuntimeSourceValue(
				block,
				value,
				source,
				x
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
			config.limitMax === null && this.hasAutoMaximumSource(value)
				? config.base
				: config.limitMax;
		const limit = limitBase === null ? null : limitBase + groups.maximum;
		const limited = limit === null ? multiplied : Math.min(multiplied, limit);

		return Math.max(value.minimum, limited);
	}

	private hasAutoMaximumSource(value: SpellAutoParameterValue) {
		return value.sources.some(source => source.target === 'maximum');
	}

	private autoTransformRuntimeSourceValue(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue,
		source: SpellAutoParameterSource,
		fallbackValue: number
	) {
		if (source.transform !== 'aboveSource') {
			return fallbackValue;
		}

		const transformSource =
			value.sources.find(item => item.id === source.transformSourceKey) ??
			value.sources.find(item => item.sourceKey === source.transformSourceKey);

		return transformSource
			? this.autoSourceRuntimeValue(block, transformSource)
			: fallbackValue;
	}

	private shouldUseAutoMinimumForGameText(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue
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
				source => this.autoSourceRuntimeValue(block, source) < value.startLevel
			)
		);
	}

	private autoSourceRuntimeValue(
		block: SpellMechanicBlockDraft,
		source: SpellAutoParameterSource
	) {
		switch (source.sourceKind) {
			case 'systemValue':
				return this.systemValueRuntimeValue(source.sourceKey);
			case 'mechanicParameter':
				return this.mechanicParameterRuntimeValue(block, source.sourceKey);
			case 'essenceProfile':
				return this.essenceProfileRuntimeValue(source.sourceKey);
			case 'manual':
				return 0;
		}
	}

	private mechanicParameterRuntimeValue(
		block: SpellMechanicBlockDraft,
		parameterSlug: string
	) {
		const parameter = this.mechanicBlockMechanic(block)?.parameters.find(
			item => item.slug === parameterSlug || item.id === parameterSlug
		);
		const value = this.rawParameterValue(block, parameterSlug);

		if (parameter?.kind === 'skill') {
			const skill = this.skillFromParameterValue(value);
			return skill ? this.systemValueRuntimeValue(skill.systemValue.id) : 0;
		}

		if (parameter?.kind === 'systemValue') {
			const systemValue = this.systemValueFromParameterValue(value);
			return systemValue ? this.systemValueRuntimeValue(systemValue.id) : 0;
		}

		if (parameter && supportsNumericParameterKind(parameter.kind)) {
			const text = parameterValueText(value);
			const numericValue = Number(text.replace(',', '.'));
			return Number.isFinite(numericValue) ? numericValue : 0;
		}

		return 0;
	}

	private skillFromParameterValue(value: unknown) {
		if (typeof value === 'string') {
			return this.skills().find(
				item => item.id === value || item.slug === value || item.name === value
			);
		}

		if (!isRecord(value)) {
			return null;
		}

		const nested =
			(isRecord(value['defaultSkill']) && value['defaultSkill']) ||
			(isRecord(value['skill']) && value['skill']) ||
			value;
		const slug = typeof nested['slug'] === 'string' ? nested['slug'] : '';
		const id = typeof nested['id'] === 'string' ? nested['id'] : '';
		const name = typeof nested['name'] === 'string' ? nested['name'] : '';

		return (
			this.skills().find(
				item =>
					(id && item.id === id) ||
					(slug && item.slug === slug) ||
					(name && item.name === name)
			) ?? null
		);
	}

	private systemValueFromParameterValue(value: unknown) {
		if (typeof value === 'string') {
			return this.systemValues().find(
				item => item.id === value || item.slug === value || item.name === value
			);
		}

		if (!isRecord(value)) {
			return null;
		}

		const slug = typeof value['slug'] === 'string' ? value['slug'] : '';
		const id = typeof value['id'] === 'string' ? value['id'] : '';
		const name = typeof value['name'] === 'string' ? value['name'] : '';

		return (
			this.systemValues().find(
				item =>
					(id && item.id === id) ||
					(slug && item.slug === slug) ||
					(name && item.name === name)
			) ?? null
		);
	}

	private systemValueRuntimeValue(systemValueIdOrSlug: string) {
		const systemValue = this.systemValues().find(
			item =>
				item.id === systemValueIdOrSlug || item.slug === systemValueIdOrSlug
		);

		if (!systemValue) {
			return 0;
		}

		const inputValues = this.sandboxInputValues();

		if (!systemValue.calculationGraph) {
			return inputValues[systemValue.id] ?? systemValue.baseValue;
		}

		return evaluateGraph(systemValue.calculationGraph, this.systemValues(), {
			...inputValues,
			[CHARACTER_INPUT_OVERRIDE_KEY]:
				inputValues[systemValue.id] ?? systemValue.baseValue
		}).finalBase;
	}

	private essenceProfileRuntimeValue(key: string) {
		const profile = this.essenceMagicWord()?.essenceProfile;

		if (!profile) {
			return 0;
		}

		switch (key) {
			case 'damage':
				return profile.damageAffinity;
			case 'range':
				return profile.rangeAffinity;
			case 'control':
				return profile.controlAffinity;
			case 'duration':
				return profile.durationAffinity;
			case 'area':
				return profile.areaAffinity;
			case 'stability':
				return profile.stabilityAffinity;
			default:
				return 0;
		}
	}

	private spellCastingUnavailableReason() {
		const linkedUnderstandingSkills = this.linkedSpellUnderstandingSkills();

		if (
			linkedUnderstandingSkills.length &&
			linkedUnderstandingSkills.some(
				skill => this.systemValueRuntimeValue(skill.systemValue.id) > 0
			)
		) {
			return null;
		}

		return 'Недоступно: требуется хотя бы одно связанное Понимание выше 0.';
	}

	private linkedSpellUnderstandingSkills() {
		const skillsById = new Map<string, Skill>();
		const essence = this.essenceMagicWord();

		for (const skillId of essence?.skillIds ?? []) {
			const skill = this.skills().find(
				item => item.id === skillId || item.slug === skillId
			);

			if (skill && isUnderstandingSkill(skill)) {
				skillsById.set(skill.id, skill);
			}
		}

		for (const block of this.draft()?.mechanicBlocks ?? []) {
			const mechanic = this.mechanicBlockMechanic(block);

			for (const parameter of mechanic?.parameters ?? []) {
				if (parameter.kind !== 'skill') {
					continue;
				}

				const skill = this.skillFromParameterValue(
					this.rawParameterValue(block, parameter.id)
				);

				if (skill && isUnderstandingSkill(skill)) {
					skillsById.set(skill.id, skill);
				}
			}
		}

		return [...skillsById.values()];
	}

	private linkedParameterValueLabel(value: Record<string, unknown>) {
		if (typeof value['name'] === 'string' && value['name'].trim()) {
			return value['name'];
		}

		for (const key of [
			'defaultDamageType',
			'defaultSkill',
			'defaultCondition'
		]) {
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

	private isMechanicParameterConfigured(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return isConfiguredParameterValue(
			parameter,
			this.rawParameterValue(block, parameter.id),
			this.draft()
		);
	}

	private deleteSpellInternal(id: string) {
		this.pageStore.setSaving(true);
		this.pageStore.setErrorMessage(null);
		this.repository
			.deleteSpell(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.pageStore.setSaving(false);
					void this.router.navigate(['/admin/rules/spells']);
				},
				error: error => {
					this.pageStore.setErrorMessage(
						error instanceof Error
							? error.message
							: 'Не удалось удалить заклинание.'
					);
					this.pageStore.setSaving(false);
				}
			});
	}
}

function findFormulaFromRoute(
	catalog: SpellCatalog,
	route: ActivatedRoute
): SpellFormulaCandidate | null {
	const spellId = route.snapshot.paramMap.get('spellId');
	const actionId = route.snapshot.paramMap.get('actionId');
	const essenceId = route.snapshot.paramMap.get('essenceId');
	const gestureId = route.snapshot.paramMap.get('gestureId');

	for (const group of catalog.groups) {
		for (const formula of group.formulas) {
			if (spellId && formula.spell?.id === spellId) {
				return formula;
			}

			if (
				actionId &&
				essenceId &&
				gestureId &&
				formula.action.id === actionId &&
				formula.essence.id === essenceId &&
				formula.gesture.id === gestureId
			) {
				return formula;
			}
		}
	}

	return null;
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

function createSpellTextBlockDraft(
	kind: SpellTextBlockKind,
	sortOrder: number,
	options: { mechanicBlockId?: string; text?: string } = {}
): SpellTextBlock {
	return {
		id: crypto.randomUUID(),
		kind,
		text: options.text ?? '',
		mechanicBlockId: options.mechanicBlockId ?? '',
		isActive: true,
		sortOrder
	};
}

function createMechanicBlockConfig(
	mechanic: SpellMechanic
): SpellMechanicBlockConfig {
	const effectScaleAction = mechanic.actions.find(
		action => action.kind === 'effectScale'
	);
	const defaultApplication = normalizeApplicationConfig(
		readDefaultApplicationConfig(mechanic.configSchema)
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

function defaultParameterValue(
	parameter: SpellMechanicParameter,
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

function normalizeLooseAutoParameterValue(
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

function autoParameterRuntimeConfig(value: SpellAutoParameterValue) {
	const scale = autoRuntimeScaleConfig(value.scale);
	const character = autoRuntimeCharacterConfig(value.character);

	return {
		base: scale.base,
		powerMultiplier: scale.powerMultiplier * character.powerMultiplier,
		limitMax:
			character.limitMax === null ? null : scale.base + character.limitMax
	};
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

function applyAutoRuntimeCurve(
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

function autoEffectiveRuntimeSourceValue(
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

function applyRuntimeRounding(
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

function meterGenitiveWord(value: number) {
	const absolute = Math.abs(Math.trunc(value));

	if (absolute === 1) {
		return 'метра';
	}

	return 'метров';
}

function isUnderstandingSkill(skill: Skill) {
	return skill.name.toLocaleLowerCase('ru').includes('понимание');
}

function normalizeParameterValues(
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

function parameterStorageKey(parameter: SpellMechanicParameter) {
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

function readSpellEffectScaleConfig(value: unknown): SpellEffectScaleConfig {
	const config = toRecord(value);
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
		mechanicBlocks: readNestedSpellMechanicBlocks(item['mechanicBlocks'])
	}));
}

function readNestedSpellMechanicBlocks(
	value: unknown
): SpellMechanicBlockDraft[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isRecord).map((item, index) => ({
		id:
			typeof item['id'] === 'string' && item['id']
				? item['id']
				: crypto.randomUUID(),
		mechanicId:
			typeof item['mechanicId'] === 'string' ? item['mechanicId'] : '',
		parameterValues: isRecord(item['parameterValues'])
			? normalizeParameterValues(item['parameterValues'], [])
			: {},
		config: isRecord(item['config']) ? item['config'] : {},
		isActive: typeof item['isActive'] === 'boolean' ? item['isActive'] : true,
		sortOrder:
			typeof item['sortOrder'] === 'number' &&
			Number.isFinite(item['sortOrder'])
				? item['sortOrder']
				: index
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

function toRecord(value: unknown): Record<string, unknown> {
	return isRecord(value) ? value : {};
}

function createSkillOptionGroups(
	categories: SkillCategory[],
	skills: Skill[]
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

function createSingleOptionGroup(
	label: string,
	items: SelectOption[]
): SelectOptionGroup[] {
	return items.length ? [{ label, items }] : [];
}

function createSingleCommandOptionGroup(
	label: string,
	items: CommandSelectOption[]
): CommandSelectOptionGroup[] {
	return items.length ? [{ label, items }] : [];
}

function toSelectOption(item: { id: string; name: string }) {
	return {
		id: item.id,
		name: item.name,
		searchText: item.name.toLowerCase()
	};
}

function compareByOrderAndName<T extends { sortOrder?: number; name: string }>(
	first: T,
	second: T
) {
	const orderDiff = (first.sortOrder ?? 0) - (second.sortOrder ?? 0);
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}

function compareBySectionAndName(
	first: Pick<SystemValue, 'displaySection' | 'name'>,
	second: Pick<SystemValue, 'displaySection' | 'name'>
) {
	return (
		first.displaySection.localeCompare(second.displaySection, 'ru') ||
		first.name.localeCompare(second.name, 'ru')
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSpellMechanicBlockDraft(
	value: unknown
): value is SpellMechanicBlockDraft {
	return (
		isRecord(value) &&
		typeof value['id'] === 'string' &&
		typeof value['mechanicId'] === 'string' &&
		isRecord(value['parameterValues']) &&
		isRecord(value['config']) &&
		typeof value['isActive'] === 'boolean' &&
		typeof value['sortOrder'] === 'number'
	);
}

function flattenRuntimeTrace(
	trace: SpellRuntimeTraceEntry[],
	depth = 0
): RuntimeTraceRow[] {
	return trace.flatMap(entry => [
		{ ...entry, depth },
		...flattenRuntimeTrace(entry.children, depth + 1)
	]);
}

function randomD6() {
	return Math.floor(Math.random() * 6) + 1;
}

function countRuntimeSuccesses(
	dice: number[],
	levels: SkillLevel[],
	skillLevel: number
) {
	const rule = levels.find(level => level.level === skillLevel);

	if (!rule?.canRoll || rule.successMin === null) {
		return 0;
	}

	const successMin = rule.successMin;
	const doubleSuccessMin = rule.doubleSuccessMin;

	return dice.reduce((total, die) => {
		const normalSuccess = die >= successMin ? 1 : 0;
		const doubleSuccess =
			doubleSuccessMin !== null && die >= doubleSuccessMin ? 1 : 0;

		return total + normalSuccess + doubleSuccess;
	}, 0);
}
