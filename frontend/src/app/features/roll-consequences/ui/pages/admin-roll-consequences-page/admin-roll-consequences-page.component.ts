import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import {
	FormArray,
	FormControl,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
	Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Fluid } from 'primeng/fluid';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Splitter } from 'primeng/splitter';
import { TableModule } from 'primeng/table';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { SignalFormDraft } from '../../../../../shared/forms/signal-form-draft';
import { SystemValuesCatalogFacade } from '../../../../values/state/system-values-catalog.facade';
import {
	ROLL_CONSEQUENCES_REPOSITORY,
	RollConsequencesRepository
} from '../../../data/roll-consequences-repository.port';
import {
	RollConsequence,
	RollConsequenceValue
} from '../../../domain/roll-consequences.models';
import { RollEventGraphDefinition } from '../../../domain/roll-event-graph.models';
import {
	CreateRollConsequenceCommand,
	RollConsequenceValueCommand
} from '../../../state/roll-consequences.commands';

type ConsequenceValueForm = FormGroup<{
	id: FormControl<string | null>;
	name: FormControl<string>;
	description: FormControl<string>;
	isActive: FormControl<boolean>;
	sortOrder: FormControl<number>;
}>;

type ConsequenceForm = FormGroup<{
	name: FormControl<string>;
	description: FormControl<string>;
	rollEventGraph: FormControl<RollEventGraphDefinition | null>;
	isActive: FormControl<boolean>;
	sortOrder: FormControl<number>;
	values: FormArray<ConsequenceValueForm>;
}>;

