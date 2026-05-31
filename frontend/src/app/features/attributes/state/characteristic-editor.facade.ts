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
import { Characteristic } from '../domain/attributes.models';
import {
	CharacteristicFormValue,
	createCharacteristicForm,
	getCharacteristicFormValue,
	patchCharacteristicForm,
	resetCharacteristicForm
} from '../ui/forms/characteristic-editor.form';
import { AttributesCatalogFacade } from './attributes-catalog.facade';
import { CharacteristicEditorStore } from './characteristic-editor.store';

@Injectable()
export class CharacteristicEditorFacade {
	private readonly destroyRef = inject(DestroyRef);
	private readonly catalogFacade = inject(AttributesCatalogFacade);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly repository = inject(ATTRIBUTES_REPOSITORY);
	private readonly valuesRepository = inject<ValuesRepository>(VALUES_REPOSITORY);
	private readonly valuesCatalogFacade = inject(SystemValuesCatalogFacade);
	private readonly store = inject(CharacteristicEditorStore);
	private readonly changeTracker =
		new FormChangeTracker<CharacteristicFormValue>();
	private readonly calculationDraft = new SystemValueCalculationDraftController();

	readonly form = createCharacteristicForm();
	readonly systemValueCalculation = this.calculationDraft.draft;

	constructor() {
		effect(() => {
			const visibleCharacteristics = this.catalogFacade.visibleCharacteristics();

			if (!visibleCharacteristics.length) {
				this.catalogFacade.setSelectedCharacteristicId(null);
				this.resetForm();
				return;
			}

			if (
				!visibleCharacteristics.some(
					characteristic =>
						characteristic.id === this.catalogFacade.selectedCharacteristicId()
				)
			) {
				this.setSelectedCharacteristicInternal(visibleCharacteristics[0].id);
			}
		});
	}

