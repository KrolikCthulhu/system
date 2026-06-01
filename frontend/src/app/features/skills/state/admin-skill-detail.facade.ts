import { computed, DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { FormChangeTracker } from '../../../shared/forms/form-change-tracker';
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
	private readonly valuesRepository = inject<ValuesRepository>(VALUES_REPOSITORY);
	private readonly valuesCatalogFacade = inject(SystemValuesCatalogFacade);
	private readonly store = inject(AdminSkillDetailStore);
	private readonly changeTracker = new FormChangeTracker<SkillFormValue>();
	private readonly calculationDraft = new SystemValueCalculationDraftController();

	readonly form = createSkillForm();
	readonly activeTab = this.store.activeTab;
	readonly loading = this.store.loading;
	readonly saving = this.store.saving;
	readonly errorMessage = this.store.errorMessage;
	readonly skill = this.store.skill;
	readonly categories = this.store.categories;
	readonly availableValues = this.valuesCatalogFacade.values;
	readonly systemValueCalculation = this.calculationDraft.draft;
	readonly canEditCalculation = computed(() => Boolean(this.systemValueCalculation()));
	readonly categoryOptions = computed(() =>
		this.categories().map(category => ({
			label: category.name,
			value: category.id
		}))
	);
	readonly hasChanges = computed(
		() =>
			this.changeTracker.hasChanges(getSkillFormValue(this.form)) ||
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
						categories: this.repository.loadCategories()
					})
				),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe({
				next: ({ skill, categories }) => {
					this.store.setCategories(categories);
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
			this.changeTracker.clear();
			this.calculationDraft.clear();
			return;
		}

		patchSkillForm(this.form, skill);
		this.changeTracker.capture(getSkillFormValue(this.form));
		this.calculationDraft.set(skill.systemValue);
	}
}
