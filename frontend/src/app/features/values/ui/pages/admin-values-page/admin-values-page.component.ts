import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { ConfirmationService } from 'primeng/api';
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

@Component({
	selector: 'app-admin-values-page',
	standalone: true,
	imports: [
		CommonModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		IconField,
		InputIcon,
		InputText,
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
	private readonly calculationDraft = new SystemValueCalculationDraftController();

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Значения' }
	];
	protected readonly searchQuery = signal('');
	protected readonly selectedValueId = signal<string | null>(null);
	protected readonly loading = this.valuesCatalogFacade.loading;
	protected readonly errorMessage = this.valuesCatalogFacade.errorMessage;
	protected readonly values = this.valuesCatalogFacade.values;
	protected readonly calculationState = this.calculationDraft.draft;
	protected readonly hasChanges = this.calculationDraft.hasChanges;

	protected readonly selectedValue = computed(() => {
		const selectedId = this.selectedValueId();
		return selectedId
			? this.values().find(value => value.id === selectedId) ?? null
			: null;
	});

	protected readonly valueGroups = computed<ValueGroup[]>(() => {
		const query = this.searchQuery().trim().toLowerCase();
		const groups = new Map<string, SystemValue[]>();

		for (const value of this.values()) {
			const haystack = `${value.name} ${value.groupLabel} ${value.contextLabel}`.toLowerCase();

			if (query && !haystack.includes(query)) {
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
	}

	protected saveDraft() {
		const selected = this.selectedValue();
		const draft = this.calculationState();

		if (!selected || !draft || !this.hasChanges()) {
			return;
		}

		this.valuesRepository
			.updateCalculation(
				draft.sourceType,
				draft.id,
				draft.baseSourceType,
				draft.baseSourceType === 'computed' ? draft.calculationGraph : null
			)
			.subscribe({
				next: () => {
					const nextValue: SystemValue = {
						...selected,
						baseSourceType: draft.baseSourceType,
						calculationGraph:
							draft.baseSourceType === 'computed' ? draft.calculationGraph : null
					};
					this.valuesCatalogFacade.replaceValue(nextValue);
					this.calculationDraft.commit(toCalculationDefinition(nextValue));
					this.errorMessage.set(null);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось сохранить граф расчёта.'
					);
				}
			});
	}

	protected kindLabel(kind: SystemValue['kind']) {
		switch (kind) {
			case 'attribute':
				return 'Атрибут';
			case 'characteristic':
				return 'Характеристика';
			case 'skill':
				return 'Навык';
		}
	}

	protected modeTagLabel(value: SystemValue) {
		return value.baseSourceType === 'computed'
			? 'Вычисляется'
			: 'База персонажа';
	}

	protected modeTagSeverity(value: SystemValue) {
		return value.baseSourceType === 'computed' ? 'info' : 'secondary';
	}

	private selectValueInternal(valueId: string) {
		const nextValue = this.values().find(value => value.id === valueId);
		if (!nextValue) {
			return;
		}

		this.selectedValueId.set(valueId);
		this.calculationDraft.set(toCalculationDefinition(nextValue));
	}
}

function toCalculationDefinition(
	value: SystemValue
): SystemValueCalculationDefinition {
	return {
		id: value.id,
		isSystemValue: value.isSystemValue,
		sourceType: value.kind,
		baseSourceType: value.baseSourceType,
		calculationGraph: value.calculationGraph
	};
}
