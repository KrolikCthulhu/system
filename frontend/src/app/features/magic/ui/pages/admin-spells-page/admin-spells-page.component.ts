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
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TreeNode } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TreeTableModule } from 'primeng/treetable';
import { MAGIC_WORDS_REPOSITORY } from '../../../data/magic-words-repository.port';
import {
	Spell,
	SpellCatalog,
	SpellFormulaCandidate,
	SpellFormulaGroup,
	SpellStatus,
	canManageSpellActivity,
	spellStatusLabel
} from '../../../domain/spell.models';

interface SpellTreeNodeData {
	kind: 'action' | 'essence' | 'formula' | 'skeleton';
	name: string;
	title: string;
	status: SpellStatus | null;
	isActive: boolean;
	count: number | null;
	formula: SpellFormulaCandidate | null;
}

interface SpellFilterOption {
	label: string;
	value: string;
	count: number;
}

interface SpellStatusFilterOption {
	label: string;
	value: SpellStatus;
	count: number;
}

type ActivityFilterValue = 'ACTIVE' | 'INACTIVE';
type FilterGroupKey =
	| 'status'
	| 'activity'
	| 'actions'
	| 'essences'
	| 'gestures';

@Component({
	selector: 'app-admin-spells-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		Checkbox,
		IconField,
		InputIcon,
		InputText,
		Skeleton,
		Tag,
		ToggleSwitch,
		TreeTableModule
	],
	templateUrl: './admin-spells-page.component.html',
	styleUrl: './admin-spells-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSpellsPageComponent {
	private readonly repository = inject(MAGIC_WORDS_REPOSITORY);
	private readonly router = inject(Router);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Заклинания' }
	];
	protected readonly catalog = signal<SpellCatalog>({ groups: [] });
	protected readonly searchQuery = signal('');
	protected readonly selectedStatuses = signal<ReadonlySet<SpellStatus>>(
		new Set()
	);
	protected readonly selectedActions = signal<ReadonlySet<string>>(new Set());
	protected readonly selectedEssences = signal<ReadonlySet<string>>(new Set());
	protected readonly selectedGestures = signal<ReadonlySet<string>>(new Set());
	protected readonly selectedActivity = signal<
		ReadonlySet<ActivityFilterValue>
	>(new Set());
	protected readonly collapsedFilterGroups = signal<
		ReadonlySet<FilterGroupKey>
	>(new Set());
	protected readonly loading = signal(true);
	protected readonly savingActivityIds = signal<ReadonlySet<string>>(new Set());
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly skeletonNodes: Array<TreeNode<SpellTreeNodeData>> =
		Array.from({ length: 9 }, (_, index) => ({
			key: `skeleton-${index}`,
			data: {
				kind: 'skeleton',
				name: '',
				title: '',
				status: null,
				isActive: false,
				count: null,
				formula: null
			},
			leaf: true
		}));

	protected readonly filteredGroups = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		const statuses = this.selectedStatuses();
		const actions = this.selectedActions();
		const essences = this.selectedEssences();
		const gestures = this.selectedGestures();
		const activity = this.selectedActivity();

		return this.catalog()
			.groups.filter(group => !actions.size || actions.has(group.action.id))
			.filter(group => !essences.size || essences.has(group.essence.id))
			.map(group => ({
				...group,
				formulas: group.formulas.filter(formula => {
					const haystack =
						`${group.label} ${formula.gesture.name} ${formula.spell?.name ?? ''}`.toLowerCase();
					const matchesQuery = !query || haystack.includes(query);
					const matchesStatus = !statuses.size || statuses.has(formula.status);
					const matchesGesture =
						!gestures.size || gestures.has(formula.gesture.id);
					const matchesActivity =
						!activity.size ||
						(activity.has('ACTIVE') &&
							formula.spell !== null &&
							formula.isActive) ||
						(activity.has('INACTIVE') &&
							formula.spell !== null &&
							!formula.isActive);

					return (
						matchesQuery && matchesStatus && matchesGesture && matchesActivity
					);
				})
			}))
			.filter(group => group.formulas.length);
	});
	protected readonly statusOptions = computed<SpellStatusFilterOption[]>(() => [
		{
			label: spellStatusLabel('EMPTY'),
			value: 'EMPTY',
			count: this.getSummaryCount('EMPTY')
		},
		{
			label: spellStatusLabel('DRAFT'),
			value: 'DRAFT',
			count: this.getSummaryCount('DRAFT')
		},
		{
			label: spellStatusLabel('TESTING'),
			value: 'TESTING',
			count: this.getSummaryCount('TESTING')
		},
		{
			label: spellStatusLabel('READY'),
			value: 'READY',
			count: this.getSummaryCount('READY')
		}
	]);
	protected readonly activityOptions: Array<{
		label: string;
		value: ActivityFilterValue;
		count: number;
	}> = [
		{ label: 'Активные', value: 'ACTIVE', count: 0 },
		{ label: 'Выключенные', value: 'INACTIVE', count: 0 }
	];
	protected readonly activityFilterOptions = computed(() => {
		let active = 0;
		let inactive = 0;

		for (const group of this.catalog().groups) {
			for (const formula of group.formulas) {
				if (!formula.spell) {
					continue;
				}

				if (formula.isActive) {
					active += 1;
				} else {
					inactive += 1;
				}
			}
		}

		return [
			{ label: 'Активные', value: 'ACTIVE' as const, count: active },
			{ label: 'Выключенные', value: 'INACTIVE' as const, count: inactive }
		];
	});
	protected readonly actionOptions = computed<SpellFilterOption[]>(() =>
		uniqueOptions(
			this.catalog().groups.map(group => ({
				label: group.action.name,
				value: group.action.id,
				count: group.formulas.length
			}))
		)
	);
	protected readonly essenceOptions = computed<SpellFilterOption[]>(() =>
		uniqueOptions(
			this.catalog().groups.map(group => ({
				label: group.essence.name,
				value: group.essence.id,
				count: group.formulas.length
			}))
		)
	);
	protected readonly gestureOptions = computed<SpellFilterOption[]>(() =>
		uniqueOptions(
			this.catalog().groups.flatMap(group =>
				group.formulas.map(formula => ({
					label: formula.gesture.name,
					value: formula.gesture.id,
					count: 1
				}))
			)
		)
	);
	protected readonly activeFilterCount = computed(
		() =>
			(this.searchQuery().trim() ? 1 : 0) +
			this.selectedStatuses().size +
			this.selectedActivity().size +
			this.selectedActions().size +
			this.selectedEssences().size +
			this.selectedGestures().size
	);
	protected readonly summary = computed(() => {
		const counts = new Map<SpellStatus, number>([
			['EMPTY', 0],
			['DRAFT', 0],
			['TESTING', 0],
			['READY', 0]
		]);

		for (const group of this.catalog().groups) {
			for (const formula of group.formulas) {
				counts.set(formula.status, (counts.get(formula.status) ?? 0) + 1);
			}
		}

		return counts;
	});
	protected readonly treeNodes = computed<Array<TreeNode<SpellTreeNodeData>>>(
		() => buildSpellTreeNodes(this.filteredGroups())
	);

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected isFilterGroupCollapsed(group: FilterGroupKey) {
		return this.collapsedFilterGroups().has(group);
	}

	protected toggleFilterGroup(group: FilterGroupKey) {
		this.collapsedFilterGroups.update(groups => toggleSetValue(groups, group));
	}

	protected isStatusSelected(status: SpellStatus) {
		return this.selectedStatuses().has(status);
	}

	protected toggleStatusFilter(status: SpellStatus) {
		this.selectedStatuses.update(statuses => toggleSetValue(statuses, status));
	}

	protected isActivitySelected(activity: ActivityFilterValue) {
		return this.selectedActivity().has(activity);
	}

	protected toggleActivityFilter(activity: ActivityFilterValue) {
		this.selectedActivity.update(values => toggleSetValue(values, activity));
	}

	protected isActionSelected(actionId: string) {
		return this.selectedActions().has(actionId);
	}

	protected toggleActionFilter(actionId: string) {
		this.selectedActions.update(actions => toggleSetValue(actions, actionId));
	}

	protected isEssenceSelected(essenceId: string) {
		return this.selectedEssences().has(essenceId);
	}

	protected toggleEssenceFilter(essenceId: string) {
		this.selectedEssences.update(essences =>
			toggleSetValue(essences, essenceId)
		);
	}

	protected isGestureSelected(gestureId: string) {
		return this.selectedGestures().has(gestureId);
	}

	protected toggleGestureFilter(gestureId: string) {
		this.selectedGestures.update(gestures =>
			toggleSetValue(gestures, gestureId)
		);
	}

	protected resetFilters() {
		this.searchQuery.set('');
		this.selectedStatuses.set(new Set());
		this.selectedActivity.set(new Set());
		this.selectedActions.set(new Set());
		this.selectedEssences.set(new Set());
		this.selectedGestures.set(new Set());
	}

	protected editFormula(formula: SpellFormulaCandidate) {
		if (formula.spell) {
			void this.router.navigate(['/admin/rules/spells', formula.spell.id]);
			return;
		}

		void this.router.navigate([
			'/admin/rules/spells/formula',
			formula.action.id,
			formula.essence.id,
			formula.gesture.id
		]);
	}

	protected canToggleActivity(formula: SpellFormulaCandidate | null) {
		return Boolean(
			formula?.spell && canManageSpellActivity(formula.spell.status)
		);
	}

	protected isActivitySaving(formula: SpellFormulaCandidate | null) {
		return Boolean(
			formula?.spell && this.savingActivityIds().has(formula.spell.id)
		);
	}

	protected toggleSpellActivity(
		formula: SpellFormulaCandidate | null,
		isActive: boolean
	) {
		const spell = formula?.spell;

		if (
			!spell ||
			!canManageSpellActivity(spell.status) ||
			this.isActivitySaving(formula)
		) {
			return;
		}

		this.savingActivityIds.update(ids => toggleSetValue(ids, spell.id));
		this.errorMessage.set(null);
		this.repository
			.updateSpellActivity(spell.id, isActive)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: saved => {
					this.catalog.update(catalog => updateSpellInCatalog(catalog, saved));
					this.savingActivityIds.update(ids => toggleSetValue(ids, spell.id));
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось изменить активность заклинания.'
					);
					this.savingActivityIds.update(ids => toggleSetValue(ids, spell.id));
				}
			});
	}

	protected statusLabel(status: SpellStatus) {
		return spellStatusLabel(status);
	}

	protected statusSeverity(status: SpellStatus) {
		switch (status) {
			case 'READY':
				return 'success';
			case 'TESTING':
				return 'info';
			case 'DRAFT':
				return 'warn';
			case 'EMPTY':
				return 'secondary';
		}
	}

	protected getSummaryCount(status: SpellStatus) {
		return this.summary().get(status) ?? 0;
	}

	protected rowStatusClass(data: SpellTreeNodeData) {
		if (data.kind !== 'formula' || !data.status) {
			return '';
		}

		return `admin-spells-page__tree-row--${data.status.toLowerCase()}`;
	}

	private loadCatalog() {
		this.loading.set(true);
		this.errorMessage.set(null);
		this.repository
			.loadSpellCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.catalog.set(catalog);
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить заклинания.'
					);
					this.loading.set(false);
				}
			});
	}
}

