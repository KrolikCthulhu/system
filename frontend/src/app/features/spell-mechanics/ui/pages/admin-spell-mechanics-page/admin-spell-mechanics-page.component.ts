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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { ConfirmationService, TreeNode } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { TreeTableModule } from 'primeng/treetable';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { NavigationTreeComponent } from '../../../../../shared/ui/navigation-tree/navigation-tree.component';
import { NavigationTreeGroup } from '../../../../../shared/ui/navigation-tree/navigation-tree.models';
import { CONDITIONS_REPOSITORY } from '../../../../conditions/data/conditions-repository.port';
import { Condition } from '../../../../conditions/domain/conditions.models';
import { DAMAGE_TYPES_REPOSITORY } from '../../../../damage-types/data/damage-types-repository.port';
import { DamageType } from '../../../../damage-types/domain/damage-types.models';
import { SKILLS_REPOSITORY } from '../../../../skills/data/skills-repository.port';
import { Skill, SkillCategory } from '../../../../skills/domain/skills.models';
import { VALUES_REPOSITORY } from '../../../../values/data/values-repository.port';
import { SystemValue } from '../../../../values/domain/values.models';
import { SPELL_MECHANICS_REPOSITORY } from '../../../data/spell-mechanics-repository.port';
import { MechanicCalculationGraphEditorComponent } from '../../components/mechanic-calculation-graph-editor/mechanic-calculation-graph-editor.component';
import { formatMechanicCalculationFormula } from '../../mechanic-calculation-graph.formula';
import {
	MechanicCalculationGraphState,
	MechanicCalculationSourceGroup
} from '../../mechanic-calculation-graph.models';
import {
	SpellMechanic,
	SpellMechanicAction,
	SpellMechanicActionKind,
	SpellMechanicCategory,
	SpellMechanicConfigSchema,
	SpellMechanicParameter,
	SpellMechanicParameterDefaultValue,
	SpellMechanicParameterDefaultValueMode,
	SpellMechanicParameterKind
} from '../../../domain/spell-mechanics.models';

type SelectionKind = 'category' | 'mechanic';

interface CategoryDraft {
	id: string | null;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
}

interface MechanicDraft {
	id: string | null;
	categoryId: string;
	name: string;
	description: string;
	configSchemaText: string;
	textTemplate: string;
	parameters: SpellMechanicParameter[];
	actions: MechanicActionDraft[];
	isActive: boolean;
	sortOrder: number;
}

interface MechanicActionDraft extends Omit<SpellMechanicAction, 'config'> {
	configText: string;
}

interface NestedMechanicActionDraft
	extends Omit<SpellMechanicAction, 'mechanicId' | 'config' | 'createdAt' | 'updatedAt'> {
	config: SpellMechanicConfigSchema;
}

type ActionTargetSource =
	| { kind: 'mechanicParameter'; parameterId: string }
	| { kind: 'caster' }
	| { kind: 'spellTarget' }
	| { kind: 'actionResult'; actionId: string; resultName: string };

type ActionAmountSource =
	| { kind: 'mechanicParameter'; parameterId: string }
	| { kind: 'actionResult'; actionId: string; resultName: string }
	| { kind: 'constant'; value: number };

type ActionSkillSource =
	| { kind: 'linkedMagicWordSkill' }
	| { kind: 'mechanicParameter'; parameterId: string }
	| { kind: 'staticSkill'; skillId: string };

type ValueChangeOperation = 'increase' | 'decrease' | 'set';
type ComparisonOperator = 'gt' | 'gte' | 'eq' | 'lte' | 'lt';

interface RollActionConfig extends Record<string, unknown> {
	actor?: ActionTargetSource;
	skill?: ActionSkillSource;
	resultName?: string;
	optional?: boolean;
}

interface ComparisonActionConfig extends Record<string, unknown> {
	left?: ActionAmountSource;
	operator?: ComparisonOperator;
	right?: ActionAmountSource;
	resultName?: string;
	marginResultName?: string;
}

interface CalculationActionConfig extends Record<string, unknown> {
	graph?: MechanicCalculationGraphState | null;
	resultName?: string;
}

type BranchName = 'thenActions' | 'elseActions';

interface BranchActionPathSegment {
	branchName: BranchName;
	actionId: string;
}

interface BranchActionSelection {
	rootIndex: number;
	path: BranchActionPathSegment[];
}

interface BranchActionConfig extends Record<string, unknown> {
	condition?: ActionAmountSource;
	thenActions?: NestedMechanicActionDraft[];
	elseActions?: NestedMechanicActionDraft[];
}

type ScenarioTreeNodeData =
	| {
			kind: 'action';
			label: string;
			action: MechanicActionDraft | NestedMechanicActionDraft;
			rootIndex: number;
			path: BranchActionPathSegment[];
	  }
	| {
			kind: 'branch';
			label: string;
			rootIndex: number;
			parentPath: BranchActionPathSegment[];
			branchName: BranchName;
	  };

interface ValueChangeActionConfig extends Record<string, unknown> {
	target?: ActionTargetSource;
	systemValueId?: string;
	operation?: ValueChangeOperation;
	amount?: ActionAmountSource;
}

interface ConditionActionConfig extends Record<string, unknown> {
	target?: ActionTargetSource;
	conditionId?: string;
	source?: ActionTargetSource;
	duration?: ActionAmountSource;
}

const SLOT_KIND_OPTIONS: Array<{
	label: string;
	value: SpellMechanicParameterKind;
}> = [
	{ label: 'Цель', value: 'target' },
	{ label: 'Навык', value: 'skill' },
	{ label: 'Число', value: 'number' },
	{ label: 'Формула', value: 'formula' },
	{ label: 'Тип урона', value: 'damageType' },
	{ label: 'Состояние', value: 'condition' },
	{ label: 'Значение', value: 'systemValue' },
	{ label: 'Текст', value: 'text' }
];

const DEFAULT_VALUE_MODE_OPTIONS: Array<{
	label: string;
	value: SpellMechanicParameterDefaultValueMode;
}> = [
	{ label: 'Пусто', value: 'empty' },
	{ label: 'Конкретное значение', value: 'static' },
	{ label: 'Из сущности', value: 'fromMagicWord' }
];

const ACTION_KIND_OPTIONS: Array<{
	label: string;
	value: SpellMechanicActionKind;
}> = [
	{ label: 'Бросок', value: 'roll' },
	{ label: 'Проверка', value: 'check' },
	{ label: 'Сравнение', value: 'comparison' },
	{ label: 'Вычисление', value: 'calculation' },
	{ label: 'Если', value: 'branch' },
	{ label: 'Изменение значения', value: 'valueChange' },
	{ label: 'Наложение состояния', value: 'conditionAdd' },
	{ label: 'Снятие состояния', value: 'conditionRemove' },
	{ label: 'Текст', value: 'text' },
	{ label: 'Свободное действие', value: 'custom' }
];

const VALUE_CHANGE_OPERATION_OPTIONS: Array<{
	label: string;
	value: ValueChangeOperation;
}> = [
	{ label: 'Увеличить', value: 'increase' },
	{ label: 'Уменьшить', value: 'decrease' },
	{ label: 'Установить', value: 'set' }
];

const COMPARISON_OPERATOR_OPTIONS: Array<{
	label: string;
	value: ComparisonOperator;
}> = [
	{ label: 'Больше', value: 'gt' },
	{ label: 'Больше или равно', value: 'gte' },
	{ label: 'Равно', value: 'eq' },
	{ label: 'Меньше или равно', value: 'lte' },
	{ label: 'Меньше', value: 'lt' }
];

interface SelectOption {
	id: string;
	name: string;
	searchText: string;
}

interface SelectOptionGroup {
	label: string;
	items: SelectOption[];
}

