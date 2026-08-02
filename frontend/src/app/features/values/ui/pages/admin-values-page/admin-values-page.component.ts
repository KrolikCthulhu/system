import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Popover } from 'primeng/popover';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ConfirmationService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import {
	NavigationTreeGroup,
	NavigationTreeSubgroup
} from '../../../../../shared/ui/navigation-tree/navigation-tree.models';
import { NavigationTreeComponent } from '../../../../../shared/ui/navigation-tree/navigation-tree.component';
import {
	VALUES_REPOSITORY,
	ValuesRepository
} from '../../../data/values-repository.port';
import { SystemValueCalculationDraftController } from '../../../domain/system-value-calculation-draft';
import { SystemValueCalculationDefinition } from '../../../domain/system-value-calculation.models';
import { SystemValue } from '../../../domain/values.models';
import { SystemValuesCatalogFacade } from '../../../state/system-values-catalog.facade';
import { SystemValueCalculationEditorComponent } from '../../components/system-value-calculation-editor/system-value-calculation-editor.component';

interface FilterOption {
	label: string;
	count: number;
}

@Component({
	selector: 'app-admin-values-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		Checkbox,
		ConfirmDialog,
		IconField,
		InputIcon,
		InputText,
		Popover,
		Tag,
		Textarea,
		EditorActionsBarComponent,
		NavigationTreeComponent,
		SystemValueCalculationEditorComponent
	],
	templateUrl: './admin-values-page.component.html',
	styleUrl: './admin-values-page.component.scss',
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminValuesPageComponent {
	private readonly valuesRepository =
		inject<ValuesRepository>(VALUES_REPOSITORY);
	private readonly valuesCatalogFacade = inject(SystemValuesCatalogFacade);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly calculationDraft =
		new SystemValueCalculationDraftController();

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Значения' }
	];
	protected readonly searchQuery = signal('');
	protected readonly creatingValue = signal(false);
	protected readonly createValueName = signal('');
	protected readonly createValueSaving = signal(false);
	protected readonly selectedValueId = signal<string | null>(null);
	protected readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());
	protected readonly collapsedSubgroups = signal<ReadonlySet<string>>(
		new Set()
	);
	protected readonly selectedGroupFilters = signal<ReadonlySet<string>>(
		new Set()
	);
	protected readonly selectedContextFilters = signal<ReadonlySet<string>>(
		new Set()
	);
	protected readonly valueNameDraft = signal('');
	protected readonly valueSectionDraft = signal('');
	protected readonly valueDescriptionDraft = signal('');
	protected readonly deletingValueId = signal<string | null>(null);
	protected readonly loading = this.valuesCatalogFacade.loading;
	protected readonly errorMessage = this.valuesCatalogFacade.errorMessage;
	protected readonly values = this.valuesCatalogFacade.values;
	protected readonly calculationState = this.calculationDraft.draft;
	protected readonly calculationHasChanges = this.calculationDraft.hasChanges;
	protected readonly hasMetadataChanges = computed(() => {
		const selected = this.selectedValue();

		return Boolean(
			selected &&
				this.canEditMetadata(selected) &&
				(this.valueNameDraft().trim() !== selected.name ||
					this.valueSectionDraft().trim() !== selected.displaySection ||
					this.valueDescriptionDraft().trim() !== selected.description)
		);
	});
	protected readonly hasChanges = computed(() => {
		const selected = this.selectedValue();

		return Boolean(
			(selected &&
				this.canEditCalculation(selected) &&
				this.calculationHasChanges()) ||
				this.hasMetadataChanges()
		);
	});
	protected readonly groupFilterOptions = computed(() =>
		buildFilterOptions(this.values().map(value => value.groupLabel))
	);
	protected readonly contextFilterOptions = computed(() =>
		buildFilterOptions(
			this.values()
				.map(value => value.contextLabel?.trim() ?? '')
				.filter(label => label.length > 0)
		)
	);
	protected readonly activeFilterCount = computed(
		() => this.selectedGroupFilters().size + this.selectedContextFilters().size
	);
	protected readonly activeFilterBadge = computed(() => {
		const count = this.activeFilterCount();
		return count > 0 ? count.toString() : undefined;
	});
	protected readonly sectionSuggestions = computed(() =>
		[
			...new Set(
				this.values()
					.map(value => value.groupLabel.trim())
					.filter(label => label.length > 0 && label !== 'Без раздела')
			)
		].sort((left, right) => left.localeCompare(right, 'ru'))
	);

	protected readonly selectedValue = computed(() => {
		const selectedId = this.selectedValueId();
		return selectedId
			? (this.values().find(value => value.id === selectedId) ?? null)
			: null;
	});

	protected readonly valueGroups = computed<NavigationTreeGroup[]>(() => {
		const query = this.searchQuery().trim().toLowerCase();
		const selectedGroups = this.selectedGroupFilters();
		const selectedContexts = this.selectedContextFilters();
		const groups = new Map<string, NavigationTreeSubgroup[]>();

		for (const value of this.values()) {
			const contextLabel = value.contextLabel?.trim() ?? '';
			const haystack =
				`${value.name} ${value.groupLabel} ${value.contextLabel}`.toLowerCase();

			if (query && !haystack.includes(query)) {
				continue;
			}

			if (selectedGroups.size && !selectedGroups.has(value.groupLabel)) {
				continue;
			}

			if (selectedContexts.size && !selectedContexts.has(contextLabel)) {
				continue;
			}

			const subgroups = groups.get(value.groupLabel) ?? [];
			const subgroupLabel = contextLabel || '';
			const subgroup =
				subgroups.find(item => item.label === subgroupLabel) ??
				createValueSubgroup(subgroups, subgroupLabel);

			subgroup.items.push({
				id: value.id,
				label: value.name
			});
			groups.set(value.groupLabel, subgroups);
		}

		return Array.from(groups.entries()).map(([label, subgroups]) => ({
			label,
			count: subgroups.reduce(
				(total, subgroup) => total + subgroup.items.length,
				0
			),
			subgroups: subgroups.filter(subgroup => subgroup.label),
			items: subgroups.find(subgroup => !subgroup.label)?.items ?? []
		}));
	});

	constructor() {
		this.valuesCatalogFacade.ensureLoaded();

		effect(() => {
			const values = this.values();

			if (!values.length) {
				this.selectedValueId.set(null);
				this.calculationDraft.clear();
				return;
			}

			if (
				!this.selectedValueId() ||
				!values.some(value => value.id === this.selectedValueId())
			) {
				this.selectValueInternal(values[0].id);
			}
		});
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected isGroupFilterSelected(label: string) {
		return this.selectedGroupFilters().has(label);
	}

	protected isContextFilterSelected(label: string) {
		return this.selectedContextFilters().has(label);
	}

	protected toggleGroupFilter(label: string) {
		this.selectedGroupFilters.update(filters => toggleSetValue(filters, label));
	}

	protected toggleContextFilter(label: string) {
		this.selectedContextFilters.update(filters =>
			toggleSetValue(filters, label)
		);
	}

	protected clearFilters() {
		this.selectedGroupFilters.set(new Set());
		this.selectedContextFilters.set(new Set());
	}

	protected toggleGroup(label: string) {
		this.collapsedGroups.update(collapsed => {
			const next = new Set(collapsed);

			if (next.has(label)) {
				next.delete(label);
			} else {
				next.add(label);
			}

			return next;
		});
	}

	protected toggleSubgroup(groupLabel: string, subgroupLabel: string) {
		const key = subgroupKey(groupLabel, subgroupLabel);

		this.collapsedSubgroups.update(collapsed => {
			const next = new Set(collapsed);

			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}

			return next;
		});
	}

	protected startCreateValue() {
		this.creatingValue.set(true);
		this.createValueName.set('');
	}

	protected cancelCreateValue() {
		this.creatingValue.set(false);
		this.createValueName.set('');
	}

	protected setCreateValueName(name: string) {
		this.createValueName.set(name);
	}

	protected createValue() {
		const name = this.createValueName().trim();

		if (!name || this.createValueSaving()) {
			return;
		}

		this.createValueSaving.set(true);
		this.valuesRepository.createManual({ name }).subscribe({
			next: value => {
				this.valuesCatalogFacade.addValue(value);
				this.creatingValue.set(false);
				this.createValueName.set('');
				this.createValueSaving.set(false);
				this.selectValueInternal(value.id);
				this.errorMessage.set(null);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось создать значение системы.'
				);
				this.createValueSaving.set(false);
			}
		});
	}

	protected selectValue(valueId: string) {
		if (valueId === this.selectedValueId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.selectValueInternal(valueId)
		});
	}

	protected updateCalculationState(next: SystemValueCalculationDefinition) {
		this.calculationDraft.update(next);
	}

	protected resetDraft() {
		this.calculationDraft.reset();
		this.valueNameDraft.set(this.selectedValue()?.name ?? '');
		this.valueSectionDraft.set(this.selectedValue()?.displaySection ?? '');
		this.valueDescriptionDraft.set(this.selectedValue()?.description ?? '');
	}

	protected saveDraft() {
		const selected = this.selectedValue();
		const draft = this.calculationState();

		if (!selected || !draft || !this.hasChanges()) {
			return;
		}

		const name = this.valueNameDraft().trim();
		const displaySection = this.valueSectionDraft().trim();
		const description = this.valueDescriptionDraft().trim();

		if (this.hasMetadataChanges() && !name) {
			this.errorMessage.set('Название значения не может быть пустым.');
			return;
		}

		const metadataRequest = this.hasMetadataChanges()
			? this.valuesRepository.updateValue(selected.id, {
					name,
					description,
					displaySection
				})
			: of(selected);
		const calculationRequest = this.calculationHasChanges()
			? this.canEditCalculation(selected)
				? this.valuesRepository.updateCalculation(
						draft.id,
						draft.calculationGraph
					)
				: of(undefined)
			: of(undefined);

		forkJoin({
			value: metadataRequest,
			calculation: calculationRequest
		}).subscribe({
			next: ({ value }) => {
				const nextValue: SystemValue = {
					...value,
					calculationGraph:
						this.calculationHasChanges() && this.canEditCalculation(selected)
							? draft.calculationGraph
							: value.calculationGraph
				};
				this.valuesCatalogFacade.replaceValue(nextValue);
				this.valueNameDraft.set(nextValue.name);
				this.valueSectionDraft.set(nextValue.displaySection);
				this.valueDescriptionDraft.set(nextValue.description);
				this.calculationDraft.commit(toCalculationDefinition(nextValue));
				this.errorMessage.set(null);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить значение системы.'
				);
			}
		});
	}

	protected confirmDeleteValue(value: SystemValue) {
		if (!this.canDeleteValue(value)) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				this.confirmationService.confirm({
					header: 'Удалить значение?',
					message: `Значение "${value.name}" будет удалено без возможности восстановления.`,
					icon: 'pi pi-trash',
					acceptLabel: 'Удалить',
					rejectLabel: 'Отмена',
					acceptButtonStyleClass: 'p-button-danger',
					accept: () => this.deleteValue(value)
				});
			}
		});
	}

	protected canDeleteValue(value: SystemValue) {
		return !value.isSystemManaged && value.primaryOwner.type === 'manual';
	}

	protected setValueNameDraft(name: string) {
		this.valueNameDraft.set(name);
	}

	protected setValueSectionDraft(section: string) {
		this.valueSectionDraft.set(section);
	}

	protected setValueDescriptionDraft(description: string) {
		this.valueDescriptionDraft.set(description);
	}

	protected canEditMetadata(value: SystemValue) {
		return (
			value.primaryOwner.type === 'manual' &&
			(!value.isSystemManaged || Boolean(value.coreKey))
		);
	}

	protected canEditCalculation(value: SystemValue) {
		return !value.isSystemManaged || Boolean(value.coreKey);
	}

	protected kindLabel(kind: SystemValue['kind']) {
		switch (kind) {
			case 'attribute':
				return 'Атрибут';
			case 'characteristic':
				return 'Характеристика';
			case 'skill':
				return 'Навык';
			case 'roll-consequence':
				return 'Последствие';
			case 'manual':
				return 'Значение';
		}
	}

	private selectValueInternal(valueId: string) {
		const nextValue = this.values().find(value => value.id === valueId);
		if (!nextValue) {
			return;
		}

		this.selectedValueId.set(valueId);
		this.calculationDraft.set(toCalculationDefinition(nextValue));
		this.valueNameDraft.set(nextValue.name);
		this.valueSectionDraft.set(nextValue.displaySection);
		this.valueDescriptionDraft.set(nextValue.description);
	}

	private deleteValue(value: SystemValue) {
		if (this.deletingValueId()) {
			return;
		}

		this.deletingValueId.set(value.id);
		this.valuesRepository.deleteValue(value.id).subscribe({
			next: () => {
				this.valuesCatalogFacade.removeValue(value.id);
				this.deletingValueId.set(null);
				this.calculationDraft.clear();
				this.valueNameDraft.set('');
				this.valueSectionDraft.set('');
				this.valueDescriptionDraft.set('');
				this.errorMessage.set(null);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось удалить значение системы.'
				);
				this.deletingValueId.set(null);
			}
		});
	}
}

function toCalculationDefinition(
	value: SystemValue
): SystemValueCalculationDefinition {
	return {
		id: value.id,
		calculationGraph: value.calculationGraph
	};
}

function buildFilterOptions(labels: string[]): FilterOption[] {
	const counts = new Map<string, number>();

	for (const label of labels) {
		counts.set(label, (counts.get(label) ?? 0) + 1);
	}

	return Array.from(counts.entries()).map(([label, count]) => ({
		label,
		count
	}));
}

function createValueSubgroup(
	subgroups: NavigationTreeSubgroup[],
	label: string
): NavigationTreeSubgroup {
	const subgroup: NavigationTreeSubgroup = { label, items: [] };
	subgroups.push(subgroup);
	return subgroup;
}

function subgroupKey(groupLabel: string, subgroupLabel: string) {
	return `${groupLabel}::${subgroupLabel}`;
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
