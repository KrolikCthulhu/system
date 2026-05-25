import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormChangeTracker } from '../../../shared/forms/form-change-tracker';
import { UnsavedChangesGuard } from '../../../shared/forms/unsaved-changes.guard';
import { SKILLS_REPOSITORY } from '../data/skills-repository.port';
import { SkillLevel } from '../domain/skills.models';
import { calculateExpectedSuccessPerDie } from '../domain/skill-level.rules';
import { SkillsCatalogFacade } from './skills-catalog.facade';
import { LevelEditorStore } from './level-editor.store';
import {
	createLevelForm,
	getLevelFormValue,
	LevelFormValue,
	patchLevelForm,
	resetLevelForm
} from './forms/skill-level-editor.form';

@Injectable()
export class SkillLevelEditorFacade {
	private readonly destroyRef = inject(DestroyRef);
	private readonly catalogFacade = inject(SkillsCatalogFacade);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly repository = inject(SKILLS_REPOSITORY);
	private readonly store = inject(LevelEditorStore);
	private readonly changeTracker = new FormChangeTracker<LevelFormValue>();

	readonly form = createLevelForm();

	constructor() {
		effect(() => {
			const levels = this.catalogFacade.levels();

			if (!levels.length) {
				this.catalogFacade.setSelectedLevelId(null);
				this.resetForm();
				return;
			}

			if (!levels.some(level => level.id === this.catalogFacade.selectedLevelId())) {
				this.setSelectedLevelInternal(levels[0].id);
			}
		});
	}

	selectLevel(levelId: string) {
		if (levelId === this.catalogFacade.selectedLevelId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () => this.setSelectedLevelInternal(levelId)
		});
	}

	saveLevel() {
		const selectedLevelId = this.catalogFacade.selectedLevelId();

		if (!selectedLevelId || this.form.invalid || !this.hasUnsavedChanges()) {
			return;
		}

		this.store.setSaving(true);

		this.repository
			.updateLevel({ id: selectedLevelId, ...getLevelFormValue(this.form) })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: level => {
					this.catalogFacade.upsertLevel(level);
					this.patchForm(level);
					this.store.setSaving(false);
				},
				error: () => this.store.setSaving(false)
			});
	}

	cancelLevel() {
		this.patchForm(this.catalogFacade.selectedLevel());
	}

	hasUnsavedChanges() {
		return this.changeTracker.hasChanges(getLevelFormValue(this.form));
	}

	isSaveDisabled() {
		return this.form.invalid || !this.hasUnsavedChanges() || this.store.saving();
	}

	getExpectedSuccessPreview() {
		const raw = this.form.getRawValue();

		return calculateExpectedSuccessPerDie({
			canRoll: raw.canRoll,
			successMin: raw.successMin,
			doubleSuccessMin: raw.doubleSuccessMin
		}).toFixed(4);
	}

	private setSelectedLevelInternal(levelId: string) {
		this.catalogFacade.setSelectedLevelId(levelId);
		this.patchForm(
			this.catalogFacade.levels().find(level => level.id === levelId) ?? null
		);
	}

	private patchForm(level: SkillLevel | null) {
		patchLevelForm(this.form, level);

		if (!level) {
			this.changeTracker.clear();
			return;
		}

		this.captureFormState();
	}

	private resetForm() {
		resetLevelForm(this.form);
		this.changeTracker.clear();
	}

	private captureFormState() {
		this.changeTracker.capture(getLevelFormValue(this.form));
	}
}