@Component({
	selector: 'app-admin-spell-mechanics-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		Dialog,
		IconField,
		InputIcon,
		InputNumber,
		InputText,
		Select,
		TableModule,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Tag,
		Textarea,
		ToggleSwitch,
		Tooltip,
		TreeTableModule,
		EditorActionsBarComponent,
		MechanicCalculationGraphEditorComponent,
		NavigationTreeComponent
	],
	templateUrl: './admin-spell-mechanics-page.component.html',
	styleUrl: './admin-spell-mechanics-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminSpellMechanicsPageComponent {
	private readonly repository = inject(SPELL_MECHANICS_REPOSITORY);
	private readonly skillsRepository = inject(SKILLS_REPOSITORY);
	private readonly damageTypesRepository = inject(DAMAGE_TYPES_REPOSITORY);
	private readonly conditionsRepository = inject(CONDITIONS_REPOSITORY);
	private readonly valuesRepository = inject(VALUES_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Механики' }
	];
	protected readonly searchQuery = signal('');
	protected readonly categories = signal<SpellMechanicCategory[]>([]);
	protected readonly mechanics = signal<SpellMechanic[]>([]);
	protected readonly skills = signal<Skill[]>([]);
	protected readonly skillCategories = signal<SkillCategory[]>([]);
	protected readonly damageTypes = signal<DamageType[]>([]);
	protected readonly conditions = signal<Condition[]>([]);
	protected readonly systemValues = signal<SystemValue[]>([]);
	protected readonly selectedKind = signal<SelectionKind>('mechanic');
	protected readonly selectedCategoryId = signal<string | null>(null);
	protected readonly selectedMechanicId = signal<string | null>(null);
	protected readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());
	protected readonly categoryDraft = signal<CategoryDraft | null>(null);
	protected readonly mechanicDraft = signal<MechanicDraft | null>(null);
	protected readonly selectedSlotIndex = signal<number | null>(null);
	protected readonly selectedActionIndex = signal<number | null>(null);
	protected readonly selectedBranchAction =
		signal<BranchActionSelection | null>(null);
	protected readonly calculationGraphEditorVisible = signal(false);
	protected readonly slotKindOptions = SLOT_KIND_OPTIONS;
	protected readonly actionKindOptions = ACTION_KIND_OPTIONS;
	protected readonly valueChangeOperationOptions =
		VALUE_CHANGE_OPERATION_OPTIONS;
	protected readonly comparisonOperatorOptions = COMPARISON_OPERATOR_OPTIONS;
	protected readonly defaultValueModeOptions = DEFAULT_VALUE_MODE_OPTIONS;
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => this.currentDraftSignature() !== this.savedDraftSignature()
	);
	protected readonly selectedCategory = computed(() => {
		const id = this.selectedCategoryId();
		return id
			? (this.categories().find(category => category.id === id) ?? null)
			: null;
	});
	protected readonly selectedMechanic = computed(() => {
		const id = this.selectedMechanicId();
		return id
			? (this.mechanics().find(mechanic => mechanic.id === id) ?? null)
			: null;
	});
	protected readonly categoryOptions = computed(() =>
		this.categories()
			.filter(category => category.isActive)
			.sort(compareByOrderAndName)
			.map(category => ({ label: category.name, value: category.id }))
	);
	protected readonly skillOptionGroups = computed<SelectOptionGroup[]>(() =>
		createSkillOptionGroups(this.skillCategories(), this.skills())
	);
	protected readonly damageTypeOptionGroups = computed<SelectOptionGroup[]>(
		() =>
			createSingleOptionGroup(
				'Типы урона',
				this.damageTypes()
					.filter(damageType => damageType.isActive)
					.sort(compareByOrderAndName)
					.map(toSelectOption)
			)
	);
	protected readonly conditionOptionGroups = computed<SelectOptionGroup[]>(() =>
		createSingleOptionGroup(
			'Состояния',
			this.conditions()
				.filter(condition => condition.isActive)
				.sort(compareByOrderAndName)
				.map(toSelectOption)
		)
	);
	protected readonly systemValueOptionGroups = computed<SelectOptionGroup[]>(
		() => createSystemValueOptionGroups(this.systemValues())
	);
	protected readonly treeGroups = computed<NavigationTreeGroup[]>(() => {
		const query = this.searchQuery().trim().toLowerCase();

		return this.categories()
			.sort(compareByOrderAndName)
			.map(category => {
				const items = this.mechanics()
					.filter(mechanic => mechanic.categoryId === category.id)
					.filter(mechanic => {
						const haystack =
							`${mechanic.name} ${mechanic.description} ${category.name}`.toLowerCase();
						return !query || haystack.includes(query);
					})
					.sort(compareByOrderAndName)
					.map(mechanic => ({ id: mechanic.id, label: mechanic.name }));

				return {
					id: category.id,
					label: category.name,
					count: items.length,
					subgroups: [],
					items
				};
			})
			.filter(
				group =>
					!query ||
					group.items.length ||
					group.label.toLowerCase().includes(query)
			);
	});
	protected readonly title = computed(() => {
		if (this.selectedKind() === 'category') {
			const draft = this.categoryDraft();
			return draft?.id ? draft.name || 'Категория механик' : 'Новая категория';
		}

		const draft = this.mechanicDraft();
		return draft?.id ? draft.name || 'Механика' : 'Новая механика';
	});
	protected readonly mechanicSlots = computed(
		() => this.mechanicDraft()?.parameters ?? []
	);
	protected readonly selectedSlot = computed(() => {
		const index = this.selectedSlotIndex();

		if (index === null) {
			return null;
		}

		return this.mechanicSlots()[index] ?? null;
	});
	protected readonly mechanicActions = computed(
		() => this.mechanicDraft()?.actions ?? []
	);
	protected readonly scenarioTreeNodes = computed<
		Array<TreeNode<ScenarioTreeNodeData>>
	>(() =>
		createScenarioTreeNodes(this.mechanicActions())
	);
	protected readonly selectedAction = computed(() => {
		const branchSelection = this.selectedBranchAction();

		if (branchSelection) {
			const rootAction = this.mechanicActions()[branchSelection.rootIndex];
			const nestedAction = rootAction
				? findNestedActionByPath(rootAction, branchSelection.path)
				: null;

			return nestedAction ? nestedActionToDraft(nestedAction) : null;
		}

		const index = this.selectedActionIndex();

		if (index === null) {
			return null;
		}

		return this.mechanicActions()[index] ?? null;
	});
	protected readonly targetSourceOptionGroups = computed<SelectOptionGroup[]>(
		() => {
			const targetParameters = this.mechanicSlots()
				.filter(parameter => parameter.kind === 'target')
				.sort(compareByOrderAndName)
				.map(parameter => ({
					id: encodeSourceValue({
						kind: 'mechanicParameter',
						parameterId: parameter.id
					}),
					name: parameter.name || 'Цель',
					searchText: `${parameter.name} параметр цель`
				}));

			return [
				{
					label: 'Контекст',
					items: [
						{
							id: encodeSourceValue({ kind: 'spellTarget' }),
							name: 'Цель заклинания',
							searchText: 'цель заклинания'
						},
						{
							id: encodeSourceValue({ kind: 'caster' }),
							name: 'Кастер',
							searchText: 'кастер'
						}
					]
				},
				...createSingleOptionGroup('Параметры механики', targetParameters),
				...this.actionResultOptionGroups()
			];
		}
	);
	protected readonly amountSourceOptionGroups = computed<SelectOptionGroup[]>(
		() => {
			const numberParameters = this.mechanicSlots()
				.filter(
					parameter =>
						parameter.kind === 'number' || parameter.kind === 'formula'
				)
				.sort(compareByOrderAndName)
				.map(parameter => ({
					id: encodeSourceValue({
						kind: 'mechanicParameter',
						parameterId: parameter.id
					}),
					name: parameter.name || 'Параметр',
					searchText: `${parameter.name} параметр число формула`
				}));

			return [
				{
					label: 'Константа',
					items: [
						{
							id: encodeSourceValue({ kind: 'constant', value: 0 }),
							name: 'Число',
							searchText: 'число константа'
						}
					]
				},
				...createSingleOptionGroup('Параметры механики', numberParameters),
				...this.actionResultOptionGroups()
			];
		}
	);
	protected readonly skillSourceOptionGroups = computed<SelectOptionGroup[]>(
		() => {
			const skillParameters = this.mechanicSlots()
				.filter(parameter => parameter.kind === 'skill')
				.sort(compareByOrderAndName)
				.map(parameter => ({
					id: encodeSourceValue({
						kind: 'mechanicParameter',
						parameterId: parameter.id
					}),
					name: parameter.name || 'Навык',
					searchText: `${parameter.name} параметр навык`
				}));
			const staticSkillGroups = this.skillOptionGroups().map(group => ({
				label: group.label,
				items: group.items.map(skill => ({
					...skill,
					id: encodeSourceValue({
						kind: 'staticSkill',
						skillId: skill.id
					})
				}))
			}));

			return [
				{
					label: 'Сущность',
					items: [
						{
							id: encodeSourceValue({ kind: 'linkedMagicWordSkill' }),
							name: 'Связанный навык сущности',
							searchText: 'связанный навык сущности'
						}
					]
				},
				...createSingleOptionGroup('Параметры механики', skillParameters),
				...staticSkillGroups
			];
		}
	);
	protected readonly calculationSourceOptionGroups = computed<
		MechanicCalculationSourceGroup[]
	>(() => [
		...createSingleOptionGroup(
			'Параметры механики',
			this.mechanicSlots()
				.filter(
					parameter =>
						parameter.kind === 'number' || parameter.kind === 'formula'
				)
				.sort(compareByOrderAndName)
				.map(parameter => ({
					id: encodeSourceValue({
						kind: 'mechanicParameter',
						parameterId: parameter.id
					}),
					name: parameter.name || 'Параметр',
					searchText: `${parameter.name} параметр число формула`
				}))
		),
		...this.actionResultOptionGroups()
	]);
	protected readonly calculationSourceNames = computed(
		() =>
			new Map(
				this.calculationSourceOptionGroups()
					.flatMap(group => group.items)
					.map(item => [item.id, item.name] as const)
			)
	);

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectCategory(categoryId: string) {
		if (
			categoryId === this.selectedCategoryId() &&
			this.selectedKind() === 'category'
		) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const category = this.categories().find(item => item.id === categoryId);

				if (category) {
					this.setDraftFromCategory(category);
				}
			}
		});
	}

	protected selectMechanic(mechanicId: string) {
		if (
			mechanicId === this.selectedMechanicId() &&
			this.selectedKind() === 'mechanic'
		) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const mechanic = this.mechanics().find(item => item.id === mechanicId);

				if (mechanic) {
					this.setDraftFromMechanic(mechanic);
				}
			}
		});
	}

	protected toggleGroup(label: string) {
		this.collapsedGroups.update(collapsed => toggleSetValue(collapsed, label));
	}

	protected createCategory() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = createEmptyCategoryDraft();
				this.selectedKind.set('category');
				this.selectedCategoryId.set(null);
				this.selectedMechanicId.set(null);
				this.categoryDraft.set(draft);
				this.mechanicDraft.set(null);
				this.selectedSlotIndex.set(null);
				this.selectedActionIndex.set(null);
				this.selectedBranchAction.set(null);
				this.savedDraftSignature.set(this.currentDraftSignature());
			}
		});
	}

	protected createMechanic() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const categoryId =
					this.selectedCategoryId() ?? this.categories()[0]?.id ?? '';
				const draft = createEmptyMechanicDraft(categoryId);
				this.selectedKind.set('mechanic');
				this.selectedMechanicId.set(null);
				this.mechanicDraft.set(draft);
				this.categoryDraft.set(null);
				this.selectedSlotIndex.set(null);
				this.selectedActionIndex.set(null);
				this.selectedBranchAction.set(null);
				this.savedDraftSignature.set(this.currentDraftSignature());
			}
		});
	}

	protected updateCategoryName(name: string) {
		this.patchCategoryDraft({ name });
	}

	protected updateCategoryDescription(description: string) {
		this.patchCategoryDraft({ description });
	}

	protected updateCategorySortOrder(sortOrder: number | null) {
		this.patchCategoryDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateCategoryActive(isActive: boolean) {
		this.patchCategoryDraft({ isActive });
	}

	protected updateMechanicCategory(categoryId: string) {
		this.patchMechanicDraft({ categoryId });
		this.selectedCategoryId.set(categoryId);
	}

	protected updateMechanicName(name: string) {
		this.patchMechanicDraft({ name });
	}

	protected updateMechanicDescription(description: string) {
		this.patchMechanicDraft({ description });
	}

	protected updateMechanicConfigSchema(configSchemaText: string) {
		this.patchMechanicDraft({ configSchemaText });
	}

	protected addMechanicAction() {
		const draft = this.mechanicDraft();

		if (!draft) {
			return;
		}

		const actions = this.mechanicActions();
		const nextAction: MechanicActionDraft = {
			id: crypto.randomUUID(),
			mechanicId: draft.id ?? '',
			name: '',
			kind: 'custom',
			configText: stringifyConfigSchema({}),
			isActive: true,
			sortOrder: actions.length,
			createdAt: '',
			updatedAt: ''
		};

		this.setMechanicActions([...actions, nextAction]);
		this.selectedActionIndex.set(actions.length);
		this.selectedBranchAction.set(null);
	}

	protected selectMechanicAction(index: number) {
		this.selectedActionIndex.set(index);
		this.selectedBranchAction.set(null);
	}

	protected selectScenarioNode(data: ScenarioTreeNodeData) {
		if (data.kind !== 'action') {
			return;
		}

		this.selectedActionIndex.set(data.rootIndex);
		this.selectedBranchAction.set(
			data.path.length
				? {
						rootIndex: data.rootIndex,
						path: data.path
					}
				: null
		);
	}

	protected isScenarioNodeSelected(data: ScenarioTreeNodeData) {
		if (data.kind !== 'action') {
			return false;
		}

		const branchSelection = this.selectedBranchAction();

		if (data.path.length) {
			return (
				branchSelection?.rootIndex === data.rootIndex &&
				areBranchActionPathsEqual(branchSelection.path, data.path)
			);
		}

		return !branchSelection && this.selectedActionIndex() === data.rootIndex;
	}

	protected updateScenarioNodeActive(
		data: ScenarioTreeNodeData,
		isActive: boolean
	) {
		if (data.kind !== 'action') {
			return;
		}

		if (data.path.length) {
			this.updateNestedActionAt(data.rootIndex, data.path, { isActive });
			return;
		}

		this.updateMechanicAction(data.rootIndex, { isActive });
	}

	protected deleteScenarioNode(data: ScenarioTreeNodeData) {
		if (data.kind !== 'action') {
			return;
		}

		if (data.path.length) {
			this.deleteNestedActionAt(data.rootIndex, data.path);
			return;
		}

		this.deleteMechanicAction(data.rootIndex);
	}

	protected updateMechanicAction(
		index: number,
		patch: Partial<MechanicActionDraft>
	) {
		const draft = this.mechanicDraft();

		if (!draft) {
			return;
		}

		const actions = this.mechanicActions();

		if (!actions[index]) {
			return;
		}

		const nextActions = [...actions];
		nextActions[index] = { ...nextActions[index], ...patch };
		this.setMechanicActions(nextActions);
	}

	protected updateSelectedMechanicAction(
		patch: Partial<MechanicActionDraft>
	) {
		const branchSelection = this.selectedBranchAction();

		if (branchSelection) {
			this.updateSelectedBranchNestedAction(branchSelection, patch);
			return;
		}

		const index = this.selectedActionIndex();

		if (index === null) {
			return;
		}

		this.updateMechanicAction(index, patch);
	}

	protected updateSelectedMechanicActionKind(kind: SpellMechanicActionKind) {
		const configText =
			kind === 'roll'
				? stringifyConfigSchema({ resultName: 'Успехи' })
				: kind === 'comparison'
					? stringifyConfigSchema({
							operator: 'gt',
							resultName: 'Успешно',
							marginResultName: 'Разница'
						})
					: kind === 'calculation'
						? stringifyConfigSchema({ resultName: 'Значение', graph: null })
						: kind === 'branch'
							? stringifyConfigSchema({
									thenActions: [],
									elseActions: []
								})
				: kind === 'valueChange'
					? stringifyConfigSchema({ operation: 'decrease' })
					: kind === 'conditionAdd' || kind === 'conditionRemove'
						? stringifyConfigSchema({})
					: stringifyConfigSchema({});

		this.updateSelectedMechanicAction({ kind, configText });
	}

	protected updateSelectedRollActionConfig(patch: Partial<RollActionConfig>) {
		const action = this.selectedAction();

		if (!action) {
			return;
		}

		this.updateSelectedMechanicAction({
			configText: stringifyConfigSchema({
				...parseActionConfig(action),
				...patch
			})
		});
	}

	protected rollActorValue(action: MechanicActionDraft) {
		const config = parseRollActionConfig(action);
		return config.actor ? encodeSourceValue(config.actor) : null;
	}

	protected updateRollActor(value: string | null) {
		this.updateSelectedRollActionConfig({
			actor: value ? decodeTargetSourceValue(value) : undefined
		});
	}

	protected rollSkillValue(action: MechanicActionDraft) {
		const config = parseRollActionConfig(action);
		return config.skill ? encodeSourceValue(config.skill) : null;
	}

	protected updateRollSkill(value: string | null) {
		this.updateSelectedRollActionConfig({
			skill: value ? decodeSkillSourceValue(value) : undefined
		});
	}

	protected rollResultName(action: MechanicActionDraft) {
		return parseRollActionConfig(action).resultName ?? '';
	}

	protected updateRollResultName(resultName: string) {
		this.updateSelectedRollActionConfig({ resultName });
	}

	protected rollOptional(action: MechanicActionDraft) {
		return parseRollActionConfig(action).optional ?? false;
	}

	protected updateRollOptional(optional: boolean) {
		this.updateSelectedRollActionConfig({ optional });
	}

	protected updateSelectedComparisonActionConfig(
		patch: Partial<ComparisonActionConfig>
	) {
		const action = this.selectedAction();

		if (!action) {
			return;
		}

		this.updateSelectedMechanicAction({
			configText: stringifyConfigSchema({
				...parseActionConfig(action),
				...patch
			})
		});
	}

	protected comparisonLeftValue(action: MechanicActionDraft) {
		const config = parseComparisonActionConfig(action);
		return config.left ? encodeSourceValue(config.left) : null;
	}

	protected updateComparisonLeft(value: string | null) {
		this.updateSelectedComparisonActionConfig({
			left: value ? decodeAmountSourceValue(value) : undefined
		});
	}

	protected comparisonOperator(action: MechanicActionDraft) {
		return parseComparisonActionConfig(action).operator ?? 'gt';
	}

	protected updateComparisonOperator(operator: ComparisonOperator) {
		this.updateSelectedComparisonActionConfig({ operator });
	}

	protected comparisonRightValue(action: MechanicActionDraft) {
		const config = parseComparisonActionConfig(action);
		return config.right ? encodeSourceValue(config.right) : null;
	}

	protected updateComparisonRight(value: string | null) {
		this.updateSelectedComparisonActionConfig({
			right: value ? decodeAmountSourceValue(value) : undefined
		});
	}

	protected comparisonResultName(action: MechanicActionDraft) {
		return parseComparisonActionConfig(action).resultName ?? '';
	}

	protected updateComparisonResultName(resultName: string) {
		this.updateSelectedComparisonActionConfig({ resultName });
	}

	protected comparisonMarginResultName(action: MechanicActionDraft) {
		return parseComparisonActionConfig(action).marginResultName ?? '';
	}

	protected updateComparisonMarginResultName(marginResultName: string) {
		this.updateSelectedComparisonActionConfig({ marginResultName });
	}

	protected updateSelectedCalculationActionConfig(
		patch: Partial<CalculationActionConfig>
	) {
		const action = this.selectedAction();

		if (!action) {
			return;
		}

		this.updateSelectedMechanicAction({
			configText: stringifyConfigSchema({
				...parseActionConfig(action),
				...patch
			})
		});
	}

	protected calculationResultName(action: MechanicActionDraft) {
		return parseCalculationActionConfig(action).resultName ?? '';
	}

	protected updateCalculationResultName(resultName: string) {
		this.updateSelectedCalculationActionConfig({ resultName });
	}

	protected calculationGraph(action: MechanicActionDraft) {
		return parseCalculationActionConfig(action).graph ?? null;
	}

	protected updateCalculationGraph(graph: MechanicCalculationGraphState | null) {
		this.updateSelectedCalculationActionConfig({ graph });
	}

	protected calculationFormulaPreview(action: MechanicActionDraft) {
		return formatMechanicCalculationFormula(
			parseCalculationActionConfig(action).graph,
			this.calculationSourceNames()
		);
	}

	protected openCalculationGraphEditor() {
		this.calculationGraphEditorVisible.set(true);
	}

	protected closeCalculationGraphEditor() {
		this.calculationGraphEditorVisible.set(false);
	}

	protected updateSelectedBranchActionConfig(
		patch: Partial<BranchActionConfig>
	) {
		const action = this.selectedAction();

		if (!action) {
			return;
		}

		this.updateSelectedMechanicAction({
			configText: stringifyConfigSchema({
				...parseActionConfig(action),
				...patch
			})
		});
	}

	protected branchConditionValue(action: MechanicActionDraft) {
		const config = parseBranchActionConfig(action);
		return config.condition ? encodeSourceValue(config.condition) : null;
	}

	protected updateBranchCondition(value: string | null) {
		this.updateSelectedBranchActionConfig({
			condition: value ? decodeAmountSourceValue(value) : undefined
		});
	}

	protected branchActions(
		action: MechanicActionDraft,
		branchName: BranchName
	) {
		return parseBranchActionConfig(action)[branchName] ?? [];
	}

	protected addBranchAction(branchName: BranchName) {
		const action = this.selectedAction();

		if (!action) {
			return;
		}

		const config = parseBranchActionConfig(action);
		const actions = config[branchName] ?? [];
		const nextAction = createNestedMechanicAction(actions.length);

		this.updateSelectedBranchActionConfig({
			[branchName]: [...actions, nextAction]
		});
	}

	protected addBranchActionAt(
		rootIndex: number,
		parentPath: BranchActionPathSegment[],
		branchName: BranchName
	) {
		const rootAction = this.mechanicActions()[rootIndex];

		if (!rootAction) {
			return;
		}

		const parentAction = parentPath.length
			? findNestedActionByPath(rootAction, parentPath)
			: rootAction;

		if (!parentAction) {
			return;
		}

		const config = readBranchConfig(parentAction);
		const actions = config[branchName] ?? [];
		const nextAction = createNestedMechanicAction(actions.length);
		const nextPath = [...parentPath, { branchName, actionId: nextAction.id }];

		this.updateBranchActionsAt(rootIndex, parentPath, branchName, [
			...actions,
			nextAction
		]);
		this.selectedActionIndex.set(rootIndex);
		this.selectedBranchAction.set({
			rootIndex,
			path: nextPath
		});
	}

	protected updateBranchAction(
		branchName: BranchName,
		actionId: string,
		patch: Partial<NestedMechanicActionDraft>
	) {
		const action = this.selectedAction();

		if (!action) {
			return;
		}

		const config = parseBranchActionConfig(action);
		const actions = config[branchName] ?? [];

		this.updateSelectedBranchActionConfig({
			[branchName]: actions.map(item =>
				item.id === actionId ? { ...item, ...patch } : item
			)
		});
	}

	private updateSelectedBranchNestedAction(
		selection: BranchActionSelection,
		patch: Partial<MechanicActionDraft>
	) {
		this.updateNestedActionAt(selection.rootIndex, selection.path, patch);
	}

	protected updateBranchActionKind(
		branchName: BranchName,
		actionId: string,
		kind: SpellMechanicActionKind
	) {
		this.updateBranchAction(branchName, actionId, {
			kind,
			config: defaultActionConfig(kind)
		});
	}

	protected deleteBranchAction(branchName: BranchName, actionId: string) {
		const action = this.selectedAction();

		if (!action) {
			return;
		}

		const config = parseBranchActionConfig(action);
		const actions = config[branchName] ?? [];

		this.updateSelectedBranchActionConfig({
			[branchName]: actions
				.filter(item => item.id !== actionId)
				.map((item, index) => ({ ...item, sortOrder: index }))
		});
	}

	private updateNestedActionAt(
		rootIndex: number,
		path: BranchActionPathSegment[],
		patch: Partial<MechanicActionDraft> | Partial<NestedMechanicActionDraft>
	) {
		const rootAction = this.mechanicActions()[rootIndex];

		if (!rootAction) {
			return;
		}

		const nextRootAction = updateNestedActionByPath(rootAction, path, action => {
			const nextConfig =
				'configText' in patch && patch.configText !== undefined
					? (parseConfigSchema(patch.configText) ?? action.config)
					: 'config' in patch && patch.config !== undefined
						? patch.config
						: action.config;

			return {
				...action,
				...('name' in patch && patch.name !== undefined
					? { name: patch.name }
					: {}),
				...('kind' in patch && patch.kind !== undefined
					? { kind: patch.kind }
					: {}),
				...('isActive' in patch && patch.isActive !== undefined
					? { isActive: patch.isActive }
					: {}),
				...('sortOrder' in patch && patch.sortOrder !== undefined
					? { sortOrder: patch.sortOrder }
					: {}),
				config: nextConfig
			};
		});

		this.updateMechanicAction(rootIndex, {
			configText: nextRootAction.configText
		});
	}

	private deleteNestedActionAt(
		rootIndex: number,
		path: BranchActionPathSegment[]
	) {
		const rootAction = this.mechanicActions()[rootIndex];
		const parentPath = path.slice(0, -1);
		const target = path[path.length - 1];

		if (!rootAction || !target) {
			return;
		}

		const parentAction = parentPath.length
			? findNestedActionByPath(rootAction, parentPath)
			: rootAction;

		if (!parentAction) {
			return;
		}

		const config = readBranchConfig(parentAction);
		const actions = config[target.branchName] ?? [];
		this.updateBranchActionsAt(
			rootIndex,
			parentPath,
			target.branchName,
			actions
				.filter(item => item.id !== target.actionId)
				.map((item, index) => ({ ...item, sortOrder: index }))
		);

		const selected = this.selectedBranchAction();
		if (selected?.rootIndex === rootIndex && isPathPrefix(path, selected.path)) {
			this.selectedBranchAction.set(null);
			this.selectedActionIndex.set(rootIndex);
		}
	}

	private updateBranchActionsAt(
		rootIndex: number,
		parentPath: BranchActionPathSegment[],
		branchName: BranchName,
		actions: NestedMechanicActionDraft[]
	) {
		const rootAction = this.mechanicActions()[rootIndex];

		if (!rootAction) {
			return;
		}

		if (!parentPath.length) {
			this.updateMechanicAction(rootIndex, {
				configText: stringifyConfigSchema({
					...parseActionConfig(rootAction),
					[branchName]: actions
				})
			});
			return;
		}

		const nextRootAction = updateNestedActionByPath(
			rootAction,
			parentPath,
			parentAction => ({
				...parentAction,
				config: {
					...parentAction.config,
					[branchName]: actions
				}
			})
		);

		this.updateMechanicAction(rootIndex, {
			configText: nextRootAction.configText
		});
	}

	protected updateSelectedMechanicActionConfig(
		patch: Partial<ValueChangeActionConfig>
	) {
		const action = this.selectedAction();

		if (!action) {
			return;
		}

		this.updateSelectedMechanicAction({
			configText: stringifyConfigSchema({
				...parseActionConfig(action),
				...patch
			})
		});
	}

	protected valueChangeTargetValue(action: MechanicActionDraft) {
		const config = parseValueChangeActionConfig(action);
		return config.target ? encodeSourceValue(config.target) : null;
	}

	protected updateValueChangeTarget(value: string | null) {
		this.updateSelectedMechanicActionConfig({
			target: value ? decodeTargetSourceValue(value) : undefined
		});
	}

	protected valueChangeSystemValueId(action: MechanicActionDraft) {
		return parseValueChangeActionConfig(action).systemValueId ?? null;
	}

	protected updateValueChangeSystemValue(systemValueId: string | null) {
		this.updateSelectedMechanicActionConfig({
			systemValueId: systemValueId ?? undefined
		});
	}

	protected valueChangeOperation(action: MechanicActionDraft) {
		return parseValueChangeActionConfig(action).operation ?? 'decrease';
	}

	protected updateValueChangeOperation(operation: ValueChangeOperation) {
		this.updateSelectedMechanicActionConfig({ operation });
	}

	protected valueChangeAmountValue(action: MechanicActionDraft) {
		const config = parseValueChangeActionConfig(action);
		return config.amount ? encodeSourceValue(config.amount) : null;
	}

	protected updateValueChangeAmount(value: string | null) {
		this.updateSelectedMechanicActionConfig({
			amount: value ? decodeAmountSourceValue(value) : undefined
		});
	}

	protected valueChangeConstantAmount(action: MechanicActionDraft) {
		const amount = parseValueChangeActionConfig(action).amount;
		return amount?.kind === 'constant' ? amount.value : 0;
	}

	protected updateValueChangeConstantAmount(value: number | null) {
		const action = this.selectedAction();
		const amount = action ? parseValueChangeActionConfig(action).amount : null;

		if (amount?.kind !== 'constant') {
			return;
		}

		this.updateSelectedMechanicActionConfig({
			amount: { ...amount, value: value ?? 0 }
		});
	}

	protected usesConstantAmount(action: MechanicActionDraft) {
		return parseValueChangeActionConfig(action).amount?.kind === 'constant';
	}

	protected updateSelectedConditionActionConfig(
		patch: Partial<ConditionActionConfig>
	) {
		const action = this.selectedAction();

		if (!action) {
			return;
		}

		this.updateSelectedMechanicAction({
			configText: stringifyConfigSchema({
				...parseActionConfig(action),
				...patch
			})
		});
	}

	protected conditionActionTargetValue(action: MechanicActionDraft) {
		const config = parseConditionActionConfig(action);
		return config.target ? encodeSourceValue(config.target) : null;
	}

	protected updateConditionActionTarget(value: string | null) {
		this.updateSelectedConditionActionConfig({
			target: value ? decodeTargetSourceValue(value) : undefined
		});
	}

	protected conditionActionConditionId(action: MechanicActionDraft) {
		return parseConditionActionConfig(action).conditionId ?? null;
	}

	protected updateConditionActionCondition(conditionId: string | null) {
		this.updateSelectedConditionActionConfig({
			conditionId: conditionId ?? undefined
		});
	}

	protected conditionActionSourceValue(action: MechanicActionDraft) {
		const config = parseConditionActionConfig(action);
		return config.source ? encodeSourceValue(config.source) : null;
	}

	protected updateConditionActionSource(value: string | null) {
		this.updateSelectedConditionActionConfig({
			source: value ? decodeTargetSourceValue(value) : undefined
		});
	}

	protected conditionActionDurationValue(action: MechanicActionDraft) {
		const config = parseConditionActionConfig(action);
		return config.duration ? encodeSourceValue(config.duration) : null;
	}

	protected updateConditionActionDuration(value: string | null) {
		this.updateSelectedConditionActionConfig({
			duration: value ? decodeAmountSourceValue(value) : undefined
		});
	}

	protected deleteMechanicAction(index: number) {
		const draft = this.mechanicDraft();

		if (!draft) {
			return;
		}

		const selectedBranch = this.selectedBranchAction();
		const nextActions = this.mechanicActions().filter(
			(_, actionIndex) => actionIndex !== index
		);
		this.setMechanicActions(nextActions);
		if (selectedBranch?.rootIndex === index) {
			this.selectedBranchAction.set(null);
		} else if (selectedBranch && selectedBranch.rootIndex > index) {
			this.selectedBranchAction.set({
				...selectedBranch,
				rootIndex: selectedBranch.rootIndex - 1
			});
		}
		this.selectedActionIndex.update(selectedIndex => {
			if (selectedIndex === null) {
				return nextActions.length ? 0 : null;
			}

			if (selectedIndex === index) {
				return nextActions[index]
					? index
					: nextActions.length - 1 >= 0
						? nextActions.length - 1
						: null;
			}

			if (selectedIndex > index) {
				return selectedIndex - 1;
			}

			return selectedIndex;
		});
	}

	protected addMechanicSlot() {
		const draft = this.mechanicDraft();

		if (!draft) {
			return;
		}

		const slots = this.mechanicSlots();
		const nextSlot: SpellMechanicParameter = {
			id: crypto.randomUUID(),
			mechanicId: draft.id ?? '',
			name: '',
			kind: 'target',
			required: true,
			configuredBySpell: true,
			overrideAllowed: false,
			defaultValue: createEmptyDefaultValue(),
			sortOrder: slots.length,
			createdAt: '',
			updatedAt: ''
		};

		this.setMechanicSlots([...slots, nextSlot]);
		this.selectedSlotIndex.set(slots.length);
	}

	protected selectMechanicSlot(index: number) {
		this.selectedSlotIndex.set(index);
	}

	protected updateMechanicSlot(
		index: number,
		patch: Partial<SpellMechanicParameter>
	) {
		const draft = this.mechanicDraft();

		if (!draft) {
			return;
		}

		const slots = this.mechanicSlots();

		if (!slots[index]) {
			return;
		}

		const nextSlots = [...slots];
		nextSlots[index] = { ...nextSlots[index], ...patch };
		this.setMechanicSlots(nextSlots);
	}

	protected updateMechanicSlotKind(index: number, kind: SpellMechanicParameterKind) {
		this.updateMechanicSlot(index, {
			kind,
			defaultValue: createEmptyDefaultValue()
		});
	}

	protected updateSelectedMechanicSlot(
		patch: Partial<SpellMechanicParameter>
	) {
		const index = this.selectedSlotIndex();

		if (index === null) {
			return;
		}

		this.updateMechanicSlot(index, patch);
	}

	protected updateSelectedMechanicSlotKind(kind: SpellMechanicParameterKind) {
		const index = this.selectedSlotIndex();

		if (index === null) {
			return;
		}

		this.updateMechanicSlotKind(index, kind);
	}

	protected updateMechanicSlotDefaultValueMode(
		index: number,
		mode: SpellMechanicParameterDefaultValueMode
	) {
		this.updateMechanicSlot(index, { defaultValue: { mode, value: '' } });
	}

	protected updateSelectedMechanicSlotDefaultValueMode(
		mode: SpellMechanicParameterDefaultValueMode
	) {
		const index = this.selectedSlotIndex();

		if (index === null) {
			return;
		}

		this.updateMechanicSlotDefaultValueMode(index, mode);
	}

	protected updateMechanicSlotDefaultValue(
		index: number,
		value: string | null
	) {
		const draft = this.mechanicDraft();

		if (!draft) {
			return;
		}

		const slot = this.mechanicSlots()[index];

		if (!slot) {
			return;
		}

		this.updateMechanicSlot(index, {
			defaultValue: { ...slot.defaultValue, value: value ?? '' }
		});
	}

	protected updateSelectedMechanicSlotDefaultValue(value: string | null) {
		const index = this.selectedSlotIndex();

		if (index === null) {
			return;
		}

		this.updateMechanicSlotDefaultValue(index, value);
	}

	protected slotDefaultValueOptions(
		kind: SpellMechanicParameterKind
	): SelectOptionGroup[] {
		if (kind === 'skill') {
			return this.skillOptionGroups();
		}

		if (kind === 'damageType') {
			return this.damageTypeOptionGroups();
		}

		if (kind === 'condition') {
			return this.conditionOptionGroups();
		}

		if (kind === 'systemValue') {
			return this.systemValueOptionGroups();
		}

		return [];
	}

	protected usesDefaultValueSelect(kind: SpellMechanicParameterKind) {
		return (
			kind === 'skill' ||
			kind === 'damageType' ||
			kind === 'condition' ||
			kind === 'systemValue'
		);
	}

	protected supportsDefaultValue(kind: SpellMechanicParameterKind) {
		return kind !== 'target';
	}

	protected slotDefaultValueModeOptions(kind: SpellMechanicParameterKind) {
		return DEFAULT_VALUE_MODE_OPTIONS.filter(option =>
			isDefaultValueModeAllowedForKind(option.value, kind)
		);
	}

	protected slotDefaultValueLabel(kind: SpellMechanicParameterKind) {
		if (kind === 'skill') {
			return 'Навык по умолчанию';
		}

		if (kind === 'damageType') {
			return 'Тип урона по умолчанию';
		}

		if (kind === 'condition') {
			return 'Состояние по умолчанию';
		}

		if (kind === 'systemValue') {
			return 'Значение по умолчанию';
		}

		if (kind === 'number') {
			return 'Число по умолчанию';
		}

		if (kind === 'formula') {
			return 'Формула по умолчанию';
		}

		return 'Текст по умолчанию';
	}

	protected deleteMechanicSlot(index: number) {
		const draft = this.mechanicDraft();

		if (!draft) {
			return;
		}

		const nextSlots = this.mechanicSlots().filter(
			(_, slotIndex) => slotIndex !== index
		);
		this.setMechanicSlots(nextSlots);
		this.selectedSlotIndex.update(selectedIndex => {
			if (selectedIndex === null) {
				return nextSlots.length ? 0 : null;
			}

			if (selectedIndex === index) {
				return nextSlots[index]
					? index
					: nextSlots.length - 1 >= 0
						? nextSlots.length - 1
						: null;
			}

			if (selectedIndex > index) {
				return selectedIndex - 1;
			}

			return selectedIndex;
		});
	}

	protected slotKindLabel(kind: SpellMechanicParameterKind) {
		return (
			SLOT_KIND_OPTIONS.find(option => option.value === kind)?.label ?? kind
		);
	}

	protected actionKindLabel(kind: SpellMechanicActionKind) {
		return (
			ACTION_KIND_OPTIONS.find(option => option.value === kind)?.label ?? kind
		);
	}

	protected actionResultOptionGroups(): SelectOptionGroup[] {
		const selectedIndex = this.selectedActionIndex();

		if (selectedIndex === null) {
			return [];
		}

		const branchSelection = this.selectedBranchAction();
		const previousRootActions = this.mechanicActions().slice(0, selectedIndex);
		const rootAction = this.mechanicActions()[selectedIndex];
		const previousBranchActions =
			branchSelection && rootAction
				? collectPreviousNestedActions(rootAction, branchSelection.path)
				: [];

		const results = [
			...previousRootActions,
			...previousBranchActions.map(nestedActionToDraft)
		]
			.flatMap(action =>
				findActionResultNames(action).map(resultName => ({
					id: encodeSourceValue({
						kind: 'actionResult',
						actionId: action.id,
						resultName
					}),
					name: `${action.name || 'Действие'}: ${resultName}`,
					searchText: `${action.name} ${resultName} результат действия`
				}))
			);

		return createSingleOptionGroup('Результаты предыдущих действий', results);
	}

	protected slotDefaultValueModeLabel(slot: SpellMechanicParameter) {
		if (!this.supportsDefaultValue(slot.kind)) {
			return 'Не применяется';
		}

		return (
			DEFAULT_VALUE_MODE_OPTIONS.find(
				option => option.value === slot.defaultValue.mode
			)?.label ?? slot.defaultValue.mode
		);
	}

	protected slotDefaultValueDisplay(slot: SpellMechanicParameter) {
		if (!this.supportsDefaultValue(slot.kind)) {
			return 'Не применяется';
		}

		if (slot.defaultValue.mode === 'empty') {
			return 'Пусто';
		}

		if (slot.defaultValue.mode === 'fromMagicWord') {
			return 'Из сущности';
		}

		if (!slot.defaultValue.value) {
			return 'Не выбрано';
		}

		if (this.usesDefaultValueSelect(slot.kind)) {
			return (
				this.findSelectOptionName(slot.kind, slot.defaultValue.value) ??
				'Не найдено'
			);
		}

		return slot.defaultValue.value;
	}

	protected updateMechanicTextTemplate(textTemplate: string) {
		this.patchMechanicDraft({ textTemplate });
	}

	protected updateMechanicSortOrder(sortOrder: number | null) {
		this.patchMechanicDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateMechanicActive(isActive: boolean) {
		this.patchMechanicDraft({ isActive });
	}

	protected resetDraft() {
		if (this.selectedKind() === 'category') {
			const category = this.selectedCategory();

			if (category) {
				this.setDraftFromCategory(category);
				return;
			}

			const draft = createEmptyCategoryDraft();
			this.categoryDraft.set(draft);
			this.savedDraftSignature.set(this.currentDraftSignature());
			return;
		}

		const mechanic = this.selectedMechanic();

		if (mechanic) {
			this.setDraftFromMechanic(mechanic);
			return;
		}

		const draft = createEmptyMechanicDraft(
			this.selectedCategoryId() ?? this.categories()[0]?.id ?? ''
		);
		this.mechanicDraft.set(draft);
		this.selectedSlotIndex.set(null);
		this.selectedActionIndex.set(null);
		this.selectedBranchAction.set(null);
		this.savedDraftSignature.set(this.currentDraftSignature());
	}

	protected saveDraft() {
		if (!this.hasChanges() || this.saving()) {
			return;
		}

		if (this.selectedKind() === 'category') {
			this.saveCategoryDraft();
			return;
		}

		this.saveMechanicDraft();
	}

	protected deleteSelected() {
		if (this.selectedKind() === 'category') {
			this.deleteSelectedCategory();
			return;
		}

		this.deleteSelectedMechanic();
	}

	private loadCatalog() {
		this.loading.set(true);
		this.errorMessage.set(null);

		forkJoin({
			mechanics: this.repository.loadCatalog(),
			skills: this.skillsRepository.loadAdminCatalog(),
			damageTypes: this.damageTypesRepository.loadCatalog(),
			conditions: this.conditionsRepository.loadCatalog(),
			systemValues: of({ values: [] as SystemValue[] })
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: ({
					mechanics,
					skills,
					damageTypes,
					conditions,
					systemValues
				}) => {
					this.categories.set(mechanics.categories);
					this.mechanics.set(mechanics.mechanics);
					this.skills.set(skills.skills);
					this.skillCategories.set(skills.categories);
					this.damageTypes.set(damageTypes.damageTypes);
					this.conditions.set(conditions.conditions);
					this.systemValues.set(systemValues.values);
					this.loading.set(false);
					this.selectFirstItem();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить механики.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectFirstItem() {
		const mechanic = [...this.mechanics()].sort(compareByOrderAndName)[0];

		if (mechanic) {
			this.setDraftFromMechanic(mechanic);
			return;
		}

		const category = [...this.categories()].sort(compareByOrderAndName)[0];

		if (category) {
			this.setDraftFromCategory(category);
		}
	}

	private saveCategoryDraft() {
		const draft = this.categoryDraft();

		if (!draft) {
			return;
		}

		const name = draft.name.trim();

		if (!name) {
			this.errorMessage.set('Название категории обязательно.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			description: draft.description.trim(),
			isActive: draft.isActive,
			sortOrder: draft.sortOrder
		};
		const request = draft.id
			? this.repository.updateCategory(draft.id, command)
			: this.repository.createCategory(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertCategory(saved);
				this.setDraftFromCategory(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить категорию.'
				);
				this.saving.set(false);
			}
		});
	}

	private saveMechanicDraft() {
		const draft = this.mechanicDraft();

		if (!draft) {
			return;
		}

		const name = draft.name.trim();

		if (!name) {
			this.errorMessage.set('Название механики обязательно.');
			return;
		}

		if (!draft.categoryId) {
			this.errorMessage.set('Категория механики обязательна.');
			return;
		}

		const configSchema = parseConfigSchema(draft.configSchemaText);

		if (!configSchema) {
			this.errorMessage.set(
				'Схема конфигурации должна быть валидным JSON-объектом.'
			);
			return;
		}

		const actions = draft.actions.map(action => {
			const config = parseConfigSchema(action.configText);

			if (!config) {
				return null;
			}

			return {
				id: action.id,
				name: action.name,
				kind: action.kind,
				config,
				isActive: action.isActive,
				sortOrder: action.sortOrder
			};
		});

		if (actions.some(action => action === null)) {
			this.errorMessage.set(
				'Конфигурация действия должна быть валидным JSON-объектом.'
			);
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			categoryId: draft.categoryId,
			name,
			description: draft.description.trim(),
			configSchema,
			textTemplate: draft.textTemplate.trim(),
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			parameters: draft.parameters.map(
				({ mechanicId, createdAt, updatedAt, ...parameter }) => parameter
			),
			actions: actions.filter(action => action !== null)
		};
		const request = draft.id
			? this.repository.updateMechanic(draft.id, command)
			: this.repository.createMechanic(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertMechanic(saved);
				this.setDraftFromMechanic(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить механику.'
				);
				this.saving.set(false);
			}
		});
	}

	private deleteSelectedCategory() {
		const draft = this.categoryDraft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить категорию?',
			message: `«${draft.name}» будет удалена. Если в категории есть механики, база не позволит удалить её.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteCategory(draft.id as string)
		});
	}

	private deleteSelectedMechanic() {
		const draft = this.mechanicDraft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить механику?',
			message: `«${draft.name}» будет удалена из списка механик.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteMechanic(draft.id as string)
		});
	}

	private deleteCategory(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deleteCategory(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.categories.update(items => items.filter(item => item.id !== id));
					this.saving.set(false);
					this.selectFirstItem();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось удалить категорию.'
					);
					this.saving.set(false);
				}
			});
	}

	private deleteMechanic(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deleteMechanic(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.mechanics.update(items => items.filter(item => item.id !== id));
					this.saving.set(false);
					this.selectFirstItem();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось удалить механику.'
					);
					this.saving.set(false);
				}
			});
	}

	private setDraftFromCategory(category: SpellMechanicCategory) {
		const draft: CategoryDraft = {
			id: category.id,
			name: category.name,
			description: category.description,
			isActive: category.isActive,
			sortOrder: category.sortOrder
		};

		this.selectedKind.set('category');
		this.selectedCategoryId.set(category.id);
		this.selectedMechanicId.set(null);
		this.categoryDraft.set(draft);
		this.mechanicDraft.set(null);
		this.selectedSlotIndex.set(null);
		this.selectedActionIndex.set(null);
		this.selectedBranchAction.set(null);
		this.savedDraftSignature.set(this.currentDraftSignature());
		this.loadSystemValues();
	}

	private setDraftFromMechanic(mechanic: SpellMechanic) {
		const draft: MechanicDraft = {
			id: mechanic.id,
			categoryId: mechanic.categoryId,
			name: mechanic.name,
			description: mechanic.description,
			configSchemaText: stringifyConfigSchema(mechanic.configSchema),
			textTemplate: mechanic.textTemplate,
			parameters: mechanic.parameters,
			actions: mechanic.actions.map(action => ({
				...action,
				configText: stringifyConfigSchema(action.config)
			})),
			isActive: mechanic.isActive,
			sortOrder: mechanic.sortOrder
		};

		this.selectedKind.set('mechanic');
		this.selectedCategoryId.set(mechanic.categoryId);
		this.selectedMechanicId.set(mechanic.id);
		this.mechanicDraft.set(draft);
		this.categoryDraft.set(null);
		this.selectedSlotIndex.set(this.mechanicSlots().length ? 0 : null);
		this.selectedActionIndex.set(this.mechanicActions().length ? 0 : null);
		this.selectedBranchAction.set(null);
		this.savedDraftSignature.set(this.currentDraftSignature());
		this.loadSystemValues();
	}

	private patchCategoryDraft(patch: Partial<CategoryDraft>) {
		this.categoryDraft.update(draft =>
			draft ? { ...draft, ...patch } : draft
		);
	}

	private patchMechanicDraft(patch: Partial<MechanicDraft>) {
		this.mechanicDraft.update(draft =>
			draft ? { ...draft, ...patch } : draft
		);
	}

	private setMechanicSlots(slots: SpellMechanicParameter[]) {
		const draft = this.mechanicDraft();

		if (!draft) {
			return;
		}

		this.patchMechanicDraft({
			parameters: slots.map((slot, index) => ({ ...slot, sortOrder: index }))
		});
	}

	private setMechanicActions(actions: MechanicActionDraft[]) {
		const draft = this.mechanicDraft();

		if (!draft) {
			return;
		}

		this.patchMechanicDraft({
			actions: actions.map((action, index) => ({
				...action,
				sortOrder: index
			}))
		});
	}

	private upsertCategory(category: SpellMechanicCategory) {
		this.categories.update(items => upsertById(items, category));
	}

	private upsertMechanic(mechanic: SpellMechanic) {
		this.mechanics.update(items => upsertById(items, mechanic));
	}

	private findSelectOptionName(kind: SpellMechanicParameterKind, id: string) {
		return this.slotDefaultValueOptions(kind)
			.flatMap(group => group.items)
			.find(option => option.id === id)?.name;
	}

	private loadSystemValues() {
		if (this.systemValues().length) {
			return;
		}

		this.valuesRepository
			.loadCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => this.systemValues.set(catalog.values),
				error: () => this.systemValues.set([])
			});
	}

	private currentDraftSignature() {
		return JSON.stringify({
			kind: this.selectedKind(),
			category: this.categoryDraft(),
			mechanic: this.mechanicDraft()
		});
	}
}