	selectCharacteristicFilterAttribute(attributeId: string) {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () =>
				this.catalogFacade.setSelectedCharacteristicFilterAttributeId(attributeId)
		});
	}

	selectCharacteristic(characteristicId: string) {
		if (characteristicId === this.catalogFacade.selectedCharacteristicId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () => this.setSelectedCharacteristicInternal(characteristicId)
		});
	}

	addCharacteristic() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () => {
				const defaultAttributeId =
					this.catalogFacade.selectedCharacteristicFilterAttributeId() === 'all'
						? (this.catalogFacade.attributes()[0]?.id ?? '')
						: this.catalogFacade.selectedCharacteristicFilterAttributeId();

				if (!defaultAttributeId) {
					return;
				}

				const id = this.createDraftId();

				this.catalogFacade.prependCharacteristic({
					id,
					name: 'Новая характеристика',
					attributeId: defaultAttributeId,
					description: '',
					minValue: 0,
					maxValue: 10,
					defaultValue: 0,
					isActive: true,
					sortOrder: 0,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					systemValue: {
						...createSystemValueDefinition(
							id,
							'characteristic',
							'character-input'
						),
						calculationGraph: null
					}
				});
				this.store.addDraftCharacteristicId(id);
				this.setSelectedCharacteristicInternal(id);
			}
		});
	}

	saveCharacteristic() {
		const selectedCharacteristicId =
			this.catalogFacade.selectedCharacteristicId();
		const calculationDraft = this.systemValueCalculation();

		if (
			!selectedCharacteristicId ||
			!calculationDraft ||
			this.form.invalid ||
			!this.hasUnsavedChanges()
		) {
			return;
		}

		this.store.setSaving(true);

		const raw = getCharacteristicFormValue(this.form);
		const request$ = this.isDraftSelected()
			? this.repository.createCharacteristic(raw)
			: this.repository.updateCharacteristic({
					id: selectedCharacteristicId,
					...raw
				});

		request$
			.pipe(
				switchMap(characteristic => {
					const nextCalculation = toPersistedCalculation(
						characteristic,
						calculationDraft
					);

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
					if (this.isDraftSelected()) {
						this.catalogFacade.replaceCharacteristic(
							selectedCharacteristicId,
							characteristic
						);
						this.store.removeDraftCharacteristicId(selectedCharacteristicId);
						this.catalogFacade.setSelectedCharacteristicId(characteristic.id);
					} else {
						this.catalogFacade.upsertCharacteristic(characteristic);
					}

					this.patchForm(characteristic);
					this.valuesCatalogFacade.reloadIfInitialized();
					this.store.setSaving(false);
				},
				error: () => this.store.setSaving(false)
			});
	}

	deleteCharacteristic(characteristicId?: string) {
		const targetCharacteristicId =
			characteristicId ?? this.catalogFacade.selectedCharacteristicId();

		if (!targetCharacteristicId) {
			return;
		}

		if (this.store.draftCharacteristicIds().includes(targetCharacteristicId)) {
			this.catalogFacade.removeCharacteristic(targetCharacteristicId);
			this.store.removeDraftCharacteristicId(targetCharacteristicId);
			if (
				this.catalogFacade.selectedCharacteristicId() === targetCharacteristicId
			) {
				this.catalogFacade.setSelectedCharacteristicId(null);
			}
			return;
		}

		this.store.setSaving(true);

		this.catalogFacade
			.deleteCharacteristic(targetCharacteristicId)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.catalogFacade.removeCharacteristic(targetCharacteristicId);
					if (
						this.catalogFacade.selectedCharacteristicId() ===
						targetCharacteristicId
					) {
						this.catalogFacade.setSelectedCharacteristicId(null);
					}
					this.valuesCatalogFacade.reloadIfInitialized();
					this.store.setSaving(false);
				},
				error: () => this.store.setSaving(false)
			});
	}

	cancelCharacteristic() {
		const selectedCharacteristicId =
			this.catalogFacade.selectedCharacteristicId();

		if (!selectedCharacteristicId) {
			return;
		}

		if (this.isDraftSelected()) {
			this.catalogFacade.removeCharacteristic(selectedCharacteristicId);
			this.store.removeDraftCharacteristicId(selectedCharacteristicId);
			return;
		}

		this.patchForm(this.catalogFacade.selectedCharacteristic());
	}

	hasUnsavedChanges() {
		return (
			this.changeTracker.hasChanges(getCharacteristicFormValue(this.form)) ||
			this.calculationDraft.hasChanges()
		);
	}

	isSaveDisabled() {
		return this.form.invalid || !this.hasUnsavedChanges() || this.store.saving();
	}

	isDraftSelected() {
		const selectedCharacteristicId =
			this.catalogFacade.selectedCharacteristicId();
		return (
			!!selectedCharacteristicId &&
			this.store.draftCharacteristicIds().includes(selectedCharacteristicId)
		);
	}

	updateSystemValueCalculation(next: SystemValueCalculationDefinition) {
		this.calculationDraft.update(next);
	}

	private setSelectedCharacteristicInternal(characteristicId: string) {
		this.catalogFacade.setSelectedCharacteristicId(characteristicId);
		this.patchForm(
			this.catalogFacade
				.characteristics()
				.find(characteristic => characteristic.id === characteristicId) ?? null
		);
	}

	private patchForm(characteristic: Characteristic | null) {
		patchCharacteristicForm(this.form, characteristic);

		if (!characteristic) {
			this.changeTracker.clear();
			this.calculationDraft.clear();
			return;
		}

		this.captureFormState();
		this.calculationDraft.set(characteristic.systemValue);
	}

	private resetForm() {
		resetCharacteristicForm(this.form);
		this.changeTracker.clear();
		this.calculationDraft.clear();
	}

	private captureFormState() {
		this.changeTracker.capture(getCharacteristicFormValue(this.form));
	}

	private createDraftId() {
		return `draft-characteristic-${crypto.randomUUID()}`;
	}
}

function toPersistedCalculation(
	characteristic: Characteristic,
	draft: SystemValueCalculationDefinition
): SystemValueCalculationDefinition {
	return {
		...draft,
		id: characteristic.id,
		isSystemValue: characteristic.systemValue.isSystemValue,
		sourceType: 'characteristic'
	};
}
