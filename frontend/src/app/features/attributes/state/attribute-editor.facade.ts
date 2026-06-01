import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, of, switchMap } from 'rxjs';
import { FormChangeTracker } from '../../../shared/forms/form-change-tracker';
import { UnsavedChangesGuard } from '../../../shared/forms/unsaved-changes.guard';
import { createSystemValueDefinition } from '../../../shared/types/system-value.models';
import {
	VALUES_REPOSITORY,
	ValuesRepository
} from '../../values/data/values-repository.port';
import {
	areCalculationDefinitionsEqual,
	SystemValueCalculationDraftController
} from '../../values/domain/system-value-calculation-draft';
import { SystemValueCalculationDefinition } from '../../values/domain/system-value-calculation.models';
import { SystemValuesCatalogFacade } from '../../values/state/system-values-catalog.facade';
import { ATTRIBUTES_REPOSITORY } from '../data/attributes-repository.port';
import { Attribute } from '../domain/attributes.models';
import {
	AttributeFormValue,
	createAttributeForm,
	getAttributeFormValue,
	patchAttributeForm,
	resetAttributeForm
} from '../ui/forms/attribute-editor.form';
import { AttributeEditorStore } from './attribute-editor.store';
import { AttributesCatalogFacade } from './attributes-catalog.facade';

@Injectable()
export class AttributeEditorFacade {
	private readonly destroyRef = inject(DestroyRef);
	private readonly catalogFacade = inject(AttributesCatalogFacade);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly repository = inject(ATTRIBUTES_REPOSITORY);
	private readonly valuesRepository = inject<ValuesRepository>(VALUES_REPOSITORY);
	private readonly valuesCatalogFacade = inject(SystemValuesCatalogFacade);
	private readonly store = inject(AttributeEditorStore);
	private readonly changeTracker = new FormChangeTracker<AttributeFormValue>();
	private readonly calculationDraft = new SystemValueCalculationDraftController();

	readonly form = createAttributeForm();
	readonly systemValueCalculation = this.calculationDraft.draft;

	constructor() {
		effect(() => {
			const attributes = this.catalogFacade.attributes();

			if (!attributes.length) {
				this.catalogFacade.setSelectedAttributeId(null);
				this.resetForm();
				return;
			}

			if (
				!attributes.some(
					attribute => attribute.id === this.catalogFacade.selectedAttributeId()
				)
			) {
				this.setSelectedAttributeInternal(attributes[0].id);
			}
		});
	}