function createEmptyCategoryDraft(): CategoryDraft {
	return {
		id: null,
		name: '',
		description: '',
		isActive: true,
		sortOrder: 0
	};
}

function createEmptyMechanicDraft(categoryId: string): MechanicDraft {
	return {
		id: null,
		categoryId,
		name: '',
		description: '',
			configSchemaText: stringifyConfigSchema({}),
		textTemplate: '',
		parameters: [],
		actions: [],
		isActive: true,
		sortOrder: 0
	};
}

function createEmptyDefaultValue(): SpellMechanicParameterDefaultValue {
	return {
		mode: 'empty',
		value: ''
	};
}

function compareByOrderAndName<T extends { sortOrder: number; name: string }>(
	first: T,
	second: T
) {
	const orderDiff = first.sortOrder - second.sortOrder;
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}

function compareByName<T extends { name: string }>(first: T, second: T) {
	return first.name.localeCompare(second.name, 'ru');
}

function toSelectOption(item: { id: string; name: string }): SelectOption {
	return {
		id: item.id,
		name: item.name,
		searchText: item.name
	};
}

function createSkillOptionGroups(
	categories: SkillCategory[],
	skills: Skill[]
): SelectOptionGroup[] {
	const activeSkills = skills.filter(skill => skill.isActive);
	const activeCategoryIds = new Set(
		categories
			.filter(category => category.isActive)
			.map(category => category.id)
	);
	const groups = categories
		.filter(category => category.isActive)
		.sort(compareByName)
		.map(category => ({
			label: category.name,
			items: activeSkills
				.filter(skill => skill.categoryId === category.id)
				.sort(compareByName)
				.map(skill => ({
					id: skill.id,
					name: skill.name,
					searchText: `${skill.name} ${category.name}`
				}))
		}))
		.filter(group => group.items.length > 0);
	const uncategorized = activeSkills
		.filter(skill => !activeCategoryIds.has(skill.categoryId))
		.sort(compareByName)
		.map(skill => ({
			id: skill.id,
			name: skill.name,
			searchText: `${skill.name} Без категории`
		}));

	return uncategorized.length
		? [...groups, { label: 'Без категории', items: uncategorized }]
		: groups;
}