@Component({
	selector: 'app-admin-roll-consequences-page',
	standalone: true,
	imports: [
		CommonModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		Fluid,
		FormsModule,
		InputNumber,
		InputText,
		ReactiveFormsModule,
		Splitter,
		TableModule,
		Textarea,
		ToggleSwitch
	],
	templateUrl: './admin-roll-consequences-page.component.html',
	styleUrl: './admin-roll-consequences-page.component.scss',
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminRollConsequencesPageComponent {
	private readonly repository = inject<RollConsequencesRepository>(
		ROLL_CONSEQUENCES_REPOSITORY
	);
	private readonly router = inject(Router);
	private readonly destroyRef = inject(DestroyRef);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly valuesCatalogFacade = inject(SystemValuesCatalogFacade);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Последствия броска' }
	];
	protected readonly consequences = signal<RollConsequence[]>([]);
	protected readonly selectedConsequenceId = signal<string | null>(null);
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly editorOpen = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly draftIds = signal<string[]>([]);
	protected readonly form = createConsequenceForm();
	private readonly formDraft = new SignalFormDraft<CreateRollConsequenceCommand>(
		this.form,
		() => getConsequenceFormValue(this.form),
		this.destroyRef
	);
	protected readonly valuesForm = this.form.controls.values;
	protected readonly availableValues = this.valuesCatalogFacade.values;
	protected readonly selectedConsequence = computed(() => {
		const selectedId = this.selectedConsequenceId();
		return selectedId
			? this.consequences().find(item => item.id === selectedId) ?? null
			: null;
	});
	protected readonly isDraftSelected = computed(() => {
		const selectedId = this.selectedConsequenceId();
		return selectedId ? this.draftIds().includes(selectedId) : false;
	});
	protected readonly hasChanges = this.formDraft.hasChanges;

	constructor() {
		this.valuesCatalogFacade.ensureLoaded();
		this.loadCatalog();

		effect(() => {
			const items = this.consequences();

			if (!items.length) {
				this.selectedConsequenceId.set(null);
				resetConsequenceForm(this.form);
				this.formDraft.clear();
				return;
			}

			if (!this.selectedConsequenceId() || !items.some(item => item.id === this.selectedConsequenceId())) {
				this.selectConsequenceInternal(items[0].id);
			}
		});
	}

	protected openEditor(id: string) {
		void this.router.navigate(['/admin/rules/roll-consequences', id]);
	}

	protected closeEditor() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.patchForm(this.selectedConsequence()),
			proceed: () => this.editorOpen.set(false)
		});
	}

	protected addConsequence() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.patchForm(this.selectedConsequence()),
			proceed: () => {
				const id = `draft-roll-consequence-${crypto.randomUUID()}`;
				const draft: RollConsequence = {
					id,
					name: 'Новое последствие',
					description: '',
					rollEventGraph: null,
					isActive: true,
					sortOrder: this.consequences().length,
					values: []
				};

				this.draftIds.update(ids => [...ids, id]);
				this.consequences.update(items => [draft, ...items]);
				this.selectConsequenceInternal(id);
				this.editorOpen.set(true);
			}
		});
	}

	protected selectConsequence(id: string) {
		if (id === this.selectedConsequenceId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.patchForm(this.selectedConsequence()),
			proceed: () => this.selectConsequenceInternal(id)
		});
	}

	protected addValue() {
		this.valuesForm.push(
			createValueForm({
				id: null,
				name: 'Новое значение',
				description: '',
				isActive: true,
				sortOrder: this.valuesForm.length
			})
		);
		this.form.markAsDirty();
		this.formDraft.syncFromForm();
	}

	protected removeValue(index: number) {
		this.valuesForm.removeAt(index);
		this.form.markAsDirty();
		this.formDraft.syncFromForm();
	}

	protected save() {
		const selected = this.selectedConsequence();

		if (!selected || this.form.invalid || !this.hasChanges() || this.saving()) {
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const payload = getConsequenceFormValue(this.form);
		const request = this.isDraftSelected()
			? this.repository.create(payload)
			: this.repository.update({ id: selected.id, ...payload });

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: consequence => {
				if (this.isDraftSelected()) {
					const previousId = selected.id;
					this.draftIds.update(ids => ids.filter(id => id !== previousId));
					this.consequences.update(items =>
						items.map(item => (item.id === previousId ? consequence : item))
					);
					this.selectedConsequenceId.set(consequence.id);
					this.editorOpen.set(false);
					void this.router.navigate([
						'/admin/rules/roll-consequences',
						consequence.id
					]);
				} else {
					this.consequences.update(items =>
						items.map(item => (item.id === consequence.id ? consequence : item))
					);
				}

				this.patchForm(consequence);
				this.valuesCatalogFacade.reloadIfInitialized();
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить последствие броска.'
				);
				this.saving.set(false);
			}
		});
	}

	protected cancel() {
		if (this.isDraftSelected()) {
			const selectedId = this.selectedConsequenceId();

			if (selectedId) {
				this.consequences.update(items =>
					items.filter(item => item.id !== selectedId)
				);
				this.draftIds.update(ids => ids.filter(id => id !== selectedId));
			}
			return;
		}

		this.patchForm(this.selectedConsequence());
	}

	protected toggleActive(id: string, isActive: boolean) {
		const previous = this.consequences();

		this.consequences.update(items =>
			items.map(item => (item.id === id ? { ...item, isActive } : item))
		);

		this.repository
			.updateActive({ id, isActive })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: consequence =>
					this.consequences.update(items =>
						items.map(item => (item.id === id ? consequence : item))
					),
				error: () => this.consequences.set(previous)
			});
	}

	protected confirmDelete(consequence: RollConsequence) {
		this.confirmationService.confirm({
			header: 'Удалить последствие?',
			message: `Последствие "${consequence.name}" будет удалено вместе со связанными значениями системы.`,
			icon: 'pi pi-trash',
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteConsequence(consequence.id)
		});
	}

	protected isSaveDisabled() {
		return this.form.invalid || !this.hasChanges() || this.saving();
	}

	protected getRelatedValuesLabel(consequence: RollConsequence) {
		if (!consequence.values.length) {
			return '—';
		}

		return consequence.values.map(value => value.name).join(', ');
	}

	private loadCatalog() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.loadCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.consequences.set(catalog.consequences);
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить последствия броска.'
					);
					this.loading.set(false);
				}
			});
	}

	private deleteConsequence(id: string) {
		if (this.draftIds().includes(id)) {
			this.consequences.update(items => items.filter(item => item.id !== id));
			this.draftIds.update(ids => ids.filter(item => item !== id));
			return;
		}

		this.repository
			.delete(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.consequences.update(items => items.filter(item => item.id !== id));
					if (this.selectedConsequenceId() === id) {
						this.selectedConsequenceId.set(null);
					}
					this.valuesCatalogFacade.reloadIfInitialized();
				},
				error: error =>
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось удалить последствие броска.'
					)
			});
	}

	private selectConsequenceInternal(id: string) {
		this.selectedConsequenceId.set(id);
		this.patchForm(this.consequences().find(item => item.id === id) ?? null);
	}

	private patchForm(consequence: RollConsequence | null) {
		if (!consequence) {
			resetConsequenceForm(this.form);
		} else {
			patchConsequenceForm(this.form, consequence);
		}

		this.formDraft.capture();
	}
}

