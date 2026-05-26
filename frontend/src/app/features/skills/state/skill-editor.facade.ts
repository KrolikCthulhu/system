import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormChangeTracker } from '../../../shared/forms/form-change-tracker';
import { UnsavedChangesGuard } from '../../../shared/forms/unsaved-changes.guard';
import { SKILLS_REPOSITORY } from '../data/skills-repository.port';
import { Skill } from '../domain/skills.models';
import {
	createSkillForm,
	getSkillFormValue,
	patchSkillForm,
	resetSkillForm,
	SkillFormValue
} from '../ui/forms/skill-editor.form';
import { SkillsCatalogFacade } from './skills-catalog.facade';
import { SkillEditorStore } from './skill-editor.store';

@Injectable()
export class SkillEditorFacade {
	private readonly destroyRef = inject(DestroyRef);
	private readonly catalogFacade = inject(SkillsCatalogFacade);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly repository = inject(SKILLS_REPOSITORY);
	private readonly store = inject(SkillEditorStore);
	private readonly changeTracker = new FormChangeTracker<SkillFormValue>();

	readonly form = createSkillForm();

	constructor() {
		effect(() => {
			const visibleSkills = this.catalogFacade.visibleSkills();

			if (!visibleSkills.length) {
				this.catalogFacade.setSelectedSkillId(null);
				this.resetForm();
				return;
			}

			if (!visibleSkills.some(skill => skill.id === this.catalogFacade.selectedSkillId())) {
				this.setSelectedSkillInternal(visibleSkills[0].id);
			}
		});
	}

	selectSkillFilterCategory(categoryId: string) {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () => this.catalogFacade.setSelectedSkillFilterCategoryId(categoryId)
		});
	}

	selectSkill(skillId: string) {
		if (skillId === this.catalogFacade.selectedSkillId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () => this.setSelectedSkillInternal(skillId)
		});
	}

	addSkill() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () => {
				const defaultCategoryId =
					this.catalogFacade.selectedSkillFilterCategoryId() === 'all'
						? (this.catalogFacade.categories()[0]?.id ?? '')
						: this.catalogFacade.selectedSkillFilterCategoryId();
				const id = this.createDraftId();

				this.catalogFacade.prependSkill({
					id,
					name: 'Новый навык',
					code: `new_skill_${this.catalogFacade.skills().length + 1}`,
					categoryId: defaultCategoryId,
					description: '',
					defaultLevel: 0,
					maxLevel: 6,
					usesDefaultLevelRules: true,
					isActive: true
				});
				this.store.addDraftSkillId(id);
				this.setSelectedSkillInternal(id);
			}
		});
	}

	saveSkill() {
		const selectedSkillId = this.catalogFacade.selectedSkillId();

		if (!selectedSkillId || this.form.invalid || !this.hasUnsavedChanges()) {
			return;
		}

		this.store.setSaving(true);

		const raw = getSkillFormValue(this.form);
		const request$ = this.isDraftSelected()
			? this.repository.createSkill(raw)
			: this.repository.updateSkill({ id: selectedSkillId, ...raw });

		request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: skill => {
				if (this.isDraftSelected()) {
					this.catalogFacade.replaceSkill(selectedSkillId, skill);
					this.store.removeDraftSkillId(selectedSkillId);
					this.catalogFacade.setSelectedSkillId(skill.id);
				} else {
					this.catalogFacade.upsertSkill(skill);
				}

				this.patchForm(skill);
				this.store.setSaving(false);
			},
			error: () => this.store.setSaving(false)
		});
	}

	deleteSkill(skillId?: string) {
		const targetSkillId = skillId ?? this.catalogFacade.selectedSkillId();

		if (!targetSkillId) {
			return;
		}

		if (this.store.draftSkillIds().includes(targetSkillId)) {
			this.catalogFacade.removeSkill(targetSkillId);
			this.store.removeDraftSkillId(targetSkillId);
			if (this.catalogFacade.selectedSkillId() === targetSkillId) {
				this.catalogFacade.setSelectedSkillId(null);
			}
			return;
		}

		this.store.setSaving(true);

		this.catalogFacade
			.deleteSkill(targetSkillId)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.catalogFacade.removeSkill(targetSkillId);
					if (this.catalogFacade.selectedSkillId() === targetSkillId) {
						this.catalogFacade.setSelectedSkillId(null);
					}
					this.store.setSaving(false);
				},
				error: () => this.store.setSaving(false)
			});
	}

	cancelSkill() {
		const selectedSkillId = this.catalogFacade.selectedSkillId();

		if (!selectedSkillId) {
			return;
		}

		if (this.isDraftSelected()) {
			this.catalogFacade.removeSkill(selectedSkillId);
			this.store.removeDraftSkillId(selectedSkillId);
			return;
		}

		this.patchForm(this.catalogFacade.selectedSkill());
	}

	hasUnsavedChanges() {
		return this.changeTracker.hasChanges(getSkillFormValue(this.form));
	}

	isSaveDisabled() {
		return this.form.invalid || !this.hasUnsavedChanges() || this.store.saving();
	}

	isDraftSelected() {
		const selectedSkillId = this.catalogFacade.selectedSkillId();
		return !!selectedSkillId && this.store.draftSkillIds().includes(selectedSkillId);
	}

	private setSelectedSkillInternal(skillId: string) {
		this.catalogFacade.setSelectedSkillId(skillId);
		this.patchForm(
			this.catalogFacade.skills().find(skill => skill.id === skillId) ?? null
		);
	}

	private patchForm(skill: Skill | null) {
		patchSkillForm(this.form, skill);

		if (!skill) {
			this.changeTracker.clear();
			return;
		}

		this.captureFormState();
	}

	private resetForm() {
		resetSkillForm(this.form);
		this.changeTracker.clear();
	}

	private captureFormState() {
		this.changeTracker.capture(getSkillFormValue(this.form));
	}

	private createDraftId() {
		return `draft-skill-${crypto.randomUUID()}`;
	}
}