	selectAttribute(attributeId: string) {
		if (attributeId === this.catalogFacade.selectedAttributeId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () => this.setSelectedAttributeInternal(attributeId)
		});
	}

	addAttribute() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () => {
				const id = this.createDraftId();

				this.catalogFacade.prependAttribute({
					id,
					name: 'Новый атрибут',
					description: '',
					isActive: true,
					sortOrder: 0,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					systemValue: {
						...createSystemValueDefinition(id, 'computed'),
						calculationGraph: null
					}
				});
				this.store.addDraftAttributeId(id);
				this.catalogFacade.setActiveTab('attributes');
				this.setSelectedAttributeInternal(id);
			}
		});
	}

	saveAttribute(options?: { onCreated?: (attribute: Attribute) => void }) {
		const selectedAttributeId = this.catalogFacade.selectedAttributeId();
		const calculationDraft = this.systemValueCalculation();
		const isDraft = this.isDraftSelected();

		if (
			!selectedAttributeId ||
			!calculationDraft ||
			this.form.invalid ||
			!this.hasUnsavedChanges()
		) {
			return;
		}

		this.store.setSaving(true);

		const raw = getAttributeFormValue(this.form);
		const request$ = this.isDraftSelected()
			? this.repository.createAttribute(raw)
			: this.repository.updateAttribute({ id: selectedAttributeId, ...raw });

		request$
			.pipe(
				switchMap(attribute => {
					const nextCalculation = toPersistedCalculation(attribute, calculationDraft);

					if (areCalculationDefinitionsEqual(attribute.systemValue, nextCalculation)) {
						return of(attribute);
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
					if (isDraft) {
						this.catalogFacade.replaceAttribute(selectedAttributeId, attribute);
						this.store.removeDraftAttributeId(selectedAttributeId);
						this.catalogFacade.setSelectedAttributeId(attribute.id);
						options?.onCreated?.(attribute);
					} else {
						this.catalogFacade.upsertAttribute(attribute);
					}

					this.patchForm(attribute);
					this.valuesCatalogFacade.reloadIfInitialized();
					this.store.setSaving(false);
				},
				error: () => this.store.setSaving(false)
			});
	}

	deleteAttribute(attributeId?: string) {
		const targetAttributeId = attributeId ?? this.catalogFacade.selectedAttributeId();

		if (!targetAttributeId) {
			return;
		}

		if (this.store.draftAttributeIds().includes(targetAttributeId)) {
			this.catalogFacade.removeCharacteristicsByAttribute(targetAttributeId);
			this.catalogFacade.removeAttribute(targetAttributeId);
			this.store.removeDraftAttributeId(targetAttributeId);
			if (this.catalogFacade.selectedAttributeId() === targetAttributeId) {
				this.catalogFacade.setSelectedAttributeId(null);
			}
			return;
		}

		this.store.setSaving(true);

		this.catalogFacade
			.deleteAttribute(targetAttributeId)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.catalogFacade.removeCharacteristicsByAttribute(targetAttributeId);
					this.catalogFacade.removeAttribute(targetAttributeId);

					if (
						this.catalogFacade.selectedCharacteristicFilterAttributeId() ===
						targetAttributeId
					) {
						this.catalogFacade.setSelectedCharacteristicFilterAttributeId('all');
					}

					if (this.catalogFacade.selectedAttributeId() === targetAttributeId) {
						this.catalogFacade.setSelectedAttributeId(null);
					}
					this.valuesCatalogFacade.reloadIfInitialized();
					this.store.setSaving(false);
				},
				error: () => this.store.setSaving(false)
			});
	}

	cancelAttribute() {
		const selectedAttributeId = this.catalogFacade.selectedAttributeId();

		if (!selectedAttributeId) {
			return;
		}

		if (this.isDraftSelected()) {
			this.catalogFacade.removeAttribute(selectedAttributeId);
			this.store.removeDraftAttributeId(selectedAttributeId);
			return;
		}

		this.patchForm(this.catalogFacade.selectedAttribute());
	}

	hasUnsavedChanges() {
		return (
			this.changeTracker.hasChanges(getAttributeFormValue(this.form)) ||
			this.calculationDraft.hasChanges()
		);
	}

	isSaveDisabled() {
		return this.form.invalid || !this.hasUnsavedChanges() || this.store.saving();
	}

	isDraftSelected() {
		const selectedAttributeId = this.catalogFacade.selectedAttributeId();
		return !!selectedAttributeId && this.isDraftAttribute(selectedAttributeId);
	}

	isDraftAttribute(attributeId: string) {
		return this.store.draftAttributeIds().includes(attributeId);
	}

	updateSystemValueCalculation(next: SystemValueCalculationDefinition) {
		this.calculationDraft.update(next);
	}

	private setSelectedAttributeInternal(attributeId: string) {
		this.catalogFacade.setSelectedAttributeId(attributeId);
		this.patchForm(
			this.catalogFacade
				.attributes()
				.find(attribute => attribute.id === attributeId) ?? null
		);
	}

	private patchForm(attribute: Attribute | null) {
		patchAttributeForm(this.form, attribute);

		if (!attribute) {
			this.changeTracker.clear();
			this.calculationDraft.clear();
			return;
		}

		this.captureFormState();
		this.calculationDraft.set(attribute.systemValue);
	}

	private resetForm() {
		resetAttributeForm(this.form);
		this.changeTracker.clear();
		this.calculationDraft.clear();
	}

	private captureFormState() {
		this.changeTracker.capture(getAttributeFormValue(this.form));
	}

	private createDraftId() {
		return `draft-attribute-${crypto.randomUUID()}`;
	}
}

function toPersistedCalculation(
	attribute: Attribute,
	draft: SystemValueCalculationDefinition
): SystemValueCalculationDefinition {
	return {
		...draft,
		id: attribute.systemValue.id
	};
}
