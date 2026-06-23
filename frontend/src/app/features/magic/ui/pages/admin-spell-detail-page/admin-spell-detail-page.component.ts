import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	computed,
	inject,
	signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { Drawer } from 'primeng/drawer';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Popover } from 'primeng/popover';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Slider } from 'primeng/slider';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { SpellTargetConfigEditorComponent } from '../../../../../shared/ui/spell-target-config-editor/spell-target-config-editor.component';
import { CONDITIONS_REPOSITORY } from '../../../../conditions/data/conditions-repository.port';
import { Condition } from '../../../../conditions/domain/conditions.models';
import { DAMAGE_TYPES_REPOSITORY } from '../../../../damage-types/data/damage-types-repository.port';
import { DamageType } from '../../../../damage-types/domain/damage-types.models';
import { PROGRESSION_PRESETS_REPOSITORY } from '../../../../progression-presets/data/progression-presets-repository.port';
import {
	ProgressionPreset,
	ProgressionPresetRoundingMode
} from '../../../../progression-presets/domain/progression-presets.models';
import { SKILLS_REPOSITORY } from '../../../../skills/data/skills-repository.port';
import { Skill, SkillCategory, SkillLevel } from '../../../../skills/domain/skills.models';
import { VALUES_REPOSITORY } from '../../../../values/data/values-repository.port';
import {
	CHARACTER_INPUT_OVERRIDE_KEY,
	evaluateGraph
} from '../../../../values/domain/value-graph.engine';
import { SystemValue } from '../../../../values/domain/values.models';
import { CHARACTER_SHEET_SANDBOX_REPOSITORY } from '../../../../character-sheet/data/character-sheet-sandbox-repository.port';
import {
	CharacterSheetSandboxDraft
} from '../../../../character-sheet/domain/character-sheet-sandbox.models';
import { SPELL_MECHANICS_REPOSITORY } from '../../../../spell-mechanics/data/spell-mechanics-repository.port';
import { MechanicCalculationGraphEditorComponent } from '../../../../spell-mechanics/ui/components/mechanic-calculation-graph-editor/mechanic-calculation-graph-editor.component';
import { formatMechanicCalculationFormula } from '../../../../spell-mechanics/ui/mechanic-calculation-graph.formula';
import { SpellEffectScaleEditorComponent } from './spell-effect-scale-editor.component';
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
import { MagicWord, MagicWordAreaShape } from '../../../domain/magic-word.models';
import {
	PersistedSpellStatus,
	SPELL_STATUS_OPTIONS,
	Spell,
	SpellCatalog,
	SpellConfig,
	SpellFormulaCandidate,
	SpellMechanicApplicationConfig,
	SpellMechanicBlockConfig,
	SpellEffectScaleConfig,
	SpellEffectScaleItemConfig,
	SpellEffectScaleMode,
	SpellNestedMechanicBlockConfig,
	SpellRuntimePendingChoice,
	SpellRuntimePendingRoll,
	SpellRuntimePreview,
	SpellRuntimeEffect,
	SpellRuntimeTraceEntry,
	SpellTextBlock,
	SpellTextBlockKind,
	SpellTargetConfig,
	canManageSpellActivity,
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
	createDefaultTargetConfigs,
	createTargetConfigDraft,
	createTargetConfigFromMechanicDefault,
	createTargetConfigFromTemplate,
	createTargetPreset,
	createTargetTemplateOptionGroups,
	findTargetPresetTemplate,
	normalizeTargetConfigs,
	targetConfigPreview,
	targetConfigText,
	targetMatchesTemplate,
	targetRuntimeSummary
} from './spell-target-config.utils';
import {
	renderApplicationText,
	renderMechanicTextTemplate
} from './mechanic-text-template-renderer';
import {
	AUTO_VALUE_CHARACTER_OPTIONS,
	AUTO_VALUE_GROWTH_OPTIONS,
	AUTO_VALUE_SCALE_OPTIONS,
	AUTO_VALUE_SOURCE_CURVE_OPTIONS,
	AUTO_VALUE_SOURCE_KIND_OPTIONS,
	AUTO_VALUE_SOURCE_MODE_OPTIONS,
	AUTO_VALUE_SOURCE_TARGET_OPTIONS,
	AutoValueSourceKind,
	AutoValueRangeMode,
	AutoValueSourceMode,
	AutoValueSourceTarget,
	ESSENCE_PROFILE_SOURCE_OPTIONS,
	NumericParameterPreview,
	PROGRESSION_SOURCE_KIND_OPTIONS,
	ProgressionSourceKind,
	ROUNDING_MODE_OPTIONS,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellFormulaParameterValue,
	SpellParameterValue,
	SpellProgressionParameterValue,
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
	isAutoSourceMechanicParameter,
	isFormulaParameterValue,
	isProgressionParameterValue,
	isStaticParameterValue,
	parameterValueText,
	progressionSourceFormulaSourceId,
	roundingLabel,
	roundingMode,
	supportsNumericParameterKind,
	systemValueSourceLabel
} from './spell-numeric-parameter.utils';

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

interface CasterLevelMatrixPreview {
	columns: number[];
	columnRanges: Array<{
		level: number;
		minValue: string;
		maxValue: string;
		label: string;
	}>;
	rows: Array<{
		casterLevel: number;
		values: string[];
	}>;
	minValue: string;
	maxValue: string;
}

interface SpellMechanicBlockDraft {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, SpellParameterValue>;
	config: SpellMechanicBlockConfig;
	isActive: boolean;
	sortOrder: number;
}

interface SerializedSpellMechanicBlock {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, SpellParameterValue>;
	config: SpellMechanicBlockConfig;
	isActive: boolean;
	sortOrder: number;
}

type SpellParameterValueMode = 'static' | 'progression' | 'auto' | 'formula';
type SpellTextPreviewMode = 'game' | 'formula';
interface FormulaParameterSelection {
	blockIndex: number;
	parameterId: string;
}

interface RuntimeRollDraft {
	diceCount: number;
	skillLevel: number;
	dice: number[];
	successes: number | null;
}

interface RuntimeTraceRow extends SpellRuntimeTraceEntry {
	depth: number;
}

interface MechanicReadinessStatus {
	label: string;
	severity: 'success' | 'warn' | 'danger' | 'secondary';
	issues: string[];
}

interface MechanicProblemItem {
	blockIndex: number;
	mechanicName: string;
	issue: string;
}

type SpellTextPreviewPart =
	| { kind: 'paragraph'; text: string }
	| {
			kind: 'effectScale';
			intro: string;
			items: SpellEffectScaleItemConfig[];
	  };

interface SpellDraft {
	id: string | null;
	actionId: string;
	essenceId: string;
	gestureId: string;
	formulaName: string;
	name: string;
	description: string;
	config: SpellConfig;
	status: PersistedSpellStatus;
	isActive: boolean;
	sortOrder: number;
	targetConfigs: SpellTargetConfig[];
	textBlocks: SpellTextBlock[];
	mechanicBlocks: SpellMechanicBlockDraft[];
}

interface SpellAreaDimension {
	key: string;
	label: string;
	defaultValue: number;
	unitLabel: string;
}

type AutoHelpKey =
	| 'character'
	| 'scale'
	| 'startLevel'
	| 'minimum'
	| 'maximum'
	| 'rangeMode'
	| 'sourceMode'
	| 'sourceKind'
	| 'sourceKey'
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

