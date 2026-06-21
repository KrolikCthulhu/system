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
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
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
import { SystemValue } from '../../../../values/domain/values.models';
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
import { renderMechanicTextTemplate } from './mechanic-text-template-renderer';
import {
	AUTO_VALUE_CHARACTER_OPTIONS,
	AUTO_VALUE_ESSENCE_INFLUENCE_OPTIONS,
	AUTO_VALUE_GROWTH_OPTIONS,
	AUTO_VALUE_SCALE_OPTIONS,
	AUTO_VALUE_SOURCE_CURVE_OPTIONS,
	AUTO_VALUE_SOURCE_KIND_OPTIONS,
	AUTO_VALUE_SOURCE_MODE_OPTIONS,
	AUTO_VALUE_SOURCE_TARGET_OPTIONS,
	AutoValueSourceKind,
	AutoValueSourceMode,
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
		Select,
		SelectButton,
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
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly statusOptions = SPELL_STATUS_OPTIONS;
	protected readonly draft = signal<SpellDraft | null>(null);
	protected readonly spellMechanics = signal<SpellMechanic[]>([]);
	protected readonly magicWords = signal<MagicWord[]>([]);
	protected readonly skills = signal<Skill[]>([]);
	protected readonly skillCategories = signal<SkillCategory[]>([]);
	protected readonly skillLevels = signal<SkillLevel[]>([]);
	protected readonly damageTypes = signal<DamageType[]>([]);
	protected readonly conditions = signal<Condition[]>([]);
	protected readonly progressionPresets = signal<ProgressionPreset[]>([]);
	protected readonly systemValues = signal<SystemValue[]>([]);
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
	protected readonly autoValueEssenceInfluenceOptions =
		AUTO_VALUE_ESSENCE_INFLUENCE_OPTIONS;
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
	protected readonly spellTextPreview = computed(() => {
		const draft = this.draft();

		if (!draft) {
			return '';
		}

		return draft.textBlocks
			.slice()
			.sort((left, right) => left.sortOrder - right.sortOrder)
			.filter(block => block.isActive)
			.map(block => this.renderSpellTextBlock(block))
			.filter(text => text.trim().length)
			.join('\n\n');
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
					value: formatPreviewNumber(evaluateAutoParameterValue(value, x))
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
	) {
		switch (source.sourceKind) {
			case 'mechanicParameter':
				return this.mechanicBlockParameters(block)
					.filter(isAutoSourceMechanicParameter)
					.sort(compareByOrderAndName)
					.map(parameter => ({
						label: this.mechanicParameterSourceLabel(block, parameter),
						value: parameterStorageKey(parameter)
					}));
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

	protected mechanicBlockTextPreview(block: SpellMechanicBlockDraft) {
		const mechanic = this.mechanicBlockMechanic(block);

		if (!mechanic) {
			return 'Механика не найдена.';
		}

		return renderMechanicTextTemplate(
			mechanic.textTemplate,
			mechanic,
			block.parameterValues,
			value => this.parameterValueLabel(value.kind, value.value)
		);
	}

	protected renderSpellTextBlock(block: SpellTextBlock) {
		if (block.kind === 'text') {
			return block.text;
		}

		const mechanicBlock = this.draft()?.mechanicBlocks.find(
			item => item.id === block.mechanicBlockId
		);

		return mechanicBlock ? this.mechanicBlockTextPreview(mechanicBlock) : '';
	}

	protected spellTextBlockPreview(block: SpellTextBlock) {
		const text = this.renderSpellTextBlock(block).trim();
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
				issues.push(`Не назван пункт шкалы ${item.threshold}`);
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
					value: formatPreviewNumber(evaluateAutoParameterValue(value, x))
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
		const draft = this.draft();

		if (!draft) {
			return [];
		}

		return draft.mechanicBlocks.flatMap(block => {
			const mechanic = this.mechanicBlockMechanic(block);

			if (!mechanic) {
				return [];
			}

			return mechanic.parameters
				.filter(isAutoSourceMechanicParameter)
				.sort(compareByOrderAndName)
				.map(parameter => ({
					label: `${mechanic.name}: ${this.mechanicParameterSourceLabel(block, parameter)}`,
					value: areaMechanicParameterSourceKey(block, parameter)
				}));
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
		const config = { ...block.config };
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

	protected resetDraft() {
		this.loadSpell();
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
			case 'COMPLETED':
				return 'Выполнено';
			case 'WAITING_FOR_CHOICE':
				return 'Ожидает выбор';
			case 'WAITING_FOR_ROLLS':
				return 'Ожидает броски';
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
			systemValues: this.valuesRepository.loadCatalog()
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
					systemValues
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

		this.draft.set(draft);
		this.selectedTargetConfigIndex.set(0);
		this.selectedMechanicBlockIndex.set(null);
		this.savedDraftSignature.set(draftSignature(draft));
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

		this.draft.set(draft);
		this.selectedTargetConfigIndex.set(
			draft.targetConfigs.length ? 0 : null
		);
		this.selectedMechanicBlockIndex.set(
			draft.mechanicBlocks.length ? 0 : null
		);
		this.savedDraftSignature.set(draftSignature(draft));
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
		value: SpellParameterValue
	) {
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

		if (isStaticParameterValue(value)) {
			return value.value || 'Не выбрано';
		}

		if (!value) {
			return 'Не выбрано';
		}

		switch (kind) {
			case 'skill':
				return this.skills().find(item => item.id === value)?.name ?? value;
			case 'target':
				return targetConfigText(
					this.draft()?.targetConfigs.find(item => item.id === value) ??
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

function createMechanicBlockConfig(mechanic: SpellMechanic): Record<string, unknown> {
	const effectScaleAction = mechanic.actions.find(action => action.kind === 'effectScale');

	if (!effectScaleAction) {
		return {};
	}

	return {
		effectScale: readSpellEffectScaleConfig(effectScaleAction.config)
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
			!!draft?.targetConfigs.some(target => target.id === value)
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

function areaMechanicParameterSourceKey(
	block: SpellMechanicBlockDraft,
	parameter: SpellMechanicParameter
) {
	return `${block.id}:${parameterStorageKey(parameter)}`;
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
			roundingMode: value.roundingMode,
		};
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
