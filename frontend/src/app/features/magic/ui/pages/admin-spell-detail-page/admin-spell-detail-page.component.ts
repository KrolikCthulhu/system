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
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
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
	ProgressionPresetConfig,
	ProgressionPresetKind,
	ProgressionPresetRoundingMode
} from '../../../../progression-presets/domain/progression-presets.models';
import { SKILLS_REPOSITORY } from '../../../../skills/data/skills-repository.port';
import { Skill, SkillCategory } from '../../../../skills/domain/skills.models';
import { VALUES_REPOSITORY } from '../../../../values/data/values-repository.port';
import { SystemValue } from '../../../../values/domain/values.models';
import { SPELL_MECHANICS_REPOSITORY } from '../../../../spell-mechanics/data/spell-mechanics-repository.port';
import { MechanicCalculationGraphEditorComponent } from '../../../../spell-mechanics/ui/components/mechanic-calculation-graph-editor/mechanic-calculation-graph-editor.component';
import { formatMechanicCalculationFormula } from '../../../../spell-mechanics/ui/mechanic-calculation-graph.formula';
import {
	MechanicCalculationGraphState,
	MechanicCalculationOperation,
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
	SPELL_STATUS_OPTIONS,
	Spell,
	SpellCatalog,
	SpellFormulaCandidate,
	SpellMechanicBlock,
	SpellTargetConfig,
	SpellTargetCountMode,
	SpellTargetCountValueMode,
	SpellTargetRelation,
	SpellTargetSource,
	canManageSpellActivity,
	spellStatusLabel
} from '../../../domain/spell.models';

interface SelectOption {
	id: string;
	name: string;
	searchText: string;
}

interface SelectOptionGroup {
	label: string;
	items: SelectOption[];
}

interface SpellMechanicBlockDraft {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, SpellParameterValue>;
	isActive: boolean;
	sortOrder: number;
}

type SpellParameterValue =
	| string
	| SpellStaticParameterValue
	| SpellProgressionParameterValue
	| SpellFormulaParameterValue
	| SpellAutoParameterValue;
type SpellParameterValueMode = 'static' | 'progression' | 'auto' | 'formula';
type TargetTemplateId =
	| 'mechanicDefault'
	| 'caster'
	| 'singleEnemy'
	| 'singleAlly'
	| 'allEnemiesArea'
	| 'allAlliesArea'
	| 'anyArea'
	| 'custom';
type ProgressionSourceKind = 'manual' | 'skillLevel' | 'essenceProfile';
type AutoValueCharacter =
	| 'stable'
	| 'scalable'
	| 'elemental'
	| 'masterful'
	| 'limited'
	| 'extreme';
type AutoValueScale = 'small' | 'medium' | 'large' | 'huge';
type AutoValueGrowth = 'weak' | 'smooth' | 'fast' | 'saturation' | 'explosive';
type AutoValueSourceMode = 'simple' | 'advanced';
type AutoValueSourceKind =
	| 'mechanicParameter'
	| 'systemValue'
	| 'essenceProfile'
	| 'manual';
type AutoValueSourceTarget =
	| 'growth'
	| 'multiplier'
	| 'base'
	| 'maximum'
	| 'essenceBonus';
type AutoValueSourceCurve = 'weak' | 'smooth' | 'fast' | 'saturation' | 'explosive';
type AutoValueEssenceInfluence = 'none' | 'light' | 'medium' | 'strong';
type EssenceProfileKey =
	| 'damage'
	| 'range'
	| 'control'
	| 'duration'
	| 'area'
	| 'stability';

interface SpellProgressionParameterValue {
	mode: 'progression';
	sourceKind: ProgressionSourceKind;
	sourceKey: string;
	presetId: string;
	config: ProgressionPresetConfig;
}

interface SpellStaticParameterValue {
	mode: 'static';
	value: string;
}

interface SpellFormulaParameterValue {
	mode: 'formula';
	graph: MechanicCalculationGraphState | null;
}