function createConsequenceForm(): ConsequenceForm {
	return new FormGroup({
		name: new FormControl('', {
			nonNullable: true,
			validators: [Validators.required]
		}),
		description: new FormControl('', { nonNullable: true }),
		rollEventGraph: new FormControl<RollEventGraphDefinition | null>(null),
		isActive: new FormControl(true, { nonNullable: true }),
		sortOrder: new FormControl(0, { nonNullable: true }),
		values: new FormArray<ConsequenceValueForm>([])
	});
}

function createValueForm(value: RollConsequenceValue | { id: null; name: string; description: string; isActive: boolean; sortOrder: number; }): ConsequenceValueForm {
	return new FormGroup({
		id: new FormControl(value.id),
		name: new FormControl(value.name, {
			nonNullable: true,
			validators: [Validators.required]
		}),
		description: new FormControl(value.description, { nonNullable: true }),
		isActive: new FormControl(value.isActive, { nonNullable: true }),
		sortOrder: new FormControl(value.sortOrder, { nonNullable: true })
	});
}

function patchConsequenceForm(form: ConsequenceForm, consequence: RollConsequence) {
	form.controls.values.clear({ emitEvent: false });

	for (const value of consequence.values) {
		form.controls.values.push(createValueForm(value), { emitEvent: false });
	}

	form.setValue(
		{
			name: consequence.name,
			description: consequence.description,
			rollEventGraph: consequence.rollEventGraph,
			isActive: consequence.isActive,
			sortOrder: consequence.sortOrder,
			values: consequence.values.map(value => ({
				id: value.id,
				name: value.name,
				description: value.description,
				isActive: value.isActive,
				sortOrder: value.sortOrder
			}))
		},
		{ emitEvent: false }
	);
	form.markAsPristine();
	form.markAsUntouched();
}

function resetConsequenceForm(form: ConsequenceForm) {
	form.controls.values.clear({ emitEvent: false });
	form.reset(
		{
			name: '',
			description: '',
			rollEventGraph: null,
			isActive: true,
			sortOrder: 0,
			values: []
		},
		{ emitEvent: false }
	);
	form.markAsPristine();
	form.markAsUntouched();
}

function getConsequenceFormValue(
	form: ConsequenceForm
): CreateRollConsequenceCommand {
	const raw = form.getRawValue();

	return {
		name: raw.name,
		description: raw.description,
		rollEventGraph: raw.rollEventGraph,
		isActive: raw.isActive,
		sortOrder: raw.sortOrder,
		values: raw.values.map((value): RollConsequenceValueCommand => ({
			id: value.id ?? undefined,
			name: value.name,
			description: value.description,
			isActive: value.isActive,
			sortOrder: value.sortOrder
		}))
	};
}