const EFFECT_SCALE_MODE_OPTIONS: Array<{ label: string; value: SpellEffectScaleMode }> = [
	{ label: 'Лучший доступный', value: 'best' },
	{ label: 'Выбор доступного', value: 'choice' },
	{ label: 'Все доступные', value: 'all' },
	{ label: 'Точное совпадение', value: 'exact' }
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
		FormsModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		Dialog,
		Drawer,
		InputNumber,
		InputText,
		Popover,
		Select,
		SelectButton,
		Slider,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Tag,
		Textarea,
		ToggleSwitch,
		EditorActionsBarComponent,
		SpellTargetConfigEditorComponent,
		MechanicCalculationGraphEditorComponent,
		SpellEffectScaleEditorComponent
	],
	templateUrl: './admin-spell-detail-page.component.html',
	styleUrl: './admin-spell-detail-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService]
})
export class AdminSpellDetailPageComponent {
	private readonly repository = inject(MAGIC_WORDS_REPOSITORY);
	private readonly spellMechanicsRepository = inject(SPELL_MECHANICS_REPOSITORY);
	private readonly skillsRepository = inject(SKILLS_REPOSITORY);
	private readonly damageTypesRepository = inject(DAMAGE_TYPES_REPOSITORY);
	private readonly conditionsRepository = inject(CONDITIONS_REPOSITORY);
	private readonly progressionPresetsRepository = inject(PROGRESSION_PRESETS_REPOSITORY);
	private readonly valuesRepository = inject(VALUES_REPOSITORY);
	private readonly characterSheetSandboxRepository = inject(
		CHARACTER_SHEET_SANDBOX_REPOSITORY
	);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly statusOptions = SPELL_STATUS_OPTIONS;
	protected readonly draft = signal<SpellDraft | null>(null);
	protected readonly originalDraft = signal<SpellDraft | null>(null);
	protected readonly spellMechanics = signal<SpellMechanic[]>([]);
	protected readonly magicWords = signal<MagicWord[]>([]);
	protected readonly skills = signal<Skill[]>([]);
	protected readonly skillCategories = signal<SkillCategory[]>([]);
	protected readonly skillLevels = signal<SkillLevel[]>([]);
	protected readonly damageTypes = signal<DamageType[]>([]);
	protected readonly conditions = signal<Condition[]>([]);
	protected readonly progressionPresets = signal<ProgressionPreset[]>([]);
	protected readonly systemValues = signal<SystemValue[]>([]);
	protected readonly sandboxInputValues = signal<Record<string, number>>({});
	protected readonly selectedMechanicBlockIndex = signal<number | null>(null);
	protected readonly selectedTargetConfigIndex = signal<number | null>(null);
	protected readonly selectedFormulaParameter =
		signal<FormulaParameterSelection | null>(null);
	protected readonly activeTab = signal<string | number | undefined>('main');
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly runtimePreviewVisible = signal(false);
	protected readonly runtimePreviewLoading = signal(false);
	protected readonly runtimePreviewError = signal<string | null>(null);
	protected readonly runtimePreview = signal<SpellRuntimePreview | null>(null);
	protected readonly runtimeRollResults = signal<Record<string, number>>({});
	protected readonly runtimeChoiceResults = signal<Record<string, string>>({});
	protected readonly runtimeRollDrafts = signal<Record<string, RuntimeRollDraft>>({});
	protected readonly addMechanicWizardVisible = signal(false);
	protected readonly selectedWizardMechanicId = signal<string | null>(null);
	protected readonly breadcrumbs = computed(() => [
		{ label: 'Правила системы', routerLink: '/admin/rules/spells' },
		{ label: 'Заклинания', routerLink: '/admin/rules/spells' },
		{ label: this.draft()?.name || 'Заклинание' }
	]);
	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
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
		return index === null ? null : (this.draft()?.mechanicBlocks[index] ?? null);
	});
	protected readonly selectedWizardMechanic = computed(() => {
		const mechanicId = this.selectedWizardMechanicId();
		return mechanicId ? this.findMechanic(mechanicId) : null;
	});
	protected readonly selectedTargetConfig = computed(() => {
		const index = this.selectedTargetConfigIndex();
		return index === null ? null : (this.draft()?.targetConfigs[index] ?? null);
	});
	protected readonly selectedGestureAreaShape = computed(() => {
		const gestureId = this.draft()?.gestureId;

		return gestureId
			? (this.magicWords().find(word => word.id === gestureId)?.areaShape ?? null)
			: null;
	});
	protected readonly areaDimensions = computed(() =>
		createAreaDimensions(this.selectedGestureAreaShape())
	);
	protected readonly areaParameterValueModeOptions = PARAMETER_VALUE_MODE_OPTIONS.filter(
		option => option.value === 'static' || option.value === 'auto'
	);
	protected readonly targetSourceOptions = TARGET_SOURCE_OPTIONS;
	protected readonly targetRelationOptions = TARGET_RELATION_OPTIONS;
	protected readonly targetCountModeOptions = TARGET_COUNT_MODE_OPTIONS;
	protected readonly targetCountValueModeOptions = TARGET_COUNT_VALUE_MODE_OPTIONS;
	protected readonly targetTemplateOptions = TARGET_TEMPLATE_OPTIONS;
	protected readonly parameterValueModeOptions = PARAMETER_VALUE_MODE_OPTIONS;
	protected readonly effectScaleModeOptions = EFFECT_SCALE_MODE_OPTIONS;
	protected readonly spellTextBlockKindOptions = SPELL_TEXT_BLOCK_KIND_OPTIONS;
	protected readonly spellTextPreviewModeOptions = SPELL_TEXT_PREVIEW_MODE_OPTIONS;
	protected readonly spellTextPreviewMode = signal<SpellTextPreviewMode>('game');
	protected readonly collapsedAutoSourceKeys = signal<Set<string>>(new Set());
	protected readonly expandedMechanicParameterKeys = signal<Set<string>>(new Set());
	protected readonly expandedCasterLevelMatrixKeys = signal<Set<string>>(new Set());
	protected readonly activeAutoHelpKey = signal<AutoHelpKey>('character');
	protected readonly activeAutoHelp = computed(
		() => this.autoHelpContent[this.activeAutoHelpKey()]
	);
	protected readonly baseCasterLevelPreviewPoints = [0, 1, 3, 5, 8, 10, 15, 20];
	protected readonly progressionSourceKindOptions = PROGRESSION_SOURCE_KIND_OPTIONS;
	protected readonly essenceProfileSourceOptions = ESSENCE_PROFILE_SOURCE_OPTIONS;
	protected readonly roundingModeOptions = ROUNDING_MODE_OPTIONS;
	protected readonly autoValueCharacterOptions = AUTO_VALUE_CHARACTER_OPTIONS;
	protected readonly autoValueScaleOptions = AUTO_VALUE_SCALE_OPTIONS;
	protected readonly autoValueGrowthOptions = AUTO_VALUE_GROWTH_OPTIONS;
	protected readonly autoValueSourceModeOptions = AUTO_VALUE_SOURCE_MODE_OPTIONS;
	protected readonly autoValueSourceKindOptions = AUTO_VALUE_SOURCE_KIND_OPTIONS;
	protected readonly autoValueSourceTargetOptions = AUTO_VALUE_SOURCE_TARGET_OPTIONS;
	protected readonly autoValueSourceCurveOptions = AUTO_VALUE_SOURCE_CURVE_OPTIONS;
	protected readonly autoValueRangeModeOptions = AUTO_VALUE_RANGE_MODE_OPTIONS;
	protected readonly autoHelpContent: Record<AutoHelpKey, AutoHelpContent> = {
		character: {
			title: 'Поведение',
			description: 'Определяет общий характер числа и то, насколько охотно оно растёт от выбранных источников.',
			items: [
				{ term: 'Стабильное', description: 'почти не разгоняется от источников и подходит для предсказуемых значений.' },
				{ term: 'Скалируемое', description: 'растёт ровно и понятно, хороший базовый вариант для большинства параметров.' },
				{ term: 'Стихийное', description: 'лучше подходит для эффектов, где важны свойства выбранной сущности.' },
				{ term: 'Мастерское', description: 'заметнее раскрывается на высоких навыках и хуже ощущается на низких.' },
				{ term: 'Ограниченное', description: 'сильнее держит потолок и не даёт значению слишком быстро разгоняться.' },
				{ term: 'Экстремальное', description: 'даёт высокий потенциал, но требует сильных источников, чтобы раскрыться.' }
			]
		},
		scale: {
			title: 'Размер значения',
			description: 'Задаёт базовый масштаб результата до применения влияний.',
			items: [
				{ term: 'Малый', description: 'для точечных эффектов, небольшого урона, короткой длительности или малого числа целей.' },
				{ term: 'Средний', description: 'для обычных заклинаний, где значение должно расти без резких скачков.' },
				{ term: 'Большой', description: 'для дальности, области или заметных эффектов, которые должны быть ощутимыми.' },
				{ term: 'Огромный', description: 'для параметров, где нужны крупные числа и широкий диапазон роста.' }
			]
		},
		startLevel: {
			title: 'Старт расчёта',
			description: 'Задаёт уровень, с которого источники начинают давать вклад в формулу.',
			items: [
				{ term: '0', description: 'значение считается уже с нулевого уровня.' },
				{ term: '1', description: 'на нулевом уровне параметр остаётся на минимуме, рост начинается с первого уровня.' },
				{ term: 'Выше 1', description: 'позволяет открыть заметный рост только на более сильном навыке.' }
			]
		},
		minimum: {
			title: 'Минимум',
			description: 'Нижняя граница итогового значения и значение, которое используется до старта расчёта.',
			items: [
				{ term: '0', description: 'параметр может быть полностью недоступен или не давать эффекта.' },
				{ term: 'Больше 0', description: 'заклинание всегда сохраняет базовый минимум, даже при слабых источниках.' }
			]
		},
		maximum: {
			title: 'Максимум',
			description: 'Верхняя граница параметра. Используется только если включён режим диапазона.',
			items: [
				{ term: 'Пусто', description: 'верхняя граница не задана, формула работает без масштабирования в диапазон.' },
				{ term: 'Число', description: 'итоговая прогрессия будет уложена между минимумом и этим максимумом.' }
			]
		},
		rangeMode: {
			title: 'Диапазон',
			description: 'Определяет, нужно ли приводить итоговую прогрессию к заданному коридору значений.',
			items: [
				{ term: 'Без диапазона', description: 'формула считается напрямую и ограничивается только своим обычным минимумом.' },
				{ term: 'Масштабировать', description: 'результат растягивается или сжимается так, чтобы уровни укладывались между минимумом и максимумом.' }
			]
		},
		sourceMode: {
			title: 'Режим влияний',
			description: 'Определяет, сколько источников участвует в формуле и насколько подробно они настраиваются.',
			items: [
				{ term: 'Простой', description: 'оставляет одну базовую связь и быстрее настраивается.' },
				{ term: 'Расширенный', description: 'позволяет добавить несколько источников и отдельно задать роль каждого источника.' }
			]
		},
		sourceKind: {
			title: 'Что влияет',
			description: 'Выбирает тип данных, который будет участвовать в расчёте.',
			items: [
				{ term: 'Системное значение', description: 'берёт общий показатель системы, например уровень заклинателя.' },
				{ term: 'Параметр механики', description: 'берёт значение из текущей механики, например выбранный навык атаки.' },
				{ term: 'Профиль сущности', description: 'берёт вес свойства сущности: урон, дальность, область, длительность и т.д.' },
				{ term: 'Ручной x', description: 'даёт быстрый тестовый источник без привязки к справочникам.' }
			]
		},
		sourceKey: {
			title: 'Значение источника',
			description: 'Выбирает конкретное значение внутри выбранного типа источника.',
			items: [
				{ term: 'Для системного значения', description: 'указывает конкретный системный показатель, который будет подставлен в формулу.' },
				{ term: 'Для параметра механики', description: 'указывает параметр текущей механики, значение которого станет источником расчёта.' },
				{ term: 'Для профиля сущности', description: 'указывает, какое свойство сущности будет влиять на итог.' }
			]
		},
		sourceTarget: {
			title: 'Влияет на',
			description: 'Определяет место источника в формуле.',
			items: [
				{ term: 'Базовый масштаб', description: 'добавляет вклад к основе значения до основного роста.' },
				{ term: 'Рост', description: 'усиливает прогрессию по уровню навыка или другому основному источнику.' },
				{ term: 'Множитель', description: 'умножает итог после базовых добавок и роста.' },
				{ term: 'Максимум', description: 'задаёт или расширяет верхнюю границу значения.' },
				{ term: 'Бонус сущности', description: 'добавляет вклад сущности до финального умножения.' }
			]
		},
		sourceCurve: {
			title: 'Кривая',
			description: 'Преобразует значение источника перед применением веса.',
			items: [
				{ term: 'Слабая', description: 'даёт мягкий вклад и сдерживает рост.' },
				{ term: 'Плавная', description: 'растёт ровно и предсказуемо.' },
				{ term: 'Быстрая', description: 'сильнее раскрывается на ранних значениях.' },
				{ term: 'Насыщение', description: 'быстро растёт в начале и постепенно замедляется.' },
				{ term: 'Взрывная', description: 'заметнее награждает высокие значения источника.' }
			]
		},
		sourceWeight: {
			title: 'Вес',
			description: 'Задаёт силу выбранной строки влияния.',
			items: [
				{ term: '0', description: 'отключает вклад, но оставляет строку в настройке.' },
				{ term: '0.5', description: 'использует половину вклада источника.' },
				{ term: '1', description: 'использует источник как есть.' },
				{ term: 'Больше 1', description: 'усиливает вклад источника.' }
			]
		},
		rounding: {
			title: 'Округление',
			description: 'Определяет, как дробный результат формулы превращается в игровое целое число.',
			items: [
				{ term: 'Округлить вниз', description: 'всегда берёт меньшее целое значение.' },
				{ term: 'Округлить', description: 'берёт ближайшее целое значение.' },
				{ term: 'Округлить вверх', description: 'всегда берёт большее целое значение.' }
			]
		}
	};
	protected readonly effectScaleMechanicParameters = (
		block: SpellNestedMechanicBlockConfig
	) => this.mechanicBlockParameters(block as SpellMechanicBlockDraft);
	protected readonly effectScaleUsesParameterSelect = (
		kind: SpellMechanicParameterKind
	) => this.usesParameterSelect(kind);
	protected readonly effectScaleParameterOptions = (
		parameter: SpellMechanicParameter
	) => this.parameterOptions(parameter);
	protected readonly effectScaleParameterValue = (
		block: SpellNestedMechanicBlockConfig,
		parameterId: string
	) => this.parameterValue(block as SpellMechanicBlockDraft, parameterId);
	protected readonly effectScaleStaticParameterValue = (
		block: SpellNestedMechanicBlockConfig,
		parameterId: string
	) => this.staticParameterValue(block as SpellMechanicBlockDraft, parameterId);
	protected readonly autoPresetPanelStyle = {
		width: '12rem',
		maxWidth: '12rem',
		overflowX: 'hidden'
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
			.flatMap(block => this.renderSpellTextBlockParts(block, this.spellTextPreviewMode()))
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
			.map(block => this.renderSpellTextBlock(block, this.spellTextPreviewMode()))
			.filter(text => text.trim().length)
			.join('\n\n');

		if (this.spellTextPreviewMode() !== 'game') {
			return text;
		}

		const unavailableReason = this.spellCastingUnavailableReason();

		return unavailableReason ? `${unavailableReason}\n\n${text}`.trim() : text;
	});
	protected readonly formulaSourceGroups = computed<MechanicCalculationSourceGroup[]>(
		() => {
			const selection = this.selectedFormulaParameter();
			const block = selection
				? (this.draft()?.mechanicBlocks[selection.blockIndex] ?? null)
				: null;

			return this.formulaSourceGroupsForBlock(block);
		}
	);
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

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftDescription(description: string) {
		this.patchDraft({ description });
	}

	protected updateDraftStatus(status: PersistedSpellStatus) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						status,
						isActive:
							status === 'DRAFT'
								? false
								: draft.status === 'DRAFT'
									? true
									: draft.isActive
					}
				: draft
		);
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected areaParameterValue(dimensionKey: string) {
		const value = this.draft()?.config.area?.dimensions[dimensionKey];
		return isSpellParameterValue(value) ? value : createStaticParameterValue('0');
	}

	protected areaParameterValueMode(dimensionKey: string): SpellParameterValueMode {
		const value = this.areaParameterValue(dimensionKey);

		if (isAutoParameterValue(value)) {
			return 'auto';
		}

		return 'static';
	}

	protected areaStaticParameterValue(dimensionKey: string) {
		return parameterValueText(this.areaParameterValue(dimensionKey));
	}

	protected updateAreaParameterMode(
		dimension: SpellAreaDimension,
		mode: SpellParameterValueMode
	) {
		const current = this.areaParameterValue(dimension.key);
		const nextValue =
			mode === 'auto'
				? this.createAreaAutoParameterValue(dimension)
				: createStaticParameterValue(parameterValueText(current));

		this.updateAreaParameterValue(dimension.key, nextValue);
	}

	protected updateAreaStaticParameterValue(dimensionKey: string, value: string) {
		this.updateAreaParameterValue(dimensionKey, createStaticParameterValue(value));
	}

	protected areaAutoParameterValue(dimensionKey: string): SpellAutoParameterValue | null {
		const value = this.areaParameterValue(dimensionKey);
		return isAutoParameterValue(value) ? value : null;
	}

	protected updateAreaAutoParameter(
		dimensionKey: string,
		patch: Partial<SpellAutoParameterValue>
	) {
		const current = this.areaAutoParameterValue(dimensionKey);

		if (!current) {
			return;
		}

		this.updateAreaParameterValue(dimensionKey, {
			...current,
			...patch
		});
	}

	protected updateAreaAutoSourceMode(
		dimensionKey: string,
		sourceMode: AutoValueSourceMode
	) {
		const current = this.areaAutoParameterValue(dimensionKey);

		if (!current) {
			return;
		}

		this.updateAreaAutoParameter(dimensionKey, {
			sourceMode,
			sources: createAutoSourcesForMode(sourceMode, current.sources)
		});
	}

	protected addAreaAutoSource(dimensionKey: string) {
		const current = this.areaAutoParameterValue(dimensionKey);

		if (!current) {
			return;
		}

		this.updateAreaAutoParameter(dimensionKey, {
			sources: [...current.sources, createAutoParameterSource()]
		});
	}

	protected updateAreaAutoSource(
		dimensionKey: string,
		sourceId: string,
		patch: Partial<SpellAutoParameterSource>
	) {
		const current = this.areaAutoParameterValue(dimensionKey);

		if (!current) {
			return;
		}

		this.updateAreaAutoParameter(dimensionKey, {
			sources: current.sources.map(source =>
				source.id === sourceId ? { ...source, ...patch } : source
			)
		});
	}

	protected deleteAreaAutoSource(dimensionKey: string, sourceId: string) {
		const current = this.areaAutoParameterValue(dimensionKey);

		if (!current || current.sources.length <= 1) {
			return;
		}

		this.updateAreaAutoParameter(dimensionKey, {
			sources: current.sources.filter(source => source.id !== sourceId)
		});
	}

	protected areaAutoSourceKeyOptions(source: SpellAutoParameterSource) {
		switch (source.sourceKind) {
			case 'mechanicParameter':
				return this.areaMechanicParameterSourceOptions();
			case 'systemValue':
				return this.systemValues()
					.slice()
					.sort(compareBySectionAndName)
					.map(value => ({
						label: systemValueSourceLabel(value),
						value: value.id
					}));
			case 'essenceProfile':
				return ESSENCE_PROFILE_SOURCE_OPTIONS;
			case 'manual':
				return [];
		}
	}

	protected areaAutoSourceKeyOptionGroups(
		source: SpellAutoParameterSource
	): CommandSelectOptionGroup[] {
		switch (source.sourceKind) {
			case 'mechanicParameter':
				return this.areaMechanicParameterSourceOptionGroups();
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

	protected defaultAreaAutoSourceKey(sourceKind: AutoValueSourceKind) {
		switch (sourceKind) {
			case 'mechanicParameter':
				return this.areaMechanicParameterSourceOptions()[0]?.value ?? '';
			case 'systemValue':
				return (
					this.systemValues().find(value => value.name === 'Уровень Заклинателя')?.id ??
					this.systemValues().slice().sort(compareBySectionAndName)[0]?.id ??
					''
				);
			case 'essenceProfile':
				return 'area';
			case 'manual':
				return '';
		}
	}

	protected areaNumericPreview(dimensionKey: string): NumericParameterPreview {
		const value = this.areaParameterValue(dimensionKey);
		const sourceNames = this.areaSourceNames();

		if (isAutoParameterValue(value)) {
			return {
				formula: autoParameterFormulaLabel(value, sourceNames),
				sources: autoParameterSourceLabels(value, sourceNames),
				rounding: roundingLabel(value.roundingMode),
				values: this.progressionPreviewSteps().map(x => ({
					x,
					value: formatPreviewNumber(
						evaluateAutoParameterValue(value, x, {
							scaleMaxX: this.maxActiveSkillLevel()
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
			values: this.progressionPreviewSteps().map(x => ({
				x,
				value: staticValue || '0'
			}))
		};
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
				createSpellTextBlockDraft('mechanicText', draft.textBlocks.length + index, {
					mechanicBlockId: block.id
				})
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
		this.activeTab.set(value);
	}

	protected addTargetConfig() {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			targetConfigs: [
				...draft.targetConfigs,
				createTargetConfigDraft(draft.targetConfigs.length)
			]
		});
		this.selectedTargetConfigIndex.set(draft.targetConfigs.length);
	}

	protected selectTargetConfig(index: number) {
		this.selectedTargetConfigIndex.set(index);
	}

	protected updateSelectedTargetConfig(patch: Partial<SpellTargetConfig>) {
		const index = this.selectedTargetConfigIndex();
		const draft = this.draft();

		if (index === null || !draft?.targetConfigs[index]) {
			return;
		}

		this.patchDraft({
			targetConfigs: draft.targetConfigs.map((target, targetIndex) =>
				targetIndex === index ? { ...target, ...patch } : target
			)
		});
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
		const blockIndex = draft?.mechanicBlocks.findIndex(item => item.id === block.id);

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
		return this.draft()?.targetConfigs.find(target => target.id === targetId) ?? null;
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
		return this
			.mechanicBlockParameters(block)
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

	protected deleteSelectedTargetConfig() {
		const index = this.selectedTargetConfigIndex();

		if (index !== null) {
			this.deleteTargetConfig(index);
		}
	}

	protected deleteTargetConfig(index: number) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			targetConfigs: draft.targetConfigs
				.filter((_, targetIndex) => targetIndex !== index)
				.map((target, targetIndex) => ({ ...target, sortOrder: targetIndex }))
		});
		const nextLength = draft.targetConfigs.length - 1;
		this.selectedTargetConfigIndex.set(
			nextLength > 0 ? Math.min(index, nextLength - 1) : null
		);
	}

	protected updateSpellTextPreviewMode(mode: SpellTextPreviewMode) {
		this.spellTextPreviewMode.set(mode);
	}

	protected moveTargetConfig(index: number, direction: -1 | 1) {
		const draft = this.draft();
		const nextIndex = index + direction;

		if (!draft || nextIndex < 0 || nextIndex >= draft.targetConfigs.length) {
			return;
		}

		const targets = [...draft.targetConfigs];
		const current = targets[index];
		const next = targets[nextIndex];

		if (!current || !next) {
			return;
		}

		targets[index] = next;
		targets[nextIndex] = current;
		this.patchDraft({
			targetConfigs: targets.map((target, targetIndex) => ({
				...target,
				sortOrder: targetIndex
			}))
		});
		this.selectedTargetConfigIndex.set(nextIndex);
	}

	protected isFirstTargetConfig(index: number) {
		return index === 0;
	}

	protected isLastTargetConfig(index: number) {
		return index === (this.draft()?.targetConfigs.length ?? 0) - 1;
	}

	protected targetConfigPreview(target: SpellTargetConfig) {
		return targetConfigPreview(target);
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

	protected addMechanicBlock() {
		const mechanic = this.spellMechanics()
			.filter(item => item.isActive)
			.sort(compareByOrderAndName)[0];

		this.selectedWizardMechanicId.set(mechanic?.id ?? null);
		this.addMechanicWizardVisible.set(true);
	}

	protected setAddMechanicWizardVisible(visible: boolean) {
		this.addMechanicWizardVisible.set(visible);
	}

	protected updateWizardMechanic(mechanicId: string | null) {
		this.selectedWizardMechanicId.set(mechanicId);
	}

	protected confirmAddMechanicBlock() {
		const mechanic = this.spellMechanics()
			.find(item => item.id === this.selectedWizardMechanicId());

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
					mechanicBlockId: patch.mechanicBlocks[draft.mechanicBlocks.length]?.id ?? ''
				})
			]
		});
		this.selectedMechanicBlockIndex.set(draft.mechanicBlocks.length);
		this.addMechanicWizardVisible.set(false);
	}

	protected selectMechanicBlock(index: number) {
		this.selectedMechanicBlockIndex.set(index);
	}

	protected selectMechanicProblem(problem: MechanicProblemItem) {
		this.activeTab.set('mechanics');
		this.selectedMechanicBlockIndex.set(problem.blockIndex);
	}

	protected updateMechanicBlockMechanic(index: number, mechanicId: string) {
		const mechanic = this.findMechanic(mechanicId);

		if (!mechanic) {
			return;
		}

		const draft = this.draft();
		const existingBlock = draft?.mechanicBlocks[index];

		if (!draft || !existingBlock) {
			return;
		}

		this.patchDraft(
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
		this.selectedMechanicBlockIndex.set(index);
	}

	protected updateMechanicBlockActive(index: number, isActive: boolean) {
		const block = this.draft()?.mechanicBlocks[index];

		if (block) {
			this.updateMechanicBlock(index, { ...block, isActive });
		}
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
		const currentValue = block ? this.rawParameterValue(block, parameterId) : undefined;
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

	protected updateSelectedMechanicBlockMechanic(mechanicId: string) {
		const index = this.selectedMechanicBlockIndex();

		if (index !== null) {
			this.updateMechanicBlockMechanic(index, mechanicId);
		}
	}

	protected updateSelectedMechanicBlockActive(isActive: boolean) {
		const index = this.selectedMechanicBlockIndex();

		if (index !== null) {
			this.updateMechanicBlockActive(index, isActive);
		}
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

	protected updateSelectedStaticParameterValue(parameterId: string, value: string) {
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
			this.supportsProgression(parameter) ? createStaticParameterValue(value) : value
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

	protected updateSelectedProgressionPreset(parameterId: string, presetId: string) {
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
		const current = block ? this.progressionParameterValue(block, parameterId) : null;

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
		const current = block ? this.progressionParameterValue(block, parameterId) : null;

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
			this.autoValueSourceKindOptions.find(option => option.value === sourceKind)?.label ??
			'Источник'
		);
	}

	protected autoSourceTargetLabel(target: AutoValueSourceTarget) {
		return (
			this.autoValueSourceTargetOptions.find(option => option.value === target)?.label ??
			'Влияние'
		);
	}

	protected autoSourceCollapseKey(scope: string, source: SpellAutoParameterSource) {
		return `${scope}:${source.id}`;
	}

	protected isAutoSourceCollapsed(scope: string, source: SpellAutoParameterSource) {
		return this.collapsedAutoSourceKeys().has(this.autoSourceCollapseKey(scope, source));
	}

	protected toggleAutoSourceCollapsed(scope: string, source: SpellAutoParameterSource) {
		const key = this.autoSourceCollapseKey(scope, source);
		const next = new Set(this.collapsedAutoSourceKeys());

		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}

		this.collapsedAutoSourceKeys.set(next);
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
		return this.expandedMechanicParameterKeys().has(
			this.mechanicParameterCollapseKey(block, parameter)
		);
	}

	protected toggleMechanicParameterExpanded(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		const key = this.mechanicParameterCollapseKey(block, parameter);
		const next = new Set(this.expandedMechanicParameterKeys());

		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}

		this.expandedMechanicParameterKeys.set(next);
	}

	protected shouldShowAutoSourceKey(source: SpellAutoParameterSource) {
		return source.sourceKind !== 'manual';
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
					this.systemValues().find(value => value.name === 'Уровень Заклинателя')?.id ??
					this.systemValues().slice().sort(compareBySectionAndName)[0]?.id ??
					''
				);
			case 'essenceProfile':
				return 'damage';
			case 'manual':
				return '';
		}
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

	protected canEditAutoSourceTarget(value: SpellAutoParameterValue) {
		return value.sourceMode === 'advanced';
	}

	protected canDeleteAutoSource(value: SpellAutoParameterValue) {
		return value.sourceMode === 'advanced' && value.sources.length > 1;
	}

	protected openProgressionAsFormulaGraphEditor(
		block: SpellMechanicBlockDraft,
		parameterId: string
	) {
		const index = this.selectedMechanicBlockIndex();
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
		this.openFormulaGraphEditor(index, parameterId);
	}

	protected deleteSelectedMechanicBlock() {
		const index = this.selectedMechanicBlockIndex();

		if (index !== null) {
			this.deleteMechanicBlock(index);
		}
	}

	protected deleteMechanicBlock(index: number) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			mechanicBlocks: draft.mechanicBlocks
				.filter((_, blockIndex) => blockIndex !== index)
				.map((block, blockIndex) => ({ ...block, sortOrder: blockIndex })),
			textBlocks: draft.textBlocks
				.filter(block => block.mechanicBlockId !== draft.mechanicBlocks[index]?.id)
				.map((block, blockIndex) => ({ ...block, sortOrder: blockIndex }))
		});
		const nextLength = draft.mechanicBlocks.length - 1;
		this.selectedMechanicBlockIndex.set(
			nextLength > 0 ? Math.min(index, nextLength - 1) : null
		);
	}

	protected moveMechanicBlock(index: number, direction: -1 | 1) {
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
		this.patchDraft({
			mechanicBlocks: blocks.map((block, blockIndex) => ({
				...block,
				sortOrder: blockIndex
			}))
		});
		this.selectedMechanicBlockIndex.set(nextIndex);
	}

	protected isFirstMechanicBlock(index: number) {
		return index === 0;
	}

	protected isLastMechanicBlock(index: number) {
		return index === (this.draft()?.mechanicBlocks.length ?? 0) - 1;
	}

	protected mechanicBlockMechanic(block: SpellMechanicBlockDraft) {
		return this.findMechanic(block.mechanicId);
	}

	protected mechanicBlockParameters(block: SpellMechanicBlockDraft) {
		return this.mechanicBlockMechanic(block)?.parameters ?? [];
	}

	protected isEffectScaleBlock(block: SpellMechanicBlockDraft) {
		return this.mechanicBlockMechanic(block)?.actions.some(
			action => action.kind === 'effectScale'
		) ?? false;
	}

	protected effectScaleConfig(block: SpellMechanicBlockDraft): SpellEffectScaleConfig {
		return readSpellEffectScaleConfig(
			block.config['effectScale']
		);
	}

	protected updateEffectScaleConfig(
		block: SpellMechanicBlockDraft,
		patch: Partial<SpellEffectScaleConfig>
	) {
		const index = this.draft()?.mechanicBlocks.findIndex(item => item.id === block.id);

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

	protected updateEffectScaleItem(
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

	protected addEffectScaleItem(block: SpellMechanicBlockDraft) {
		const config = this.effectScaleConfig(block);
		const maxThreshold = config.items.reduce(
			(max, item) => Math.max(max, item.threshold),
			-1
		);
		const threshold = maxThreshold + 1;

		this.updateEffectScaleConfig(block, {
			items: [
				...config.items,
				{
					id: crypto.randomUUID(),
					requirement: 'successes',
					threshold,
					name: `${threshold}+ успехов`,
					description: '',
					isOpenEnded: true,
					mechanicBlocks: []
				}
			]
		});
	}

	protected deleteEffectScaleItem(block: SpellMechanicBlockDraft, itemId: string) {
		const config = this.effectScaleConfig(block);
		this.updateEffectScaleConfig(block, {
			items: config.items.filter(item => item.id !== itemId)
		});
	}

	protected addEffectScaleNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string
	) {
		const mechanic = this.spellMechanics()
			.filter(item => item.isActive)
			.sort(compareByOrderAndName)[0];

		if (!mechanic) {
			return;
		}

		const config = this.effectScaleConfig(block);
		const item = config.items.find(value => value.id === itemId);

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

	protected updateEffectScaleNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		mechanicId: string
	) {
		const mechanic = this.findMechanic(mechanicId);
		const item = this.effectScaleConfig(block).items.find(value => value.id === itemId);

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

	protected updateEffectScaleNestedParameter(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		parameterId: string,
		value: SpellParameterValue | null
	) {
		const item = this.effectScaleConfig(block).items.find(data => data.id === itemId);

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

	protected deleteEffectScaleNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string
	) {
		const item = this.effectScaleConfig(block).items.find(data => data.id === itemId);

		if (!item) {
			return;
		}

		this.updateEffectScaleItem(block, itemId, {
			mechanicBlocks: item.mechanicBlocks
				.filter(nestedBlock => nestedBlock.id !== nestedBlockId)
				.map((nestedBlock, index) => ({ ...nestedBlock, sortOrder: index }))
		});
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
					? this.gameParameterValueLabel(
							block,
							value.value,
							value.parameter
						)
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

	protected mechanicApplicationText(block: SpellMechanicBlockDraft) {
		return renderApplicationText(this.mechanicApplicationConfig(block));
	}

	protected updateSelectedMechanicApplication(
		patch: Partial<SpellMechanicApplicationConfig>
	) {
		const index = this.selectedMechanicBlockIndex();
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

		return mechanicBlock ? this.mechanicBlockTextPreview(mechanicBlock, mode) : '';
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
		const hasAutomaticItem = config.items.some(item => item.requirement === 'automatic');
		const automaticText = hasAutomaticItem
			? ' Пункт без проверки можно выбрать без броска.'
			: '';

		return `Если цель — объект, совершите проверку навыком ${skill}. По количеству успехов выберите доступный эффект из таблицы.${automaticText}`;
	}

	protected effectScaleRequirementText(item: SpellEffectScaleItemConfig) {
		if (item.requirement === 'automatic') {
			return 'Без проверки';
		}

		return item.isOpenEnded ? `${item.threshold}+ успеха` : `${item.threshold} успех`;
	}

	private effectScaleSkillText(
		block: SpellMechanicBlockDraft,
		mode: SpellTextPreviewMode
	) {
		const mechanic = this.mechanicBlockMechanic(block);
		const parameter = mechanic?.parameters.find(item => item.slug === 'navyk-proverki');
		const value = block.parameterValues['navyk-proverki'];

		if (!parameter) {
			return 'проверки';
		}

		return mode === 'game'
			? this.gameParameterValueLabel(block, value, parameter)
			: this.parameterValueLabel(parameter.kind, value);
	}

	protected spellTextBlockPreview(block: SpellTextBlock) {
		const text = this.renderSpellTextBlock(block, this.spellTextPreviewMode()).trim();
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
			.filter(parameter => !this.isMechanicParameterConfigured(block, parameter))
			.map(parameter => mechanicParameterMissingLabel(parameter));
		const effectScaleIssues = this.isEffectScaleBlock(block)
			? this.effectScaleReadinessIssues(block)
			: [];

		return {
			label: issues.length || effectScaleIssues.length
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
						issues.push(`${item.name}: ${mechanicParameterMissingLabel(parameter)}`);
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

	protected parameterValue(block: SpellMechanicBlockDraft, parameterId: string) {
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
		return isAutoParameterValue(value) ? value : null;
	}

	protected formulaPreview(block: SpellMechanicBlockDraft, parameterId: string) {
		return formatMechanicCalculationFormula(
			this.formulaParameterValue(block, parameterId)?.graph,
			this.formulaSourceNamesForBlock(block)
		);
	}

	protected numericParameterPreview(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	): NumericParameterPreview {
		const value = this.rawParameterValue(block, parameter.id);
		const sourceNames = this.formulaSourceNamesForBlock(block);

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
				values: this.progressionPreviewSteps().map(x => ({
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
				values: this.progressionPreviewSteps().map(x => ({
					x,
					value: formatPreviewNumber(evaluateFormulaGraphPreview(value.graph, x))
				}))
			};
		}

		if (isAutoParameterValue(value)) {
			return {
				formula: autoParameterFormulaLabel(value, sourceNames),
				sources: autoParameterSourceLabels(value, sourceNames),
				rounding: roundingLabel(value.roundingMode),
				values: this.progressionPreviewSteps().map(x => ({
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
			values: this.progressionPreviewSteps().map(x => ({
				x,
				value: staticValue || '0'
			}))
		};
	}

	protected casterLevelMatrixPreview(
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
				values: rawValues.map(item => (item === null ? '—' : formatPreviewNumber(item)))
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

	protected maxPossibleCasterLevel() {
		const maxSkillLevel = this.maxActiveSkillLevel();
		const understandingsCount = this.skills().filter(
			skill => skill.isActive && isUnderstandingSkill(skill)
		).length;

		return maxSkillLevel * understandingsCount;
	}

	protected casterLevelPreviewPoints() {
		const maxCasterLevel = this.maxPossibleCasterLevel();
		const points = this.baseCasterLevelPreviewPoints.filter(
			point => point <= maxCasterLevel
		);

		if (maxCasterLevel > 0 && !points.includes(maxCasterLevel)) {
			points.push(maxCasterLevel);
		}

		return Array.from(new Set(points)).sort((left, right) => left - right);
	}

	private maxActiveSkillLevel() {
		return Math.max(
			0,
			...this.skillLevels()
				.filter(level => level.isActive)
				.map(level => level.level)
		);
	}

	protected casterLevelMatrixKey(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return `${block.id}:${parameterStorageKey(parameter)}:caster-level`;
	}

	protected isCasterLevelMatrixExpanded(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		return this.expandedCasterLevelMatrixKeys().has(
			this.casterLevelMatrixKey(block, parameter)
		);
	}

	protected toggleCasterLevelMatrix(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		const key = this.casterLevelMatrixKey(block, parameter);
		const next = new Set(this.expandedCasterLevelMatrixKeys());

		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}

		this.expandedCasterLevelMatrixKeys.set(next);
	}

	protected formulaSourceGroupsForBlock(
		block: SpellMechanicBlockDraft | null
	): MechanicCalculationSourceGroup[] {
		const mechanic = block ? this.mechanicBlockMechanic(block) : null;
		const parameters = mechanic?.parameters ?? [];
		const mechanicParameterSources = parameters
			.filter(parameter => parameter.kind === 'number' || parameter.kind === 'formula')
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
				id: formulaSourceId('skillParameterLevel', parameterStorageKey(parameter)),
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
		const essenceProfileSources = ESSENCE_PROFILE_SOURCE_OPTIONS.map(option => ({
			id: formulaSourceId('essenceProfile', option.value),
			name: `Профиль сущности: ${option.label}`,
			searchText: `${option.label.toLowerCase()} профиль сущности`
		}));
		const systemValueSources = this.systemValues()
			.slice()
			.sort(compareBySectionAndName)
			.map(value => ({
				id: formulaSourceId('systemValue', value.id),
				name: systemValueSourceLabel(value),
				searchText: `${value.name} ${value.displaySection} значение системы`.toLowerCase()
			}));
		const manualSources = [
			{
				id: formulaSourceId('manual', 'x'),
				name: 'Ручной x',
				searchText: 'ручной x икс'
			}
		];

		return [
			...createSingleOptionGroup('Параметры механики', mechanicParameterSources),
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

	private updateAreaParameterValue(
		dimensionKey: string,
		value: SpellParameterValue
	) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		const area = normalizeSpellAreaConfig(
			draft.config.area,
			this.selectedGestureAreaShape(),
			draft.gestureId
		);

		this.patchDraft({
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
		});
	}

	private areaMechanicParameterSourceOptions() {
		return this.areaMechanicParameterSourceOptionGroups().flatMap(group => group.items);
	}

	private areaMechanicParameterSourceOptionGroups(): CommandSelectOptionGroup[] {
		const draft = this.draft();

		if (!draft) {
			return [];
		}

		return draft.mechanicBlocks.flatMap(block => {
			const mechanic = this.mechanicBlockMechanic(block);

			if (!mechanic) {
				return [];
			}

			const groups = this.mechanicParameterSourceOptionGroups(block).map(group => ({
				label: `${mechanic.name} · ${group.label}`,
				items: group.items.map(item => ({
					label: item.label,
					value: areaMechanicParameterSourceKeyByStorageKey(block, item.value)
				}))
			}));

			return groups.filter(group => group.items.length > 0);
		});
	}

	private areaSourceNames() {
		const mechanicSources = this.areaMechanicParameterSourceOptions().map(
			option =>
				[
					formulaSourceId('mechanicParameter', option.value),
					option.label
				] as const
		);
		const systemSources = this.systemValues().map(
			value =>
				[
					formulaSourceId('systemValue', value.id),
					systemValueSourceLabel(value)
				] as const
		);
		const essenceSources = ESSENCE_PROFILE_SOURCE_OPTIONS.map(
			option =>
				[
					formulaSourceId('essenceProfile', option.value),
					`Профиль сущности: ${option.label}`
				] as const
		);

		return new Map([...mechanicSources, ...systemSources, ...essenceSources]);
	}

	private createAreaAutoParameterValue(
		dimension: SpellAreaDimension
	): SpellAutoParameterValue {
		const value = createAutoParameterValue();
		const systemValueSourceKey = this.defaultAreaAutoSourceKey('systemValue');
		const mechanicParameterSourceKey =
			this.defaultAreaAutoSourceKey('mechanicParameter');

		return {
			...value,
			scale: dimension.key === 'tiles' ? 'large' : value.scale,
			sourceMode: 'advanced',
			sources: [
				createAutoParameterSource({
					sourceKind: 'systemValue',
					sourceKey: systemValueSourceKey,
					target: 'base',
					curve: 'smooth',
					weight: 1
				}),
				createAutoParameterSource({
					sourceKind: 'mechanicParameter',
					sourceKey: mechanicParameterSourceKey,
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

		for (const value of this.systemValues().slice().sort(compareBySectionAndName)) {
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
			value => value.slug === 'uroven-zaklinatelya' || value.name === 'Уровень Заклинателя'
		);
	}

	private matchesSystemValueSource(sourceKey: string, value: SystemValue) {
		return sourceKey === value.id || sourceKey === value.slug;
	}

	private parameterStorageKey(
		block: SpellMechanicBlockDraft,
		parameterIdOrSlug: string
	) {
		const parameter = this
			.mechanicBlockMechanic(block)
			?.parameters.find(
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

	private normalizeBlockConfig(block: SpellMechanicBlockDraft): SpellMechanicBlockConfig {
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
		const value = block ? this.rawParameterValue(block, parameter.id) : undefined;
		const valueLabel =
			value === undefined ? 'Не выбрано' : this.parameterValueLabel(parameter.kind, value);

		if (parameter.kind === 'skill') {
			return `Уровень: ${parameter.name} → ${valueLabel}`;
		}

		if (parameter.kind === 'systemValue') {
			return `Значение: ${parameter.name} → ${valueLabel}`;
		}

		return `Параметр: ${parameter.name} → ${valueLabel}`;
	}

	protected openFormulaGraphEditor(blockIndex: number, parameterId: string) {
		this.selectedFormulaParameter.set({ blockIndex, parameterId });
	}

	protected openSelectedFormulaGraphEditor(parameterId: string) {
		const blockIndex = this.selectedMechanicBlockIndex();

		if (blockIndex !== null) {
			this.openFormulaGraphEditor(blockIndex, parameterId);
		}
	}

	protected closeFormulaGraphEditor() {
		this.selectedFormulaParameter.set(null);
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
			? (this.formulaParameterValue(block, selection?.parameterId ?? '')?.graph ?? null)
			: null;
	}

	protected updateSelectedFormulaGraph(graph: MechanicCalculationGraphState | null) {
		const selection = this.selectedFormulaParameter();
		const block = selection
			? (this.draft()?.mechanicBlocks[selection.blockIndex] ?? null)
			: null;

		if (!selection || !block) {
			return;
		}

		this.updateMechanicBlockParameter(selection.blockIndex, selection.parameterId, {
			mode: 'formula',
			graph
		});
	}

	protected progressionParameterPreset(value: SpellProgressionParameterValue) {
		return this.progressionPresets().find(preset => preset.id === value.presetId) ?? null;
	}

	protected progressionConfigFields(value: SpellProgressionParameterValue) {
		const preset = this.progressionParameterPreset(value);
		return preset ? getConfigFields(preset.kind) : [];
	}

	protected progressionFormulaLabel(value: SpellProgressionParameterValue) {
		const preset = this.progressionParameterPreset(value);

		if (!preset) {
			return 'Пресет не выбран';
		}

		return buildFormulaLabel(preset.kind, value.config);
	}

	protected progressionPreviewValue(value: SpellProgressionParameterValue, x: number) {
		const preset = this.progressionParameterPreset(value);

		if (!preset) {
			return 0;
		}

		return evaluateRoundedProgression(preset.kind, value.config, x);
	}

	protected shouldShowProgressionSourceKey(value: SpellProgressionParameterValue) {
		return value.sourceKind === 'essenceProfile' || value.sourceKind === 'skillLevel';
	}

	protected progressionSourceKeyLabel(value: SpellProgressionParameterValue) {
		return value.sourceKind === 'skillLevel' ? 'Параметр навыка' : 'Профиль';
	}

	protected progressionSourceKeyOptions(
		block: SpellMechanicBlockDraft,
		value: SpellProgressionParameterValue
	) {
		if (value.sourceKind === 'skillLevel') {
			return this
				.mechanicBlockParameters(block)
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

	protected parameterOptions(parameter: SpellMechanicParameter): SelectOptionGroup[] {
		switch (parameter.kind) {
			case 'target':
				return createSingleOptionGroup(
					'Цели заклинания',
					(this.draft()?.targetConfigs ?? [])
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			case 'skill':
				return createSkillOptionGroups(this.skillCategories(), this.skills());
			case 'damageType':
				return createSingleOptionGroup(
					'Типы урона',
					this.damageTypes()
						.filter(item => item.isActive)
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			case 'condition':
				return createSingleOptionGroup(
					'Состояния',
					this.conditions()
						.filter(item => item.isActive)
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			default:
				return [];
		}
	}

	protected usesParameterSelect(kind: SpellMechanicParameterKind) {
		return (
			kind === 'target' ||
			kind === 'skill' ||
			kind === 'damageType' ||
			kind === 'condition'
		);
	}

	protected parameterKindLabel(kind: SpellMechanicParameterKind) {
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

	protected showAutoHelp(event: Event, key: AutoHelpKey, popover: Popover) {
		this.activeAutoHelpKey.set(key);
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
				const originalDraft = this.originalDraft();

				if (!originalDraft) {
					return;
				}

				const nextDraft = cloneDraft(originalDraft);
				this.draft.set(nextDraft);
				this.savedDraftSignature.set(draftSignature(nextDraft));
				this.ensureSelectedIndexes(nextDraft);
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
			this.errorMessage.set('Название заклинания обязательно.');
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
				this.selectedGestureAreaShape(),
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

		this.saving.set(true);
		this.errorMessage.set(null);
		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.setDraftFromSpell(saved);
				this.saving.set(false);

				if (!draft.id) {
					void this.router.navigate(['/admin/rules/spells', saved.id], {
						replaceUrl: true
					});
				}
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось сохранить заклинание.'
				);
				this.saving.set(false);
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

	protected canManageActivity(status: PersistedSpellStatus) {
		return canManageSpellActivity(status);
	}

	protected setRuntimePreviewVisible(visible: boolean) {
		this.runtimePreviewVisible.set(visible);
	}

	protected runRuntimePreview(resetRolls = true) {
		const draft = this.draft();

		if (!draft?.id) {
			this.runtimePreviewError.set('Сначала сохрани заклинание.');
			this.runtimePreviewVisible.set(true);
			return;
		}

		if (this.hasChanges()) {
			this.runtimePreviewError.set('Сохрани изменения перед проверкой выполнения.');
			this.runtimePreviewVisible.set(true);
			return;
		}

		if (resetRolls) {
			this.runtimeRollResults.set({});
			this.runtimeChoiceResults.set({});
			this.runtimeRollDrafts.set({});
		}

		this.runtimePreviewVisible.set(true);
		this.runtimePreviewLoading.set(true);
		this.runtimePreviewError.set(null);
		this.repository
			.executeSpellRuntimePreview(draft.id, {
				inputValues: this.sandboxInputValues(),
				rollResults: this.runtimeRollResults(),
				choiceResults: this.runtimeChoiceResults()
			})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: preview => {
					this.runtimePreview.set(preview);
					this.ensureRuntimeRollDrafts(preview.pendingRolls);
					this.runtimePreviewLoading.set(false);
				},
				error: error => {
					this.runtimePreviewError.set(
						error instanceof Error
							? error.message
							: 'Не удалось выполнить preview заклинания.'
					);
					this.runtimePreviewLoading.set(false);
				}
			});
	}

	protected runtimeRollKey(roll: SpellRuntimePendingRoll) {
		return `${roll.blockId}:${roll.actionId}:${roll.resultName}`;
	}

	protected runtimeChoiceKey(choice: SpellRuntimePendingChoice) {
		return `${choice.blockId}:${choice.actionId}`;
	}

	protected runtimeRollDraft(roll: SpellRuntimePendingRoll): RuntimeRollDraft {
		const key = this.runtimeRollKey(roll);
		const draft = this.runtimeRollDrafts()[key];

		if (draft) {
			return draft;
		}

		return createRuntimeRollDraft(this.defaultRuntimeSkillLevel());
	}

	protected updateRuntimeRollDiceCount(roll: SpellRuntimePendingRoll, diceCount: number | null) {
		this.patchRuntimeRollDraft(roll, {
			diceCount: Math.max(0, Math.floor(diceCount ?? 0)),
			dice: [],
			successes: null
		});
	}

	protected updateRuntimeRollSkillLevel(roll: SpellRuntimePendingRoll, skillLevel: number | null) {
		this.patchRuntimeRollDraft(roll, {
			skillLevel: skillLevel ?? this.defaultRuntimeSkillLevel(),
			dice: [],
			successes: null
		});
	}

	protected rollRuntimePendingRoll(roll: SpellRuntimePendingRoll) {
		const draft = this.runtimeRollDraft(roll);
		const dice = Array.from({ length: draft.diceCount }, () => randomD6());
		const successes = countRuntimeSuccesses(dice, this.skillLevels(), draft.skillLevel);
		const key = this.runtimeRollKey(roll);

		this.runtimeRollDrafts.update(drafts => ({
			...drafts,
			[key]: {
				...draft,
				dice,
				successes
			}
		}));
		this.runtimeRollResults.update(results => ({
			...results,
			[key]: successes,
			[roll.actionId]: successes
		}));
		this.runRuntimePreview(false);
	}

	protected chooseRuntimePendingChoice(
		choice: SpellRuntimePendingChoice,
		optionId: string
	) {
		const key = this.runtimeChoiceKey(choice);
		this.runtimeChoiceResults.update(results => ({
			...results,
			[key]: optionId,
			[choice.actionId]: optionId
		}));
		this.runRuntimePreview(false);
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

	protected runtimePreviewStatusSeverity(status: SpellRuntimePreview['status']) {
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
			const valueName = effect.systemValueName ?? effect.systemValueId ?? 'значение';
			const operation = effect.operation === 'increase' ? '+' : effect.operation === 'decrease' ? '-' : '=';
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

	protected runtimeTraceSeverity(trace: SpellRuntimeTraceEntry) {
		return trace.status === 'pending' ? 'warn' : 'success';
	}

	protected runtimeTraceRows(trace: SpellRuntimeTraceEntry[]) {
		return flattenRuntimeTrace(trace);
	}

	private ensureRuntimeRollDrafts(rolls: SpellRuntimePendingRoll[]) {
		this.runtimeRollDrafts.update(drafts => {
			const nextDrafts = { ...drafts };

			for (const roll of rolls) {
				const key = this.runtimeRollKey(roll);
				nextDrafts[key] ??= createRuntimeRollDraft(this.defaultRuntimeSkillLevel());
			}

			return nextDrafts;
		});
	}

	private patchRuntimeRollDraft(
		roll: SpellRuntimePendingRoll,
		patch: Partial<RuntimeRollDraft>
	) {
		const key = this.runtimeRollKey(roll);
		const current = this.runtimeRollDraft(roll);

		this.runtimeRollDrafts.update(drafts => ({
			...drafts,
			[key]: {
				...current,
				...patch
			}
		}));
	}

	private defaultRuntimeSkillLevel() {
		return (
			this.skillLevels()
				.filter(level => level.isActive && level.canRoll)
				.sort((left, right) => left.level - right.level)[0]?.level ?? 0
		);
	}

	private loadSpell() {
		this.loading.set(true);
		this.errorMessage.set(null);

		forkJoin({
			spells: this.repository.loadSpellCatalog(),
			mechanics: this.spellMechanicsRepository.loadCatalog(),
			words: this.repository.loadCatalog(),
			skills: this.skillsRepository.loadAdminCatalog(),
			damageTypes: this.damageTypesRepository.loadCatalog(),
			conditions: this.conditionsRepository.loadCatalog(),
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
					progressionPresets,
					systemValues,
					sandboxDraft
				}) => {
					this.spellMechanics.set(mechanics.mechanics);
					this.magicWords.set(words.words);
					this.skills.set(skills.skills);
					this.skillCategories.set(skills.categories);
					this.skillLevels.set(skills.levels);
					this.damageTypes.set(damageTypes.damageTypes);
					this.conditions.set(conditions.conditions);
					this.progressionPresets.set(progressionPresets.presets);
					this.systemValues.set(systemValues.values);
					this.initializeSandboxInputValues(sandboxDraft);

					const formula = findFormulaFromRoute(spells, this.route);

					if (!formula) {
						this.errorMessage.set('Заклинание не найдено.');
						this.loading.set(false);
						return;
					}

					this.setDraftFromFormula(formula);
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить заклинание.'
					);
					this.loading.set(false);
				}
			});
	}

	private initializeSandboxInputValues(draft: CharacterSheetSandboxDraft) {
		this.sandboxInputValues.set({
			...this.createDefaultSandboxInputValues(),
			...draft.inputValues
		});
	}

	private createDefaultSandboxInputValues() {
		const values: Record<string, number> = {};

		for (const skill of this.skills()) {
			values[skill.systemValue.id] = skill.defaultLevel;
		}

		for (const value of this.systemValues()) {
			values[value.id] = value.baseValue;
		}

		return values;
	}

	private setDraftFromFormula(formula: SpellFormulaCandidate) {
		if (formula.spell) {
			this.setDraftFromSpell(formula.spell);
			return;
		}

		const draft: SpellDraft = {
			id: null,
			actionId: formula.action.id,
			essenceId: formula.essence.id,
			gestureId: formula.gesture.id,
			formulaName: `${formula.action.name} + ${formula.essence.name} + ${formula.gesture.name}`,
			name: `${formula.action.name} ${formula.essence.name}: ${formula.gesture.name}`,
			description: '',
			config: normalizeSpellConfig(
				{},
				this.findAreaShapeByGestureId(formula.gesture.id),
				formula.gesture.id
			),
			status: 'DRAFT',
			isActive: false,
			sortOrder: 0,
			targetConfigs: createDefaultTargetConfigs(),
			textBlocks: [],
			mechanicBlocks: []
		};

		this.setDraftSnapshot(draft);
	}

	private setDraftFromSpell(spell: Spell) {
		const draft: SpellDraft = {
			id: spell.id,
			actionId: spell.actionId,
			essenceId: spell.essenceId,
			gestureId: spell.gestureId,
			formulaName: spell.formulaName,
			name: spell.name,
			description: spell.description,
			config: normalizeSpellConfig(
				spell.config,
				this.findAreaShapeByGestureId(spell.gestureId),
				spell.gestureId
			),
			status: spell.status,
			isActive: spell.isActive,
			sortOrder: spell.sortOrder,
			targetConfigs: normalizeTargetConfigs(spell.targetConfigs),
			textBlocks: normalizeSpellTextBlocks(spell.textBlocks),
			mechanicBlocks: spell.mechanicBlocks
				.sort((first, second) => first.sortOrder - second.sortOrder)
				.map(block => ({
					id: block.id,
					mechanicId: block.mechanicId,
					parameterValues: normalizeParameterValues(
						block.parameterValues,
						this.findMechanic(block.mechanicId)?.parameters ?? []
					),
					config: isRecord(block.config) ? block.config : {},
					isActive: block.isActive,
					sortOrder: block.sortOrder
				}))
		};

		this.setDraftSnapshot(draft);
	}

	private setDraftSnapshot(draft: SpellDraft) {
		const nextDraft = cloneDraft(draft);

		this.draft.set(nextDraft);
		this.originalDraft.set(cloneDraft(nextDraft));
		this.savedDraftSignature.set(draftSignature(nextDraft));
		this.ensureSelectedIndexes(nextDraft);
	}

	private ensureSelectedIndexes(draft: SpellDraft) {
		this.selectedTargetConfigIndex.set(
			draft.targetConfigs.length
				? Math.min(this.selectedTargetConfigIndex() ?? 0, draft.targetConfigs.length - 1)
				: null
		);
		this.selectedMechanicBlockIndex.set(
			draft.mechanicBlocks.length
				? Math.min(
						this.selectedMechanicBlockIndex() ?? 0,
						draft.mechanicBlocks.length - 1
					)
				: null
		);
	}

	private patchDraft(patch: Partial<SpellDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
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

	private updateMechanicBlock(
		index: number,
		block: SpellMechanicBlockDraft
	) {
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
		return this.spellMechanics().find(mechanic => mechanic.id === mechanicId) ?? null;
	}

	private findAreaShapeByGestureId(gestureId: string) {
		return this.magicWords().find(word => word.id === gestureId)?.areaShape ?? null;
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
			this.magicWords().find(word => word.id === essenceId && word.type === 'ESSENCE') ??
			null
		);
	}

	private parameterValueLabel(
		kind: SpellMechanicParameterKind,
		value: unknown
	): string {
		if (isProgressionParameterValue(value)) {
			const preset = this.progressionPresets().find(item => item.id === value.presetId);
			return preset ? `Прогрессия: ${preset.name}` : 'Прогрессия';
		}

		if (isFormulaParameterValue(value)) {
			return formatMechanicCalculationFormula(value.graph, this.formulaSourceNames());
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
					) ??
						createTargetPreset('Цель', 'selected', 'any', 'one')
				);
			case 'damageType':
				return this.damageTypes().find(item => item.id === value)?.name ?? value;
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
			groups[source.target] +=
				applyAutoRuntimeCurve(
					source.curve,
					autoEffectiveRuntimeSourceValue(source, sourceValue, value.startLevel)
				) * source.weight;
		}

		const base = config.base + groups.base;
		const power = groups.growth * config.powerMultiplier;
		const multiplied = (base + power + groups.essenceBonus) * (1 + groups.multiplier);
		const limitBase =
			config.limitMax === null && this.hasAutoMaximumSource(value)
				? config.base
				: config.limitMax;
		const limit = limitBase === null ? null : limitBase + groups.maximum;
		const limited = limit === null ? multiplied : Math.min(multiplied, limit);
		const raw = Math.max(value.minimum, limited);
		const ranged = this.applyAutoRuntimeRange(block, value, raw);

		return applyRuntimeRounding(ranged, value.roundingMode);
	}

	private applyAutoRuntimeRange(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue,
		raw: number
	) {
		if (value.rangeMode !== 'scale' || value.maximum === null || value.maximum <= value.minimum) {
			return raw;
		}

		const minRaw = this.evaluateAutoRuntimeRawValue(block, value, value.startLevel);
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
			groups[source.target] +=
				applyAutoRuntimeCurve(
					source.curve,
					autoEffectiveRuntimeSourceValue(source, sourceValue, value.startLevel)
				) * source.weight;
		}

		const base = config.base + groups.base;
		const power = groups.growth * config.powerMultiplier;
		const multiplied = (base + power + groups.essenceBonus) * (1 + groups.multiplier);
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
			item => item.id === systemValueIdOrSlug || item.slug === systemValueIdOrSlug
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
		this.saving.set(true);
		this.errorMessage.set(null);
		this.repository
			.deleteSpell(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.saving.set(false);
					void this.router.navigate(['/admin/rules/spells']);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось удалить заклинание.'
					);
					this.saving.set(false);
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

function createMechanicBlockConfig(mechanic: SpellMechanic): SpellMechanicBlockConfig {
	const effectScaleAction = mechanic.actions.find(action => action.kind === 'effectScale');
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
		.filter(parameter => parameter.kind === 'target' && parameter.defaultTargetConfig)
		.map((parameter, index) => ({
			parameterId: parameter.id,
			target: createTargetConfigFromMechanicDefault(
				parameter.defaultTargetConfig as NonNullable<typeof parameter.defaultTargetConfig>,
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
			parameter.defaultValue.mode === 'static' ? parameter.defaultValue.value : ''
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
		sourceKey: typeof source['sourceKey'] === 'string' ? source['sourceKey'] : '',
		target: readAutoSourceTarget(source['target']),
		weight: typeof source['weight'] === 'number' ? source['weight'] : 1,
		curve: readAutoSourceCurve(source['curve'])
	};
}

function readFiniteNumber(value: unknown, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readAutoCharacter(value: unknown): SpellAutoParameterValue['character'] {
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
	return value === 'small' || value === 'medium' || value === 'large' || value === 'huge'
		? value
		: 'medium';
}

function readAutoRangeMode(value: unknown): SpellAutoParameterValue['rangeMode'] {
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

function readAutoSourceKind(value: unknown): SpellAutoParameterSource['sourceKind'] {
	return value === 'mechanicParameter' ||
		value === 'systemValue' ||
		value === 'essenceProfile' ||
		value === 'manual'
		? value
		: 'manual';
}

function readAutoSourceTarget(value: unknown): SpellAutoParameterSource['target'] {
	return value === 'growth' ||
		value === 'multiplier' ||
		value === 'base' ||
		value === 'maximum' ||
		value === 'essenceBonus'
		? value
		: 'growth';
}

function readAutoSourceCurve(value: unknown): SpellAutoParameterSource['curve'] {
	return value === 'weak' ||
		value === 'smooth' ||
		value === 'fast' ||
		value === 'saturation' ||
		value === 'explosive'
		? value
		: 'smooth';
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

function readEssenceProfileKey(value: unknown): SpellAutoParameterValue['essenceProfileKey'] {
	return value === 'damage' ||
		value === 'range' ||
		value === 'control' ||
		value === 'duration' ||
		value === 'area' ||
		value === 'stability'
		? value
		: 'damage';
}

function readRoundingMode(value: unknown): SpellAutoParameterValue['roundingMode'] {
	return value === 'floor' || value === 'round' || value === 'ceil' ? value : 'round';
}

function autoParameterRuntimeConfig(value: SpellAutoParameterValue) {
	const scale = autoRuntimeScaleConfig(value.scale);
	const character = autoRuntimeCharacterConfig(value.character);

	return {
		base: scale.base,
		powerMultiplier: scale.powerMultiplier * character.powerMultiplier,
		limitMax: character.limitMax === null ? null : scale.base + character.limitMax
	};
}

function autoRuntimeScaleConfig(scale: SpellAutoParameterValue['scale']) {
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

function autoRuntimeCharacterConfig(character: SpellAutoParameterValue['character']) {
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
	startLevel: number
) {
	return source.sourceKind === 'essenceProfile' ? value : Math.max(0, value - startLevel);
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

function normalizeSpellConfig(
	config: SpellConfig | Record<string, unknown>,
	areaShape: MagicWordAreaShape | null,
	gestureId: string
): SpellConfig {
	const currentArea =
		isRecord(config) && isRecord(config['area'])
			? config['area']
			: undefined;

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

function readSpellEffectScaleItems(value: unknown): SpellEffectScaleItemConfig[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isRecord).map((item, index) => ({
		id: typeof item['id'] === 'string' && item['id'] ? item['id'] : crypto.randomUUID(),
		requirement:
			item['requirement'] === 'automatic' || item['requirement'] === 'successes'
				? item['requirement']
				: 'successes',
		threshold:
			typeof item['threshold'] === 'number' && Number.isFinite(item['threshold'])
				? item['threshold']
				: index,
		name:
			typeof item['name'] === 'string' && item['name'].trim()
				? item['name']
				: `${index} успехов`,
		description: typeof item['description'] === 'string' ? item['description'] : '',
		isOpenEnded: item['isOpenEnded'] === true,
		mechanicBlocks: readNestedSpellMechanicBlocks(item['mechanicBlocks'])
	}));
}

function readNestedSpellMechanicBlocks(value: unknown): SpellMechanicBlockDraft[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isRecord).map((item, index) => ({
		id: typeof item['id'] === 'string' && item['id'] ? item['id'] : crypto.randomUUID(),
		mechanicId: typeof item['mechanicId'] === 'string' ? item['mechanicId'] : '',
		parameterValues: isRecord(item['parameterValues'])
			? normalizeParameterValues(item['parameterValues'], [])
			: {},
		config: isRecord(item['config']) ? item['config'] : {},
		isActive: typeof item['isActive'] === 'boolean' ? item['isActive'] : true,
		sortOrder:
			typeof item['sortOrder'] === 'number' && Number.isFinite(item['sortOrder'])
				? item['sortOrder']
				: index
	}));
}

function isEffectScaleMode(value: unknown): value is SpellEffectScaleMode {
	return value === 'best' || value === 'choice' || value === 'all' || value === 'exact';
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

function areaMechanicParameterSourceKeyByStorageKey(
	block: SpellMechanicBlockDraft,
	parameterStorageKeyValue: string
) {
	return `${block.id}:${parameterStorageKeyValue}`;
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

function createRuntimeRollDraft(skillLevel: number): RuntimeRollDraft {
	return {
		diceCount: 6,
		skillLevel,
		dice: [],
		successes: null
	};
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

function draftSignature(draft: SpellDraft | null): string {
	return JSON.stringify(draft ?? null);
}

function cloneDraft(draft: SpellDraft): SpellDraft {
	return JSON.parse(JSON.stringify(draft)) as SpellDraft;
}
