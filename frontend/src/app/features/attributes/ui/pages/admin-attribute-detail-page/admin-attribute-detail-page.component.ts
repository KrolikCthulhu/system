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
import { Attribute } from '../../../domain/attributes.models';
import {
	AttributeFormValue,
	createAttributeForm,
	getAttributeFormValue,
	patchAttributeForm,
	resetAttributeForm
} from '../../forms/attribute-editor.form';

@Component({
	selector: 'app-admin-attribute-detail-page',
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
	templateUrl: './admin-attribute-detail-page.component.html',
	styleUrl: './admin-attribute-detail-page.component.scss'
})
export class AdminAttributeDetailPageComponent {
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
	private readonly changeTracker = new FormChangeTracker<AttributeFormValue>();
	private readonly calculationDraft = new SystemValueCalculationDraftController();

	protected readonly form = createAttributeForm();
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly activeTab = signal<string | number | undefined>('general');
	protected readonly attribute = signal<Attribute | null>(null);
	protected readonly availableValues = this.valuesCatalogFacade.values;
	protected readonly systemValueCalculation = this.calculationDraft.draft;
	protected readonly canEditCalculation = computed(
		() => this.systemValueCalculation()?.baseSourceType === 'computed'
	);
	protected readonly breadcrumbs = computed(() => [
		{ label: 'Правила системы', routerLink: '/admin/rules/attributes' },
		{ label: 'Атрибуты и характеристики', routerLink: '/admin/rules/attributes' },
		{ label: this.attribute()?.name ?? 'Атрибут' }
	]);

	constructor() {
		const attributeId = this.route.snapshot.paramMap.get('attributeId');

		if (!attributeId) {
			void this.router.navigate(['/admin/rules/attributes']);
			return;
		}

		this.load(attributeId);
	}

	protected saveAttribute() {
		const currentAttribute = this.attribute();
		const calculation = this.systemValueCalculation();

		if (
			!currentAttribute ||
			!calculation ||
			this.form.invalid ||
			this.isSaveDisabled()
		) {
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.updateAttribute({ id: currentAttribute.id, ...getAttributeFormValue(this.form) })
			.pipe(
				switchMap(attribute => {
					const nextCalculation = {
						...calculation,
						id: attribute.id,
						sourceType: 'attribute' as const,
						isSystemValue: attribute.systemValue.isSystemValue
					} satisfies SystemValueCalculationDefinition;

					if (areCalculationDefinitionsEqual(attribute.systemValue, nextCalculation)) {
						return of(attribute);
					}

					return this.valuesRepository
						.updateCalculation(
							nextCalculation.sourceType,
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
										...attribute,
										systemValue: {
											...attribute.systemValue,
											baseSourceType: nextCalculation.baseSourceType,
											calculationGraph:
												nextCalculation.baseSourceType === 'computed'
													? nextCalculation.calculationGraph
													: null
										}
									}) satisfies Attribute
							)
						);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe({
				next: attribute => {
					this.patchDraft(attribute);
					this.valuesCatalogFacade.reloadIfInitialized();
					this.saving.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось сохранить атрибут.'
					);
					this.saving.set(false);
				}
			});
	}

	protected cancelAttribute() {
		this.patchDraft(this.attribute());
	}

	protected isSaveDisabled() {
		return (
			this.form.invalid ||
			!(
				this.changeTracker.hasChanges(getAttributeFormValue(this.form)) ||
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

	private load(attributeId: string) {
		this.valuesCatalogFacade.ensureLoaded();
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.loadAdminCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					const attribute =
						catalog.attributes.find(item => item.id === attributeId) ?? null;
					this.patchDraft(attribute);
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось загрузить атрибут.'
					);
					this.loading.set(false);
				}
			});
	}

	private patchDraft(attribute: Attribute | null) {
		this.attribute.set(attribute);

		if (!attribute) {
			resetAttributeForm(this.form);
			this.changeTracker.clear();
			this.calculationDraft.clear();
			return;
		}

		patchAttributeForm(this.form, attribute);
		this.changeTracker.capture(getAttributeFormValue(this.form));
		this.calculationDraft.set(attribute.systemValue);
	}
}