function createSystemValueOptionGroups(
	values: SystemValue[]
): SelectOptionGroup[] {
	const groupsByLabel = new Map<string, SystemValue[]>();

	for (const value of values) {
		const label = value.displaySection || value.groupLabel || 'Значения';
		groupsByLabel.set(label, [...(groupsByLabel.get(label) ?? []), value]);
	}

	return [...groupsByLabel.entries()]
		.sort(([first], [second]) => first.localeCompare(second, 'ru'))
		.map(([label, groupValues]) => ({
			label,
			items: groupValues.sort(compareByName).map(value => ({
				id: value.id,
				name: value.name,
				searchText: `${value.name} ${value.contextLabel} ${label}`
			}))
		}))
		.filter(group => group.items.length > 0);
}

function createSingleOptionGroup(
	label: string,
	items: SelectOption[]
): SelectOptionGroup[] {
	return items.length ? [{ label, items }] : [];
}

function stringifyConfigSchema(configSchema: SpellMechanicConfigSchema) {
	return JSON.stringify(configSchema, null, 2);
}

function parseConfigSchema(value: string): SpellMechanicConfigSchema | null {
	try {
		const parsed: unknown = JSON.parse(value || '{}');
		return isRecord(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function parseActionConfig(action: MechanicActionDraft): SpellMechanicConfigSchema {
	return parseConfigSchema(action.configText) ?? {};
}

function parseRollActionConfig(action: MechanicActionDraft): RollActionConfig {
	const config = parseActionConfig(action);
	return {
		...config,
		actor: isActionTargetSource(config['actor'])
			? config['actor']
			: undefined,
		skill: isActionSkillSource(config['skill'])
			? config['skill']
			: undefined,
		resultName:
			typeof config['resultName'] === 'string'
				? config['resultName']
				: undefined,
		optional:
			typeof config['optional'] === 'boolean'
				? config['optional']
				: undefined
	};
}

function parseComparisonActionConfig(
	action: MechanicActionDraft
): ComparisonActionConfig {
	const config = parseActionConfig(action);
	return {
		...config,
		left: isActionAmountSource(config['left']) ? config['left'] : undefined,
		operator: isComparisonOperator(config['operator'])
			? config['operator']
			: undefined,
		right: isActionAmountSource(config['right']) ? config['right'] : undefined,
		resultName:
			typeof config['resultName'] === 'string'
				? config['resultName']
				: undefined,
		marginResultName:
			typeof config['marginResultName'] === 'string'
				? config['marginResultName']
				: undefined
	};
}

function parseCalculationActionConfig(
	action: MechanicActionDraft
): CalculationActionConfig {
	const config = parseActionConfig(action);
	return {
		...config,
		graph: isMechanicCalculationGraph(config['graph'])
			? config['graph']
			: null,
		resultName:
			typeof config['resultName'] === 'string'
				? config['resultName']
				: undefined
	};
}

function parseBranchActionConfig(action: MechanicActionDraft): BranchActionConfig {
	const config = parseActionConfig(action);
	return {
		...config,
		condition: isActionAmountSource(config['condition'])
			? config['condition']
			: undefined,
		thenActions: parseNestedActions(config['thenActions']),
		elseActions: parseNestedActions(config['elseActions'])
	};
}

function parseValueChangeActionConfig(
	action: MechanicActionDraft
): ValueChangeActionConfig {
	const config = parseActionConfig(action);
	return {
		...config,
		target: isActionTargetSource(config['target'])
			? config['target']
			: undefined,
		systemValueId:
			typeof config['systemValueId'] === 'string'
				? config['systemValueId']
				: undefined,
		operation: isValueChangeOperation(config['operation'])
			? config['operation']
			: undefined,
		amount: isActionAmountSource(config['amount'])
			? config['amount']
			: undefined
	};
}

function parseConditionActionConfig(
	action: MechanicActionDraft
): ConditionActionConfig {
	const config = parseActionConfig(action);
	return {
		...config,
		target: isActionTargetSource(config['target'])
			? config['target']
			: undefined,
		conditionId:
			typeof config['conditionId'] === 'string'
				? config['conditionId']
				: undefined,
		source: isActionTargetSource(config['source'])
			? config['source']
			: undefined,
		duration: isActionAmountSource(config['duration'])
			? config['duration']
			: undefined,
	};
}

function encodeSourceValue(
	source: ActionTargetSource | ActionAmountSource | ActionSkillSource
) {
	if (source.kind === 'caster' || source.kind === 'spellTarget') {
		return source.kind;
	}

	if (source.kind === 'linkedMagicWordSkill') {
		return source.kind;
	}

	if (source.kind === 'mechanicParameter') {
		return `mechanicParameter:${source.parameterId}`;
	}

	if (source.kind === 'staticSkill') {
		return `staticSkill:${source.skillId}`;
	}

	if (source.kind === 'actionResult') {
		return `actionResult:${source.actionId}:${encodeURIComponent(source.resultName)}`;
	}

	return 'constant';
}

function decodeTargetSourceValue(value: string): ActionTargetSource {
	if (value === 'caster') {
		return { kind: 'caster' };
	}

	if (value === 'spellTarget') {
		return { kind: 'spellTarget' };
	}

	if (value.startsWith('actionResult:')) {
		const [, actionId = '', resultName = ''] = value.split(':');
		return {
			kind: 'actionResult',
			actionId,
			resultName: decodeURIComponent(resultName)
		};
	}

	return {
		kind: 'mechanicParameter',
		parameterId: value.replace(/^mechanicParameter:/, '')
	};
}

function decodeSkillSourceValue(value: string): ActionSkillSource {
	if (value === 'linkedMagicWordSkill') {
		return { kind: 'linkedMagicWordSkill' };
	}

	if (value.startsWith('staticSkill:')) {
		return {
			kind: 'staticSkill',
			skillId: value.replace(/^staticSkill:/, '')
		};
	}

	return {
		kind: 'mechanicParameter',
		parameterId: value.replace(/^mechanicParameter:/, '')
	};
}

function decodeAmountSourceValue(value: string): ActionAmountSource {
	if (value === 'constant') {
		return { kind: 'constant', value: 0 };
	}

	if (value.startsWith('actionResult:')) {
		const [, actionId = '', resultName = ''] = value.split(':');
		return {
			kind: 'actionResult',
			actionId,
			resultName: decodeURIComponent(resultName)
		};
	}

	return {
		kind: 'mechanicParameter',
		parameterId: value.replace(/^mechanicParameter:/, '')
	};
}

function findActionResultNames(action: MechanicActionDraft) {
	const config = parseActionConfig(action);
	const names: string[] = [];
	const result = config['result'];

	if (typeof result === 'string' && result.trim()) {
		names.push(result.trim());
	}

	const resultName = config['resultName'];

	if (typeof resultName === 'string' && resultName.trim()) {
		names.push(resultName.trim());
	}

	const marginResultName = config['marginResultName'];

	if (typeof marginResultName === 'string' && marginResultName.trim()) {
		names.push(marginResultName.trim());
	}

	return [...new Set(names)];
}

function isMechanicCalculationGraph(
	value: unknown
): value is MechanicCalculationGraphState {
	if (!isRecord(value)) {
		return false;
	}

	return Array.isArray(value['nodes']) && Array.isArray(value['edges']);
}

function parseNestedActions(value: unknown): NestedMechanicActionDraft[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item, index) => parseNestedAction(item, index))
		.filter(action => action !== null);
}

function parseNestedAction(
	value: unknown,
	index: number
): NestedMechanicActionDraft | null {
	if (!isRecord(value)) {
		return null;
	}

	const kind = isSpellMechanicActionKind(value['kind'])
		? value['kind']
		: 'custom';

	return {
		id: typeof value['id'] === 'string' ? value['id'] : crypto.randomUUID(),
		name: typeof value['name'] === 'string' ? value['name'] : '',
		kind,
		config: isRecord(value['config']) ? value['config'] : defaultActionConfig(kind),
		isActive:
			typeof value['isActive'] === 'boolean' ? value['isActive'] : true,
		sortOrder:
			typeof value['sortOrder'] === 'number' ? value['sortOrder'] : index
	};
}

function nestedActionToDraft(
	action: NestedMechanicActionDraft
): MechanicActionDraft {
	return {
		id: action.id,
		mechanicId: '',
		name: action.name,
		kind: action.kind,
		configText: stringifyConfigSchema(action.config),
		isActive: action.isActive,
		sortOrder: action.sortOrder,
		createdAt: '',
		updatedAt: ''
	};
}

function createScenarioTreeNodes(
	actions: MechanicActionDraft[]
): Array<TreeNode<ScenarioTreeNodeData>> {
	return actions.map((action, rootIndex) =>
		createActionTreeNode(action, rootIndex)
	);
}

function createActionTreeNode(
	action: MechanicActionDraft | NestedMechanicActionDraft,
	rootIndex: number,
	path: BranchActionPathSegment[] = []
): TreeNode<ScenarioTreeNodeData> {
	const children =
		action.kind === 'branch'
			? createBranchTreeNodes(action, rootIndex, path)
			: [];

	return {
		key: path.length
			? `${rootIndex}:${path.map(segment => `${segment.branchName}:${segment.actionId}`).join(':')}`
			: action.id,
		expanded: true,
		data: {
			kind: 'action',
			label: action.name || 'Без названия',
			action,
			rootIndex,
			path
		},
		children,
		leaf: children.length === 0
	};
}

function createBranchTreeNodes(
	action: MechanicActionDraft | NestedMechanicActionDraft,
	rootIndex: number,
	parentPath: BranchActionPathSegment[]
): Array<TreeNode<ScenarioTreeNodeData>> {
	const config = readBranchConfig(action);

	return [
		createBranchTreeNode(
			action.id,
			rootIndex,
			parentPath,
			'thenActions',
			config?.thenActions
		),
		createBranchTreeNode(
			action.id,
			rootIndex,
			parentPath,
			'elseActions',
			config?.elseActions
		)
	];
}

function createBranchTreeNode(
	parentActionId: string,
	rootIndex: number,
	parentPath: BranchActionPathSegment[],
	branchName: BranchName,
	actions: NestedMechanicActionDraft[] | undefined
): TreeNode<ScenarioTreeNodeData> {
	return {
		key: `${parentActionId}:${branchName}`,
		expanded: true,
		data: {
			kind: 'branch',
			label: branchName === 'thenActions' ? 'Если да' : 'Если нет',
			rootIndex,
			parentPath,
			branchName
		},
		children: (actions ?? []).map(action =>
			createActionTreeNode(action, rootIndex, [
				...parentPath,
				{ branchName, actionId: action.id }
			])
		),
		leaf: false
	};
}

function readBranchConfig(
	action: MechanicActionDraft | NestedMechanicActionDraft
): BranchActionConfig {
	return 'configText' in action
		? parseBranchActionConfig(action)
		: parseNestedBranchActionConfig(action);
}

function parseNestedBranchActionConfig(
	action: NestedMechanicActionDraft
): BranchActionConfig {
	return {
		...action.config,
		condition: isActionAmountSource(action.config['condition'])
			? action.config['condition']
			: undefined,
		thenActions: parseNestedActions(action.config['thenActions']),
		elseActions: parseNestedActions(action.config['elseActions'])
	};
}

function findNestedActionByPath(
	rootAction: MechanicActionDraft,
	path: BranchActionPathSegment[]
): NestedMechanicActionDraft | null {
	let current: MechanicActionDraft | NestedMechanicActionDraft = rootAction;
	let nested: NestedMechanicActionDraft | null = null;

	for (const segment of path) {
		const actions: NestedMechanicActionDraft[] =
			readBranchConfig(current)[segment.branchName] ?? [];
		nested =
			actions.find(
				(action: NestedMechanicActionDraft) =>
					action.id === segment.actionId
			) ?? null;

		if (!nested) {
			return null;
		}

		current = nested;
	}

	return nested;
}

function updateNestedActionByPath(
	rootAction: MechanicActionDraft,
	path: BranchActionPathSegment[],
	update: (action: NestedMechanicActionDraft) => NestedMechanicActionDraft
): MechanicActionDraft {
	const nextConfig = updateNestedActionInConfig(
		parseActionConfig(rootAction),
		path,
		update
	);

	return {
		...rootAction,
		configText: stringifyConfigSchema(nextConfig)
	};
}

function updateNestedActionInConfig(
	config: SpellMechanicConfigSchema,
	path: BranchActionPathSegment[],
	update: (action: NestedMechanicActionDraft) => NestedMechanicActionDraft
): SpellMechanicConfigSchema {
	const [segment, ...rest] = path;

	if (!segment) {
		return config;
	}

	const actions = parseNestedActions(config[segment.branchName]);
	const nextActions = actions.map(action => {
		if (action.id !== segment.actionId) {
			return action;
		}

		if (!rest.length) {
			return update(action);
		}

		return {
			...action,
			config: updateNestedActionInConfig(action.config, rest, update)
		};
	});

	return {
		...config,
		[segment.branchName]: nextActions
	};
}

function collectPreviousNestedActions(
	rootAction: MechanicActionDraft,
	path: BranchActionPathSegment[]
): NestedMechanicActionDraft[] {
	const previous: NestedMechanicActionDraft[] = [];
	let current: MechanicActionDraft | NestedMechanicActionDraft = rootAction;

	for (const segment of path) {
		const actions: NestedMechanicActionDraft[] =
			readBranchConfig(current)[segment.branchName] ?? [];
		const index = actions.findIndex(
			(action: NestedMechanicActionDraft) =>
				action.id === segment.actionId
		);

		if (index === -1) {
			return previous;
		}

		previous.push(...actions.slice(0, index));
		current = actions[index];
	}

	return previous;
}

function areBranchActionPathsEqual(
	first: BranchActionPathSegment[],
	second: BranchActionPathSegment[]
) {
	return (
		first.length === second.length &&
		first.every(
			(segment, index) =>
				segment.branchName === second[index]?.branchName &&
				segment.actionId === second[index]?.actionId
		)
	);
}

function isPathPrefix(
	prefix: BranchActionPathSegment[],
	path: BranchActionPathSegment[]
) {
	return prefix.every(
		(segment, index) =>
			segment.branchName === path[index]?.branchName &&
			segment.actionId === path[index]?.actionId
	);
}

function createNestedMechanicAction(
	sortOrder: number
): NestedMechanicActionDraft {
	return {
		id: crypto.randomUUID(),
		name: '',
		kind: 'custom',
		config: {},
		isActive: true,
		sortOrder
	};
}

function defaultActionConfig(
	kind: SpellMechanicActionKind
): SpellMechanicConfigSchema {
	if (kind === 'roll') {
		return { resultName: 'Успехи' };
	}

	if (kind === 'comparison') {
		return {
			operator: 'gt',
			resultName: 'Успешно',
			marginResultName: 'Разница'
		};
	}

	if (kind === 'calculation') {
		return { resultName: 'Значение', graph: null };
	}

	if (kind === 'branch') {
		return { thenActions: [], elseActions: [] };
	}

	if (kind === 'valueChange') {
		return { operation: 'decrease' };
	}

	if (kind === 'conditionAdd' || kind === 'conditionRemove') {
		return {};
	}

	return {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSpellMechanicActionKind(
	value: unknown
): value is SpellMechanicActionKind {
	return ACTION_KIND_OPTIONS.some(option => option.value === value);
}

function isActionTargetSource(value: unknown): value is ActionTargetSource {
	if (!isRecord(value) || typeof value['kind'] !== 'string') {
		return false;
	}

	if (value['kind'] === 'caster' || value['kind'] === 'spellTarget') {
		return true;
	}

	if (value['kind'] === 'mechanicParameter') {
		return typeof value['parameterId'] === 'string';
	}

	if (value['kind'] === 'actionResult') {
		return (
			typeof value['actionId'] === 'string' &&
			typeof value['resultName'] === 'string'
		);
	}

	return false;
}

function isActionAmountSource(value: unknown): value is ActionAmountSource {
	if (!isRecord(value) || typeof value['kind'] !== 'string') {
		return false;
	}

	if (value['kind'] === 'constant') {
		return typeof value['value'] === 'number';
	}

	if (value['kind'] === 'mechanicParameter') {
		return typeof value['parameterId'] === 'string';
	}

	if (value['kind'] === 'actionResult') {
		return (
			typeof value['actionId'] === 'string' &&
			typeof value['resultName'] === 'string'
		);
	}

	return false;
}

function isActionSkillSource(value: unknown): value is ActionSkillSource {
	if (!isRecord(value) || typeof value['kind'] !== 'string') {
		return false;
	}

	if (value['kind'] === 'linkedMagicWordSkill') {
		return true;
	}

	if (value['kind'] === 'mechanicParameter') {
		return typeof value['parameterId'] === 'string';
	}

	if (value['kind'] === 'staticSkill') {
		return typeof value['skillId'] === 'string';
	}

	return false;
}

function isValueChangeOperation(
	value: unknown
): value is ValueChangeOperation {
	return VALUE_CHANGE_OPERATION_OPTIONS.some(option => option.value === value);
}

function isComparisonOperator(value: unknown): value is ComparisonOperator {
	return COMPARISON_OPERATOR_OPTIONS.some(option => option.value === value);
}

function isDefaultValueMode(
	value: unknown
): value is SpellMechanicParameterDefaultValueMode {
	return DEFAULT_VALUE_MODE_OPTIONS.some(option => option.value === value);
}

function isDefaultValueModeAllowedForKind(
	mode: SpellMechanicParameterDefaultValueMode,
	kind: SpellMechanicParameterKind
) {
	if (kind === 'target') {
		return false;
	}

	if (mode === 'fromMagicWord') {
		return kind === 'skill' || kind === 'damageType' || kind === 'condition';
	}

	return true;
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
	const index = items.findIndex(current => current.id === item.id);

	if (index === -1) {
		return [...items, item];
	}

	const next = [...items];
	next[index] = item;
	return next;
}

function toggleSetValue(
	source: ReadonlySet<string>,
	value: string
): ReadonlySet<string> {
	const next = new Set(source);

	if (next.has(value)) {
		next.delete(value);
	} else {
		next.add(value);
	}

	return next;
}
