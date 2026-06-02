import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { SignalFormDraft } from '../../../shared/forms/signal-form-draft';
import {
	ATTRIBUTES_REPOSITORY,
	AttributesRepository
} from '../../attributes/data/attributes-repository.port';
import { createCharacteristicOptionGroups } from '../../attributes/domain/characteristic-option-groups';
import { Attribute, Characteristic } from '../../attributes/domain/attributes.models';
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
import {
	ROLL_CONSEQUENCES_REPOSITORY,
	RollConsequencesRepository
} from '../../roll-consequences/data/roll-consequences-repository.port';
import { SKILLS_REPOSITORY, SkillsRepository } from '../data/skills-repository.port';
import { Skill } from '../domain/skills.models';
import {
	createSkillForm,
	getSkillFormValue,
	patchSkillForm,
	resetSkillForm,
	SkillFormValue
} from '../ui/forms/skill-editor.form';
import { AdminSkillDetailStore } from './admin-skill-detail.store';

@Injectable()
export class AdminSkillDetailFacade {
	private readonly destroyRef = inject(DestroyRef);
	private readonly repository = inject<SkillsRepository>(SKILLS_REPOSITORY);
	private readonly attributesRepository =
		inject<AttributesRepository>(ATTRIBUTES_REPOSITORY);
	private readonly rollConsequencesRepository =
		inject<RollConsequencesRepository>(ROLL_CONSEQUENCES_REPOSITORY);
	private readonly valuesRepository = inject<ValuesRepository>(VALUES_REPOSITORY);
	private readonly valuesCatalogFacade = inject(SystemValuesCatalogFacade);
	private readonly store = inject(AdminSkillDetailStore);
	private readonly calculationDraft = new SystemValueCalculationDraftController();

	readonly form = createSkillForm();
	private readonly formDraft = new SignalFormDraft<SkillFormValue>(
		this.form,
		() => getSkillFormValue(this.form),
		this.destroyRef
	);
	readonly activeTab = this.store.activeTab;
	readonly loading = this.store.loading;
	readonly saving = this.store.saving;
	readonly errorMessage = this.store.errorMessage;
	readonly skill = this.store.skill;
	private readonly attributes = signal<Attribute[]>([]);
	private readonly characteristics = signal<Characteristic[]>([]);
	readonly categories = this.store.categories;
	readonly rollConsequences = this.store.rollConsequences;
	readonly availableValues = this.valuesCatalogFacade.values;
	readonly systemValueCalculation = this.calculationDraft.draft;
	readonly canEditCalculation = computed(() => Boolean(this.systemValueCalculation()));
	readonly categoryOptions = computed(() =>
		this.categories().map(category => ({
			label: category.name,
			value: category.id
		}))
	);
	readonly rollConsequenceOptions = computed(() => [
		{ label: 'Без последствий', value: null },
		...this.rollConsequences().map(consequence => ({
			label: consequence.name,
			value: consequence.id
		}))
	]);
	readonly rollCharacteristicOptions = computed(() =>
		createCharacteristicOptionGroups(this.attributes(), this.characteristics())
	);
	readonly hasChanges = computed(
		() =>
			this.formDraft.hasChanges() ||
			this.calculationDraft.hasChanges()
	);

	initialize(skillId: string) {
		this.valuesCatalogFacade.ensureLoaded();
		this.store.setLoading(true);
		this.store.setErrorMessage(null);

		this.repository
			.loadSkill(skillId)
			.pipe(
				switchMap(skill =>
					forkJoin({
						skill: of(skill),
						categories: this.repository.loadCategories(),
						rollConsequences: this.rollConsequencesRepository.loadOptions(),
						attributesCatalog: this.attributesRepository.loadAdminCatalog()
					})
				),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe({
				next: ({ skill, categories, rollConsequences, attributesCatalog }) => {
					this.store.setCategories(categories);
					this.store.setRollConsequences(rollConsequences);
					this.attributes.set(attributesCatalog.attributes);
					this.characteristics.set(attributesCatalog.characteristics);
					this.store.setSkill(skill);
					this.patchDraft(skill);
					this.store.setLoading(false);
				},
				error: error => {
					this.store.setErrorMessage(
						error instanceof Error ? error.message : 'Не удалось загрузить навык.'
					);
					this.store.setLoading(false);
				}
			});
	}

	save() {
		const currentSkill = this.skill();
		const calculation = this.systemValueCalculation();

		if (
			!currentSkill ||
			!calculation ||
			this.form.invalid ||
			!this.hasChanges() ||
			this.saving()
		) {
			return;
		}

		this.store.setSaving(true);
		this.store.setErrorMessage(null);

		this.repository
			.updateSkill({ id: currentSkill.id, ...getSkillFormValue(this.form) })
			.pipe(
				switchMap(savedSkill => {
					const nextCalculation = {
						...calculation,
						id: savedSkill.systemValue.id
					} satisfies SystemValueCalculationDefinition;

					if (
						areCalculationDefinitionsEqual(
							savedSkill.systemValue,
							nextCalculation
						)
					) {
						return of(savedSkill);
					}

					return this.valuesRepository
						.updateCalculation(
							nextCalculation.id,
							nextCalculation.calculationGraph
						)
						.pipe(
							map(
								() =>
									({
										...savedSkill,
										systemValue: {
											...savedSkill.systemValue,
											calculationGraph: nextCalculation.calculationGraph
										}
									}) satisfies Skill
							)
						);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe({
				next: savedSkill => {
					this.store.setSkill(savedSkill);
					this.patchDraft(savedSkill);
					this.valuesCatalogFacade.reloadIfInitialized();
					this.store.setSaving(false);
				},
				error: error => {
					this.store.setErrorMessage(
						error instanceof Error ? error.message : 'Не удалось сохранить навык.'
					);
					this.store.setSaving(false);
				}
			});
	}

	cancel() {
		this.patchDraft(this.skill());
	}

	isSaveDisabled() {
		return this.form.invalid || !this.hasChanges() || this.saving();
	}

	setActiveTab(value: string | number | undefined) {
		if (value !== 'general' && value !== 'calculation') {
			return;
		}

		if (value === 'calculation' && !this.canEditCalculation()) {
			return;
		}

		this.store.setActiveTab(value);
	}

	updateSystemValueCalculation(next: SystemValueCalculationDefinition) {
		this.calculationDraft.update(next);
	}

	private patchDraft(skill: Skill | null) {
		if (!skill) {
			resetSkillForm(this.form);
			this.formDraft.clear();
			this.calculationDraft.clear();
			return;
		}

		patchSkillForm(this.form, skill);
		this.formDraft.capture();
		this.calculationDraft.set(skill.systemValue);
	}
}
