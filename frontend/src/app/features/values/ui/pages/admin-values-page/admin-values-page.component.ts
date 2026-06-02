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
import { ConfirmationService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { VALUES_REPOSITORY, ValuesRepository } from '../../../data/values-repository.port';
import {
	SystemValueCalculationDraftController
} from '../../../domain/system-value-calculation-draft';
import { SystemValueCalculationDefinition } from '../../../domain/system-value-calculation.models';
import { SystemValue } from '../../../domain/values.models';
import { SystemValuesCatalogFacade } from '../../../state/system-values-catalog.facade';
import { SystemValueCalculationEditorComponent } from '../../components/system-value-calculation-editor/system-value-calculation-editor.component';

interface ValueGroup {
	label: string;
	items: SystemValue[];
}

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
		SystemValueCalculationEditorComponent
	],
	templateUrl: './admin-values-page.component.html',
	styleUrl: './admin-values-page.component.scss',
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminValuesPageComponent {
	private readonly valuesRepository = inject<ValuesRepository>(VALUES_REPOSITORY);
	private readonly valuesCatalogFacade = inject(SystemValuesCatalogFacade);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly calculationDraft = new SystemValueCalculationDraftController();

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
	protected readonly selectedGroupFilters = signal<ReadonlySet<string>>(new Set());
	protected readonly selectedContextFilters = signal<ReadonlySet<string>>(new Set());
	protected readonly valueNameDraft = signal('');
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
			this.valueNameDraft().trim() !== selected.name
		);
	});
	protected readonly hasChanges = computed(
		() =>
			(!this.selectedValue()?.isSystemManaged && this.calculationHasChanges()) ||
			this.hasMetadataChanges()
	);
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

	protected readonly selectedValue = computed(() => {
		const selectedId = this.selectedValueId();
		return selectedId
			? this.values().find(value => value.id === selectedId) ?? null
			: null;
	});

	protected readonly valueGroups = computed<ValueGroup[]>(() => {
		const query = this.searchQuery().trim().toLowerCase();
		const selectedGroups = this.selectedGroupFilters();
		const selectedContexts = this.selectedContextFilters();
		const groups = new Map<string, SystemValue[]>();

		for (const value of this.values()) {
			const contextLabel = value.contextLabel?.trim() ?? '';
			const haystack = `${value.name} ${value.groupLabel} ${value.contextLabel}`.toLowerCase();

			if (query && !haystack.includes(query)) {
				continue;
			}

			if (selectedGroups.size && !selectedGroups.has(value.groupLabel)) {
				continue;
			}

			if (selectedContexts.size && !selectedContexts.has(contextLabel)) {
				continue;
			}

			const items = groups.get(value.groupLabel) ?? [];
			items.push(value);
			groups.set(value.groupLabel, items);
		}

		return Array.from(groups.entries()).map(([label, items]) => ({
			label,
			items
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

			if (!this.selectedValueId() || !values.some(value => value.id === this.selectedValueId())) {
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
		this.selectedContextFilters.update(filters => toggleSetValue(filters, label));
	}

	protected clearFilters() {
		this.selectedGroupFilters.set(new Set());
		this.selectedContextFilters.set(new Set());
	}

	protected isGroupCollapsed(label: string) {
		return this.collapsedGroups().has(label);
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
	}

	protected saveDraft() {
		const selected = this.selectedValue();
		const draft = this.calculationState();

		if (!selected || !draft || !this.hasChanges()) {
			return;
		}

		const name = this.valueNameDraft().trim();

		if (this.hasMetadataChanges() && !name) {
			this.errorMessage.set('Название значения не может быть пустым.');
			return;
		}

		const metadataRequest = this.hasMetadataChanges()
			? this.valuesRepository.updateValue(selected.id, { name })
			: of(selected);
		const calculationRequest = this.calculationHasChanges()
			? selected.isSystemManaged
				? of(undefined)
				: this.valuesRepository.updateCalculation(draft.id, draft.calculationGraph)
			: of(undefined);

		forkJoin({
			value: metadataRequest,
			calculation: calculationRequest
		}).subscribe({
			next: ({ value }) => {
				const nextValue: SystemValue = {
					...value,
					calculationGraph:
						this.calculationHasChanges() && !selected.isSystemManaged
						? draft.calculationGraph
						: value.calculationGraph
				};
				this.valuesCatalogFacade.replaceValue(nextValue);
				this.valueNameDraft.set(nextValue.name);
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

	protected canEditMetadata(value: SystemValue) {
		return !value.isSystemManaged && value.primaryOwner.type === 'manual';
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
