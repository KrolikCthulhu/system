import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Textarea } from 'primeng/textarea';
import { FormChangeTracker } from '../../../../../shared/forms/form-change-tracker';
import {
	VALUES_REPOSITORY,
	ValuesRepository
} from '../../../../values/data/values-repository.port';
import {
	areCalculationDefinitionsEqual,
	SystemValueCalculationDraftController
} from '../../../../values/domain/system-value-calculation-draft';
import { SystemValueCalculationDefinition } from '../../../../values/domain/system-value-calculation.models';
import { SystemValuesCatalogFacade } from '../../../../values/state/system-values-catalog.facade';
import { SystemValueCalculationEditorComponent } from '../../../../values/ui/components/system-value-calculation-editor/system-value-calculation-editor.component';
import { ATTRIBUTES_REPOSITORY } from '../../../data/attributes-repository.port';
import { Attribute, Characteristic } from '../../../domain/attributes.models';
import {
	CharacteristicFormValue,
	createCharacteristicForm,
	getCharacteristicFormValue,
	patchCharacteristicForm,
	resetCharacteristicForm
} from '../../forms/characteristic-editor.form';

@Component({
	selector: 'app-admin-characteristic-detail-page',
	standalone: true,
	imports: [
		FormsModule,
		ReactiveFormsModule,
		Breadcrumb,
		Button,
		Fluid,
		InputNumber,
		InputText,
		Select,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Textarea,
		SystemValueCalculationEditorComponent
	],
	templateUrl: './admin-characteristic-detail-page.component.html',
	styleUrl: './admin-characteristic-detail-page.component.scss'
})
export class AdminCharacteristicDetailPageComponent {
	protected readonly baseSourceOptions = [
		{ label: 'Вводится у персонажа', value: 'character-input' as const },
		{ label: 'Вычисляется системой', value: 'computed' as const }
	];

	private readonly destroyRef = inject(DestroyRef);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly repository = inject(ATTRIBUTES_REPOSITORY);
	private readonly valuesRepository = inject<ValuesRepository>(VALUES_REPOSITORY);
	private readonly valuesCatalogFacade = inject(SystemValuesCatalogFacade);
	private readonly changeTracker =
		new FormChangeTracker<CharacteristicFormValue>();
	private readonly calculationDraft = new SystemValueCalculationDraftController();

	protected readonly form = createCharacteristicForm();
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly activeTab = signal<string | number | undefined>('general');
	protected readonly characteristic = signal<Characteristic | null>(null);
	protected readonly attributes = signal<Attribute[]>([]);
	protected readonly availableValues = this.valuesCatalogFacade.values;
	protected readonly systemValueCalculation = this.calculationDraft.draft;
	protected readonly canEditCalculation = computed(
		() => this.systemValueCalculation()?.baseSourceType === 'computed'
	);
	protected readonly attributeOptions = computed(() =>
		this.attributes().map(attribute => ({
			label: attribute.name,
			value: attribute.id
		}))
	);
	protected readonly breadcrumbs = computed(() => [
		{ label: 'Правила системы', routerLink: '/admin/rules/attributes' },
		{ label: 'Атрибуты и характеристики', routerLink: '/admin/rules/attributes' },
		{ label: this.characteristic()?.name ?? 'Характеристика' }
	]);

	constructor() {
		const characteristicId = this.route.snapshot.paramMap.get('characteristicId');

		if (!characteristicId) {
			void this.router.navigate(['/admin/rules/attributes']);
			return;
		}

		this.load(characteristicId);
	}

	protected saveCharacteristic() {
		const currentCharacteristic = this.characteristic();
		const calculation = this.systemValueCalculation();

		if (
			!currentCharacteristic ||
			!calculation ||
			this.form.invalid ||
			this.isSaveDisabled()
		) {
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.updateCharacteristic({
				id: currentCharacteristic.id,
				...getCharacteristicFormValue(this.form)
			})
			.pipe(
				switchMap(characteristic => {
					const nextCalculation = {
						...calculation,
						id: characteristic.systemValue.id
					} satisfies SystemValueCalculationDefinition;

					if (
						areCalculationDefinitionsEqual(
							characteristic.systemValue,
							nextCalculation
						)
					) {
						return of(characteristic);
					}

					return this.valuesRepository
						.updateCalculation(
							nextCalculation.id,
							nextCalculation.baseSourceType,
							nextCalculation.baseSourceType === 'computed'
								? nextCalculation.calculationGraph
								: null
						)
						.pipe(
							map(
								() =>
									({
										...characteristic,
										systemValue: {
											...characteristic.systemValue,
											baseSourceType: nextCalculation.baseSourceType,
											calculationGraph:
												nextCalculation.baseSourceType === 'computed'
													? nextCalculation.calculationGraph
													: null
										}
									}) satisfies Characteristic
							)
						);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe({
				next: characteristic => {
					this.patchDraft(characteristic);
					this.valuesCatalogFacade.reloadIfInitialized();
					this.saving.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось сохранить характеристику.'
					);
					this.saving.set(false);
				}
			});
	}

	protected cancelCharacteristic() {
		this.patchDraft(this.characteristic());
	}

	protected isSaveDisabled() {
		return (
			this.form.invalid ||
			!(
				this.changeTracker.hasChanges(getCharacteristicFormValue(this.form)) ||
				this.calculationDraft.hasChanges()
			) ||
			this.saving()
		);
	}

	protected updateSystemValueCalculation(next: SystemValueCalculationDefinition) {
		this.calculationDraft.update(next);
	}

	protected updateSystemValueBaseSourceType(
		baseSourceType: SystemValueCalculationDefinition['baseSourceType']
	) {
		const current = this.systemValueCalculation();
		if (!current || current.baseSourceType === baseSourceType) {
			return;
		}

		this.calculationDraft.update({
			...current,
			baseSourceType,
			calculationGraph:
				baseSourceType === 'computed' ? current.calculationGraph : null
		});

		if (baseSourceType !== 'computed' && this.activeTab() === 'calculation') {
			this.activeTab.set('general');
		}
	}

	protected setActiveTab(value: string | number | undefined) {
		if (value !== 'general' && value !== 'calculation') {
			return;
		}

		if (value === 'calculation' && !this.canEditCalculation()) {
			return;
		}

		this.activeTab.set(value);
	}

	private load(characteristicId: string) {
		this.valuesCatalogFacade.ensureLoaded();
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.loadAdminCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					const characteristic =
						catalog.characteristics.find(item => item.id === characteristicId) ??
						null;
					this.attributes.set(catalog.attributes);
					this.patchDraft(characteristic);
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить характеристику.'
					);
					this.loading.set(false);
				}
			});
	}

	private patchDraft(characteristic: Characteristic | null) {
		this.characteristic.set(characteristic);

		if (!characteristic) {
			resetCharacteristicForm(this.form);
			this.changeTracker.clear();
			this.calculationDraft.clear();
			return;
		}

		patchCharacteristicForm(this.form, characteristic);
		this.changeTracker.capture(getCharacteristicFormValue(this.form));
		this.calculationDraft.set(characteristic.systemValue);
	}
}