interface SpellAutoParameterValue {
	mode: 'auto';
	character: AutoValueCharacter;
	scale: AutoValueScale;
	growth: AutoValueGrowth;
	sourceMode: AutoValueSourceMode;
	sources: SpellAutoParameterSource[];
	essenceInfluence: AutoValueEssenceInfluence;
	essenceProfileKey: EssenceProfileKey;
	roundingMode: ProgressionPresetRoundingMode;
}

interface SpellAutoParameterSource {
	id: string;
	sourceKind: AutoValueSourceKind;
	sourceKey: string;
	target: AutoValueSourceTarget;
	weight: number;
	curve: AutoValueSourceCurve;
}

interface NumericParameterPreview {
	formula: string;
	sources: string[];
	rounding: string;
	values: Array<{ x: number; value: string }>;
}

interface FormulaParameterSelection {
	blockIndex: number;
	parameterId: string;
}

interface ConfigField {
	key: string;
	label: string;
	min?: number;
	step: number;
}

interface SpellDraft {
	id: string | null;
	actionId: string;
	essenceId: string;
	gestureId: string;
	formulaName: string;
	name: string;
	description: string;
	status: PersistedSpellStatus;
	isActive: boolean;
	sortOrder: number;
	targetConfigs: SpellTargetConfig[];
	mechanicBlocks: SpellMechanicBlockDraft[];
}

const TARGET_SOURCE_OPTIONS: Array<{ label: string; value: SpellTargetSource }> = [
	{ label: 'Сам кастер', value: 'caster' },
	{ label: 'Выбрать вручную', value: 'selected' },
	{ label: 'В области', value: 'area' }
];

const TARGET_RELATION_OPTIONS: Array<{ label: string; value: SpellTargetRelation }> = [
	{ label: 'Сам', value: 'self' },
	{ label: 'Любые', value: 'any' },
	{ label: 'Враги', value: 'enemy' },
	{ label: 'Союзники', value: 'ally' }
];

const TARGET_COUNT_MODE_OPTIONS: Array<{ label: string; value: SpellTargetCountMode }> = [
	{ label: 'Одна', value: 'one' },
	{ label: 'Все', value: 'all' },
	{ label: 'До значения', value: 'upTo' },
	{ label: 'Ровно значение', value: 'exact' }
];

const TARGET_COUNT_VALUE_MODE_OPTIONS: Array<{
	label: string;
	value: SpellTargetCountValueMode;
}> = [
	{ label: 'Число', value: 'fixed' },
	{ label: 'Формула', value: 'formula' }
];

const TARGET_TEMPLATE_OPTIONS: Array<{ label: string; value: TargetTemplateId }> = [
	{ label: 'Дефолт механики', value: 'mechanicDefault' },
	{ label: 'Кастер', value: 'caster' },
	{ label: 'Одна вражеская цель', value: 'singleEnemy' },
	{ label: 'Одна союзная цель', value: 'singleAlly' },
	{ label: 'Все враги в области', value: 'allEnemiesArea' },
	{ label: 'Все союзники в области', value: 'allAlliesArea' },
	{ label: 'Любые цели в области', value: 'anyArea' },
	{ label: 'Своя настройка', value: 'custom' }
];

const PARAMETER_VALUE_MODE_OPTIONS: Array<{
	label: string;
	value: SpellParameterValueMode;
}> = [
	{ label: 'Значение', value: 'static' },
	{ label: 'Прогрессия', value: 'progression' },
	{ label: 'Авто', value: 'auto' },
	{ label: 'Формула', value: 'formula' }
];

const PROGRESSION_SOURCE_KIND_OPTIONS: Array<{
	label: string;
	value: ProgressionSourceKind;
}> = [
	{ label: 'Навык из параметра', value: 'skillLevel' },
	{ label: 'Профиль сущности', value: 'essenceProfile' },
	{ label: 'Ручной x', value: 'manual' }
];

const ESSENCE_PROFILE_SOURCE_OPTIONS: Array<{ label: string; value: EssenceProfileKey }> = [
	{ label: 'Урон', value: 'damage' },
	{ label: 'Дальность', value: 'range' },
	{ label: 'Контроль', value: 'control' },
	{ label: 'Длительность', value: 'duration' },
	{ label: 'Область', value: 'area' },
	{ label: 'Стабильность', value: 'stability' }
];

