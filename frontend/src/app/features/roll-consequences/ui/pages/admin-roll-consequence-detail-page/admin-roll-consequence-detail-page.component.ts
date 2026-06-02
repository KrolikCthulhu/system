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
import { ActivatedRoute, Router } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
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
import { RollEventGraphEditorComponent } from '../../components/roll-event-graph-editor/roll-event-graph-editor.component';

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
	selector: 'app-admin-roll-consequence-detail-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		Breadcrumb,
		Button,
		Fluid,
		InputNumber,
		InputText,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Textarea,
		ToggleSwitch,
		RollEventGraphEditorComponent
	],
	templateUrl: './admin-roll-consequence-detail-page.component.html',
	styleUrl: './admin-roll-consequence-detail-page.component.scss'
})
export class AdminRollConsequenceDetailPageComponent {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly destroyRef = inject(DestroyRef);
	private readonly repository = inject<RollConsequencesRepository>(
		ROLL_CONSEQUENCES_REPOSITORY
	);
	private readonly valuesCatalogFacade = inject(SystemValuesCatalogFacade);

	protected readonly activeTab = signal<string | number>('general');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly consequence = signal<RollConsequence | null>(null);
	protected readonly form = createConsequenceForm();
	protected readonly valuesForm = this.form.controls.values;
	protected readonly availableValues = this.valuesCatalogFacade.values;
	private readonly formDraft = new SignalFormDraft<CreateRollConsequenceCommand>(
		this.form,
		() => getConsequenceFormValue(this.form),
		this.destroyRef
	);
	protected readonly breadcrumbs = computed(() => [
		{ label: 'Правила системы', routerLink: '/admin/rules/roll-consequences' },
		{ label: 'Последствия броска', routerLink: '/admin/rules/roll-consequences' },
		{ label: this.consequence()?.name ?? 'Последствие' }
	]);

	constructor() {
		this.valuesCatalogFacade.ensureLoaded();

		effect(() => {
			const consequenceId = this.route.snapshot.paramMap.get('consequenceId');

			if (!consequenceId) {
				void this.router.navigate(['/admin/rules/roll-consequences']);
				return;
			}

			if (!this.loading() && !this.errorMessage() && !this.consequence()) {
				void this.router.navigate(['/admin/rules/roll-consequences']);
			}
		});

		const consequenceId = this.route.snapshot.paramMap.get('consequenceId');
		if (consequenceId) {
			this.load(consequenceId);
		}
	}

	protected setActiveTab(value: string | number | undefined) {
		if (value === 'general' || value === 'values' || value === 'roll-event') {
			this.activeTab.set(value);
		}
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

	protected updateRollEventGraph(graph: RollEventGraphDefinition | null) {
		this.form.controls.rollEventGraph.setValue(graph);
		this.form.markAsDirty();
		this.formDraft.syncFromForm();
	}

	protected save() {
		const consequence = this.consequence();

		if (!consequence || this.form.invalid || this.isSaveDisabled()) {
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.update({ id: consequence.id, ...getConsequenceFormValue(this.form) })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: saved => {
					this.consequence.set(saved);
					patchConsequenceForm(this.form, saved);
					this.formDraft.capture();
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
		const consequence = this.consequence();
		if (consequence) {
			patchConsequenceForm(this.form, consequence);
			this.formDraft.capture();
		}
	}

	protected isSaveDisabled() {
		return this.form.invalid || !this.formDraft.hasChanges() || this.saving();
	}

	private load(id: string) {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.load(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: consequence => {
					this.consequence.set(consequence);
					patchConsequenceForm(this.form, consequence);
					this.formDraft.capture();
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить последствие броска.'
					);
					this.loading.set(false);
				}
			});
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

function createValueForm(
	value:
		| RollConsequenceValue
		| {
				id: null;
				name: string;
				description: string;
				isActive: boolean;
				sortOrder: number;
		  }
): ConsequenceValueForm {
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