function buildSpellTreeNodes(
	groups: SpellFormulaGroup[]
): Array<TreeNode<SpellTreeNodeData>> {
	const actions = new Map<
		string,
		{
			node: TreeNode<SpellTreeNodeData>;
			essences: Map<string, TreeNode<SpellTreeNodeData>>;
		}
	>();

	for (const group of groups) {
		let action = actions.get(group.action.id);

		if (!action) {
			action = {
				node: {
					key: group.action.id,
					expanded: true,
					data: {
						kind: 'action',
						name: group.action.name,
						title: '',
						status: null,
						isActive: false,
						count: 0,
						formula: null
					},
					children: []
				},
				essences: new Map()
			};
			actions.set(group.action.id, action);
		}

		const essenceNode: TreeNode<SpellTreeNodeData> = {
			key: group.key,
			expanded: true,
			data: {
				kind: 'essence',
				name: group.essence.name,
				title: '',
				status: null,
				isActive: false,
				count: group.formulas.length,
				formula: null
			},
			children: group.formulas.map(formula => ({
				key: formula.key,
				data: {
					kind: 'formula',
					name: formula.gesture.name,
					title: formula.spell?.name ?? '—',
					status: formula.status,
					isActive: formula.isActive,
					count: null,
					formula
				},
				leaf: true
			}))
		};

		action.essences.set(group.essence.id, essenceNode);
		action.node.children = Array.from(action.essences.values());
		const actionData = action.node.data;

		if (actionData) {
			action.node.data = {
				...actionData,
				count: (actionData.count ?? 0) + group.formulas.length
			};
		}
	}

	return Array.from(actions.values()).map(action => action.node);
}

function uniqueOptions(options: SpellFilterOption[]) {
	const grouped = new Map<string, SpellFilterOption>();

	for (const option of options) {
		const existing = grouped.get(option.value);

		grouped.set(option.value, {
			...option,
			count: (existing?.count ?? 0) + option.count
		});
	}

	return Array.from(grouped.values()).sort((first, second) =>
		first.label.localeCompare(second.label, 'ru')
	);
}

function updateSpellInCatalog(
	catalog: SpellCatalog,
	spell: Spell
): SpellCatalog {
	return {
		groups: catalog.groups.map(group => ({
			...group,
			formulas: group.formulas.map(formula =>
				formula.spell?.id === spell.id
					? {
							...formula,
							status: spell.status,
							isActive: spell.isActive,
							spell
						}
					: formula
			)
		}))
	};
}

function toggleSetValue<T>(values: ReadonlySet<T>, value: T) {
	const next = new Set(values);

	if (next.has(value)) {
		next.delete(value);
	} else {
		next.add(value);
	}

	return next;
}