const ROUNDING_MODE_OPTIONS: Array<{
	label: string;
	value: ProgressionPresetRoundingMode;
}> = [
	{ label: 'Вниз', value: 'floor' },
	{ label: 'Округлить', value: 'round' },
	{ label: 'Вверх', value: 'ceil' }
];

const AUTO_VALUE_CHARACTER_OPTIONS: Array<{
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

const AUTO_VALUE_SCALE_OPTIONS: Array<{ label: string; value: AutoValueScale }> = [
	{ label: 'Малый', value: 'small' },
	{ label: 'Средний', value: 'medium' },
	{ label: 'Большой', value: 'large' },
	{ label: 'Огромный', value: 'huge' }
];

const AUTO_VALUE_GROWTH_OPTIONS: Array<{ label: string; value: AutoValueGrowth }> = [
	{ label: 'Слабый', value: 'weak' },
	{ label: 'Плавный', value: 'smooth' },
	{ label: 'Быстрый', value: 'fast' },
	{ label: 'Насыщение', value: 'saturation' },
	{ label: 'Взрывной', value: 'explosive' }
];

const AUTO_VALUE_SOURCE_MODE_OPTIONS: Array<{
	label: string;
	value: AutoValueSourceMode;
}> = [
	{ label: 'Простой', value: 'simple' },
	{ label: 'Расширенный', value: 'advanced' }
];

const AUTO_VALUE_SOURCE_KIND_OPTIONS: Array<{
	label: string;
	value: AutoValueSourceKind;
}> = [
	{ label: 'Параметр механики', value: 'mechanicParameter' },
	{ label: 'Значение системы', value: 'systemValue' },
	{ label: 'Профиль сущности', value: 'essenceProfile' },
	{ label: 'Ручной x', value: 'manual' }
];

const AUTO_VALUE_SOURCE_TARGET_OPTIONS: Array<{
	label: string;
	value: AutoValueSourceTarget;
}> = [
	{ label: 'Рост', value: 'growth' },
	{ label: 'Множитель', value: 'multiplier' },
	{ label: 'База', value: 'base' },
	{ label: 'Максимум', value: 'maximum' },
	{ label: 'Бонус сущности', value: 'essenceBonus' }
];

const AUTO_VALUE_SOURCE_CURVE_OPTIONS: Array<{
	label: string;
	value: AutoValueSourceCurve;
}> = [
	{ label: 'Слабая', value: 'weak' },
	{ label: 'Плавная', value: 'smooth' },
	{ label: 'Быстрая', value: 'fast' },
	{ label: 'Насыщение', value: 'saturation' },
	{ label: 'Взрывная', value: 'explosive' }
];

const AUTO_VALUE_ESSENCE_INFLUENCE_OPTIONS: Array<{
	label: string;
	value: AutoValueEssenceInfluence;
}> = [
	{ label: 'Нет', value: 'none' },
	{ label: 'Лёгкое', value: 'light' },
	{ label: 'Среднее', value: 'medium' },
	{ label: 'Сильное', value: 'strong' }
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
		InputNumber,
		InputText,
		Select,
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
		MechanicCalculationGraphEditorComponent
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
	protected readonly selectedMechanicBlock = computed(() => {
		const index = this.selectedMechanicBlockIndex();
		return index === null ? null : (this.draft()?.mechanicBlocks[index] ?? null);
	});
	protected readonly selectedTargetConfig = computed(() => {
		const index = this.selectedTargetConfigIndex();
		return index === null ? null : (this.draft()?.targetConfigs[index] ?? null);
	});
	protected readonly targetSourceOptions = TARGET_SOURCE_OPTIONS;
	protected readonly targetRelationOptions = TARGET_RELATION_OPTIONS;
	protected readonly targetCountModeOptions = TARGET_COUNT_MODE_OPTIONS;
	protected readonly targetCountValueModeOptions = TARGET_COUNT_VALUE_MODE_OPTIONS;
	protected readonly targetTemplateOptions = TARGET_TEMPLATE_OPTIONS;
	protected readonly parameterValueModeOptions = PARAMETER_VALUE_MODE_OPTIONS;
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
	protected readonly progressionPreviewSteps = [0, 1, 2, 3, 4, 5];
	protected readonly progressionPresetOptions = computed(() =>
		this.progressionPresets()
			.filter(preset => preset.isActive)
			.sort(compareByOrderAndName)
			.map(preset => ({
				label: preset.name,
				value: preset.id
			}))
	);
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
		if (templateId === 'custom') {
			return;
		}

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
			currentTarget?.sortOrder ?? draft.targetConfigs.length
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

	protected targetTemplateOptionsForParameter(parameter: SpellMechanicParameter) {
		return parameter.defaultTargetConfig
			? this.targetTemplateOptions
			: this.targetTemplateOptions.filter(option => option.value !== 'mechanicDefault');
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
					supportsNumericParameterKind(parameter.kind) &&
					parameter.numericRole === 'targetCount'
			)
			.sort(compareByOrderAndName)
			.map(parameter => ({
				label: parameter.name,
				value: parameter.id
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
		const source = optionLabel(this.targetSourceOptions, target.source);
		const relation = optionLabel(this.targetRelationOptions, target.relation);
		const count = targetCountLabel(target);

		return `${source}, ${relation.toLowerCase()}, ${count.toLowerCase()}`;
	}

	protected addMechanicBlock() {
		const mechanic = this.spellMechanics()
			.filter(item => item.isActive)
			.sort(compareByOrderAndName)[0];

		if (!mechanic) {
			return;
		}

		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			...createMechanicBlockPatch(
				draft,
				mechanic,
				this.essenceMagicWord()
			)
		});
		this.selectedMechanicBlockIndex.set(draft.mechanicBlocks.length);
	}

	protected selectMechanicBlock(index: number) {
		this.selectedMechanicBlockIndex.set(index);
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

		this.updateMechanicBlock(blockIndex, {
			...block,
			parameterValues: {
				...block.parameterValues,
				[parameterId]: value ?? ''
			}
		});
	}

	protected updateMechanicBlockParameterMode(
		blockIndex: number,
		parameterId: string,
		mode: SpellParameterValueMode
	) {
		const block = this.draft()?.mechanicBlocks[blockIndex];
		const currentValue = block?.parameterValues[parameterId];
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
						label: parameter.name,
						value: parameter.id
					}));
			case 'systemValue':
				return this.systemValues()
					.slice()
					.sort(compareBySectionAndName)
					.map(value => ({
						label: value.displaySection
							? `${value.displaySection}: ${value.name}`
							: value.name,
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
				return 'Значение';
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
						.find(parameter => parameter.name.toLowerCase().includes('атаки'))?.id ??
					this.mechanicBlockParameters(block)
						.filter(isAutoSourceMechanicParameter)
						.sort(compareByOrderAndName)[0]?.id ??
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

	protected parameterValue(block: SpellMechanicBlockDraft, parameterId: string) {
		const value = block.parameterValues[parameterId];
		return parameterValueText(value);
	}

	protected parameterValueMode(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellParameterValueMode {
		const value = block.parameterValues[parameterId];

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
		return parameterValueText(block.parameterValues[parameterId]);
	}

	protected supportsProgression(parameter: SpellMechanicParameter) {
		return supportsNumericParameterKind(parameter.kind);
	}

	protected progressionParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellProgressionParameterValue | null {
		const value = block.parameterValues[parameterId];
		return isProgressionParameterValue(value) ? value : null;
	}

	protected formulaParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellFormulaParameterValue | null {
		const value = block.parameterValues[parameterId];
		return isFormulaParameterValue(value) ? value : null;
	}

	protected autoParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellAutoParameterValue | null {
		const value = block.parameterValues[parameterId];
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
		const value = block.parameterValues[parameter.id];
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
				values: this.progressionPreviewSteps.map(x => ({
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
				values: this.progressionPreviewSteps.map(x => ({
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
				values: this.progressionPreviewSteps.map(x => ({
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
			values: this.progressionPreviewSteps.map(x => ({
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
				id: formulaSourceId('parameter', parameter.id),
				name: `Параметр: ${parameter.name}`,
				searchText: `${parameter.name} параметр число формула`
			}));
		const skillParameterSources = parameters
			.filter(parameter => parameter.kind === 'skill')
			.sort(compareByOrderAndName)
			.map(parameter => ({
				id: formulaSourceId('skillParameterLevel', parameter.id),
				name: `Уровень: ${parameter.name}`,
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
				name: value.displaySection
					? `Значение системы: ${value.displaySection}: ${value.name}`
					: `Значение системы: ${value.name}`,
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
					value: parameter.id
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
			status: draft.status,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			mechanicBlocks: draft.mechanicBlocks.map((block, index) => ({
				id: block.id,
				mechanicId: block.mechanicId,
				parameterValues: block.parameterValues,
				isActive: block.isActive,
				sortOrder: index
			})),
			targetConfigs: draft.targetConfigs.map((target, index) => ({
				...target,
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
			status: 'DRAFT',
			isActive: false,
			sortOrder: 0,
			targetConfigs: createDefaultTargetConfigs(),
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
			status: spell.status,
			isActive: spell.isActive,
			sortOrder: spell.sortOrder,
			targetConfigs: normalizeTargetConfigs(spell.targetConfigs),
			mechanicBlocks: spell.mechanicBlocks
				.sort((first, second) => first.sortOrder - second.sortOrder)
				.map(block => ({
					id: block.id,
					mechanicId: block.mechanicId,
					parameterValues: normalizeParameterValues(
						block.parameterValues,
						this.findMechanic(block.mechanicId)?.parameters ?? []
					),
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
				return this.draft()?.targetConfigs.find(item => item.id === value)?.name ?? value;
			case 'damageType':
				return this.damageTypes().find(item => item.id === value)?.name ?? value;
			case 'condition':
				return this.conditions().find(item => item.id === value)?.name ?? value;
			default:
				return value;
		}
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
				parameter.id,
				defaultParameterValue(parameter, essence, targetIdsByParameterId)
			])
		),
		isActive: true,
		sortOrder
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

function createTargetConfigFromMechanicDefault(
	defaultTarget: NonNullable<SpellMechanicParameter['defaultTargetConfig']>,
	sortOrder: number
): SpellTargetConfig {
	return {
		id: crypto.randomUUID(),
		name: defaultTarget.name,
		source: defaultTarget.source,
		relation: defaultTarget.relation,
		countMode: defaultTarget.countMode,
		countValueMode: defaultTarget.countValueMode,
		countValue: defaultTarget.countValue,
		countFormula: defaultTarget.countFormula,
		targetCountParameterId: defaultTarget.targetCountParameterId,
		isRequired: defaultTarget.isRequired,
		sortOrder
	};
}

function createDefaultTargetConfigs(): SpellTargetConfig[] {
	return [];
}

function createTargetConfigDraft(sortOrder: number): SpellTargetConfig {
	return {
		id: crypto.randomUUID(),
		name: `Цель ${sortOrder + 1}`,
		source: 'selected',
		relation: 'any',
		countMode: 'one',
		countValueMode: 'fixed',
		countValue: 1,
		countFormula: '',
		targetCountParameterId: '',
		isRequired: true,
		sortOrder
	};
}

function createTargetConfigFromTemplate(
	templateId: TargetTemplateId,
	mechanicDefault: SpellMechanicParameter['defaultTargetConfig'],
	id: string,
	sortOrder: number
): SpellTargetConfig | null {
	if (templateId === 'mechanicDefault') {
		return mechanicDefault
			? {
					id,
					name: mechanicDefault.name,
					source: mechanicDefault.source,
					relation: mechanicDefault.relation,
					countMode: mechanicDefault.countMode,
					countValueMode: mechanicDefault.countValueMode,
					countValue: mechanicDefault.countValue,
					countFormula: mechanicDefault.countFormula,
					targetCountParameterId: mechanicDefault.targetCountParameterId,
					isRequired: mechanicDefault.isRequired,
					sortOrder
				}
			: null;
	}

	const preset = targetPresetConfig(templateId);

	return preset
		? {
				id,
				...preset,
				sortOrder
			}
		: null;
}

function targetPresetConfig(
	templateId: TargetTemplateId
): Omit<SpellTargetConfig, 'id' | 'sortOrder'> | null {
	switch (templateId) {
		case 'caster':
			return createTargetPreset('Кастер', 'caster', 'self', 'one');
		case 'singleEnemy':
			return createTargetPreset('Вражеская цель', 'selected', 'enemy', 'one');
		case 'singleAlly':
			return createTargetPreset('Союзная цель', 'selected', 'ally', 'one');
		case 'allEnemiesArea':
			return createTargetPreset('Все враги в области', 'area', 'enemy', 'all');
		case 'allAlliesArea':
			return createTargetPreset('Все союзники в области', 'area', 'ally', 'all');
		case 'anyArea':
			return createTargetPreset('Любые цели в области', 'area', 'any', 'all');
		case 'mechanicDefault':
		case 'custom':
			return null;
	}
}

function createTargetPreset(
	name: string,
	source: SpellTargetSource,
	relation: SpellTargetRelation,
	countMode: SpellTargetCountMode
): Omit<SpellTargetConfig, 'id' | 'sortOrder'> {
	return {
		name,
		source,
		relation,
		countMode,
		countValueMode: 'fixed',
		countValue: 1,
		countFormula: '',
		targetCountParameterId: '',
		isRequired: true
	};
}

function findTargetPresetTemplate(target: SpellTargetConfig): TargetTemplateId | null {
	const presets: TargetTemplateId[] = [
		'caster',
		'singleEnemy',
		'singleAlly',
		'allEnemiesArea',
		'allAlliesArea',
		'anyArea'
	];

	return presets.find(template => {
		const preset = targetPresetConfig(template);
		return preset ? targetMatchesTemplate(target, preset) : false;
	}) ?? null;
}

function targetMatchesTemplate(
	target: SpellTargetConfig,
	template: Omit<SpellTargetConfig, 'id' | 'sortOrder'>
) {
	return (
		target.name === template.name &&
		target.source === template.source &&
		target.relation === template.relation &&
		target.countMode === template.countMode &&
		target.countValueMode === template.countValueMode &&
		target.countValue === template.countValue &&
		target.countFormula === template.countFormula &&
		target.targetCountParameterId === template.targetCountParameterId &&
		target.isRequired === template.isRequired
	);
}

function normalizeTargetConfigs(targets: SpellTargetConfig[]): SpellTargetConfig[] {
	return targets
		.sort(compareByOrderAndName)
		.map((target, index) => ({
			id: target.id || crypto.randomUUID(),
			name: target.name || `Цель ${index + 1}`,
			source: target.source,
			relation: target.relation,
			countMode: target.countMode,
			countValueMode: target.countValueMode,
			countValue: target.countValue,
			countFormula: target.countFormula,
			targetCountParameterId: target.targetCountParameterId ?? '',
			isRequired: target.isRequired,
			sortOrder: index
		}));
}

function optionLabel<T extends string>(
	options: Array<{ label: string; value: T }>,
	value: T
) {
	return options.find(option => option.value === value)?.label ?? value;
}

function targetCountLabel(target: SpellTargetConfig) {
	if (target.countMode === 'one') {
		return 'одна цель';
	}

	if (target.countMode === 'all') {
		return 'все цели';
	}

	const value =
		target.countValueMode === 'parameter'
			? 'из параметра'
			: target.countValueMode === 'formula'
			? target.countFormula || 'формула'
			: String(target.countValue);

	return target.countMode === 'upTo' ? `до ${value}` : `ровно ${value}`;
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

function createProgressionParameterValue(
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

function createStaticParameterValue(value: string): SpellStaticParameterValue {
	return {
		mode: 'static',
		value
	};
}

function createFormulaParameterValue(): SpellFormulaParameterValue {
	return {
		mode: 'formula',
		graph: null
	};
}

function createAutoParameterValue(): SpellAutoParameterValue {
	return {
		mode: 'auto',
		character: 'scalable',
		scale: 'medium',
		growth: 'smooth',
		sourceMode: 'simple',
		sources: [createAutoParameterSource()],
		essenceInfluence: 'light',
		essenceProfileKey: 'damage',
		roundingMode: 'round'
	};
}

function createAutoParameterSource(
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

function createAutoSourcesForMode(
	mode: AutoValueSourceMode,
	currentSources: SpellAutoParameterSource[]
) {
	if (mode === 'simple') {
		return [currentSources[0] ?? createAutoParameterSource()];
	}

	return currentSources.length ? currentSources : [createAutoParameterSource()];
}

function isStaticParameterValue(value: unknown): value is SpellStaticParameterValue {
	if (!isRecord(value)) {
		return false;
	}

	return value['mode'] === 'static' && typeof value['value'] === 'string';
}

function isProgressionParameterValue(
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

function isFormulaParameterValue(value: unknown): value is SpellFormulaParameterValue {
	if (!isRecord(value)) {
		return false;
	}

	return (
		value['mode'] === 'formula' &&
		(value['graph'] === null || isMechanicCalculationGraph(value['graph']))
	);
}

function isAutoParameterValue(value: unknown): value is SpellAutoParameterValue {
	if (!isRecord(value)) {
		return false;
	}

	return (
		value['mode'] === 'auto' &&
		isAutoValueCharacter(value['character']) &&
		isAutoValueScale(value['scale']) &&
		isAutoValueGrowth(value['growth']) &&
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

function parameterValueText(value: SpellParameterValue | null | undefined) {
	if (typeof value === 'string') {
		return value;
	}

	if (isStaticParameterValue(value)) {
		return value.value;
	}

	return '';
}

function supportsNumericParameterKind(kind: SpellMechanicParameterKind) {
	return kind === 'number' || kind === 'formula';
}

function isAutoSourceMechanicParameter(parameter: SpellMechanicParameter) {
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

function formulaSourceId(kind: string, id: string) {
	return `${kind}:${id}`;
}

function getConfigFields(kind: ProgressionPresetKind): ConfigField[] {
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

function buildFormulaLabel(kind: ProgressionPresetKind, config: ProgressionPresetConfig) {
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

function evaluateRoundedProgression(
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

function roundingMode(config: ProgressionPresetConfig): ProgressionPresetRoundingMode {
	const mode = config['roundingMode'];

	if (mode === 'floor' || mode === 'round' || mode === 'ceil') {
		return mode;
	}

	return 'round';
}

function progressionSourceFormulaSourceId(value: SpellProgressionParameterValue) {
	switch (value.sourceKind) {
		case 'skillLevel':
			return formulaSourceId('skillParameterLevel', value.sourceKey);
		case 'essenceProfile':
			return formulaSourceId('essenceProfile', value.sourceKey);
		case 'manual':
			return formulaSourceId('manual', 'x');
	}
}

function createGraphFromProgression(
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

function graphSourceLabels(
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

function autoParameterFormulaLabel(
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

	const limitParts = [
		...(config.limitMax === null ? [] : [`${config.limitMax}`]),
		...groups.maximum
	];

	return `${limitParts.length ? `min(${expression}, ${limitParts.join(' + ')})` : expression}; ${roundingLabel(value.roundingMode)}`;
}

function autoParameterSourceLabels(
	value: SpellAutoParameterValue,
	sourceNames: ReadonlyMap<string, string>
) {
	const sources = value.sources.map(source => autoSourceLabel(source, sourceNames));

	if (value.essenceInfluence !== 'none') {
		sources.push(autoEssenceProfileLabel(value.essenceProfileKey, sourceNames));
	}

	return Array.from(new Set(sources));
}

function evaluateAutoParameterValue(value: SpellAutoParameterValue, x: number) {
	const config = autoParameterConfig(value);
	const groups = autoSourceValueGroups(value, x);
	const base = config.base + groups.base;
	const power = groups.growth * config.powerMultiplier;
	const essence = autoEssenceInfluenceWeight(value.essenceInfluence) * x;
	const multiplied = (base + power + essence + groups.essenceBonus) * (1 + groups.multiplier);
	const limit = config.limitMax === null ? null : config.limitMax + groups.maximum;
	const limited = limit === null ? multiplied : Math.min(multiplied, limit);

	return applyRoundingMode(limited, value.roundingMode);
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
		groups[source.target].push(autoSourceFormulaLabel(source, sourceNames));
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
		groups[source.target] += applyAutoSourceCurve(source.curve, x) * source.weight;
	}

	return groups;
}

function autoSourceFormulaLabel(
	source: SpellAutoParameterSource,
	sourceNames: ReadonlyMap<string, string>
) {
	return `${autoSourceCurveFormulaLabel(
		source.curve,
		autoSourceLabel(source, sourceNames)
	)} * ${formatPreviewNumber(source.weight)}`;
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

function graphRoundingLabel(graph: MechanicCalculationGraphState | null) {
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

function roundingLabel(mode: ProgressionPresetRoundingMode) {
	switch (mode) {
		case 'floor':
			return 'Округлить вниз';
		case 'round':
			return 'Округлить';
		case 'ceil':
			return 'Округлить вверх';
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

function evaluateFormulaGraphPreview(
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

function formatPreviewNumber(value: number) {
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

function normalizeParameterValues(
	values: Record<string, unknown>,
	parameters: SpellMechanicParameter[]
) {
	const parametersById = new Map(parameters.map(parameter => [parameter.id, parameter]));

	return Object.fromEntries(
		Object.entries(values).map(([key, value]) => [
			key,
			normalizeParameterValue(value, parametersById.get(key) ?? null)
		])
	);
}

function normalizeParameterValue(
	value: unknown,
	parameter: SpellMechanicParameter | null
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
			sourceKey: value.sourceKey,
			presetId: value.presetId,
			config: { ...value.config }
		};
	}

	if (isFormulaParameterValue(value)) {
		return {
			mode: 'formula',
			graph: value.graph
				? {
						nodes: value.graph.nodes.map(node => ({ ...node })),
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
			sources: value.sources.map(source => ({ ...source })),
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

function renderMechanicTextTemplate(
	template: string,
	mechanic: SpellMechanic,
	values: Record<string, SpellParameterValue>,
	formatValue: (value: {
		kind: SpellMechanicParameterKind;
		value: SpellParameterValue;
	}) => string
) {
	const document = parseMechanicTextTemplate(template);

	return document
		.map(segment => {
			if (segment.kind === 'text') {
				return segment.text;
			}

			if (segment.kind === 'parameter') {
				const parameter = mechanic.parameters.find(
					item => item.id === segment.parameterId
				);

				if (!parameter) {
					return '[Параметр не найден]';
				}

				return formatValue({
					kind: parameter.kind,
					value: values[parameter.id] ?? parameter.defaultValue.value
				});
			}

			return `[${segment.resultName}]`;
		})
		.join('');
}

type MechanicTextTemplateSegment =
	| { kind: 'text'; text: string }
	| { kind: 'parameter'; parameterId: string }
	| { kind: 'actionResult'; actionId: string; resultName: string };

function parseMechanicTextTemplate(template: string): MechanicTextTemplateSegment[] {
	if (!template.trim()) {
		return [];
	}

	try {
		const parsed: unknown = JSON.parse(template);

		if (
			isRecord(parsed) &&
			parsed['version'] === 1 &&
			Array.isArray(parsed['segments'])
		) {
			return parsed['segments'].filter(isMechanicTextTemplateSegment);
		}
	} catch {
		return [{ kind: 'text', text: template }];
	}

	return [{ kind: 'text', text: template }];
}

function isMechanicTextTemplateSegment(
	value: unknown
): value is MechanicTextTemplateSegment {
	if (!isRecord(value)) {
		return false;
	}

	if (value['kind'] === 'text') {
		return typeof value['text'] === 'string';
	}

	if (value['kind'] === 'parameter') {
		return typeof value['parameterId'] === 'string';
	}

	return (
		value['kind'] === 'actionResult' &&
		typeof value['actionId'] === 'string' &&
		typeof value['resultName'] === 'string'
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function draftSignature(draft: SpellDraft | null): string {
	return JSON.stringify(draft ?? null);
}
