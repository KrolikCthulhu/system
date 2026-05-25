import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormChangeTracker } from '../../../shared/forms/form-change-tracker';
import { UnsavedChangesGuard } from '../../../shared/forms/unsaved-changes.guard';
import { SKILLS_REPOSITORY } from '../data/skills-repository.port';
import { SkillCategory } from '../domain/skills.models';
import { SkillsCatalogFacade } from './skills-catalog.facade';
import { CategoryEditorStore } from './category-editor.store';
import {
	CategoryFormValue,
	createCategoryForm,
	getCategoryFormValue,
	patchCategoryForm,
	resetCategoryForm
} from './forms/category-editor.form';

@Injectable()
export class CategoryEditorFacade {
	private readonly destroyRef = inject(DestroyRef);
	private readonly catalogFacade = inject(SkillsCatalogFacade);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly repository = inject(SKILLS_REPOSITORY);
	private readonly store = inject(CategoryEditorStore);
	private readonly changeTracker = new FormChangeTracker<CategoryFormValue>();

	readonly form = createCategoryForm();

	constructor() {
		effect(() => {
			const categories = this.catalogFacade.categories();

			if (!categories.length) {
				this.catalogFacade.setSelectedCategoryId(null);
				this.resetForm();
				return;
			}

			if (!categories.some(category => category.id === this.catalogFacade.selectedCategoryId())) {
				this.setSelectedCategoryInternal(categories[0].id);
			}
		});
	}

	selectCategory(categoryId: string) {
		if (categoryId === this.catalogFacade.selectedCategoryId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () => this.setSelectedCategoryInternal(categoryId)
		});
	}

	addCategory() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasUnsavedChanges(),
			proceed: () => {
				const id = this.createDraftId();

				this.catalogFacade.prependCategory({
					id,
					name: 'Новая категория',
					code: `new_category_${this.catalogFacade.categories().length + 1}`,
					description: '',
					isActive: true
				});
				this.store.addDraftCategoryId(id);
				this.catalogFacade.setActiveTab('categories');
				this.setSelectedCategoryInternal(id);
			}
		});
	}

	saveCategory() {
		const selectedCategoryId = this.catalogFacade.selectedCategoryId();

		if (!selectedCategoryId || this.form.invalid || !this.hasUnsavedChanges()) {
			return;
		}

		this.store.setSaving(true);

		const raw = getCategoryFormValue(this.form);
		const request$ = this.isDraftSelected()
			? this.repository.createCategory(raw)
			: this.repository.updateCategory({ id: selectedCategoryId, ...raw });

		request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: category => {
				if (this.isDraftSelected()) {
					this.catalogFacade.replaceCategory(selectedCategoryId, category);
					this.store.removeDraftCategoryId(selectedCategoryId);
					this.catalogFacade.setSelectedCategoryId(category.id);
				} else {
					this.catalogFacade.upsertCategory(category);
				}

				this.patchForm(category);
				this.store.setSaving(false);
			},
			error: () => this.store.setSaving(false)
		});
	}

	cancelCategory() {
		const selectedCategoryId = this.catalogFacade.selectedCategoryId();

		if (!selectedCategoryId) {
			return;
		}

		if (this.isDraftSelected()) {
			this.catalogFacade.removeCategory(selectedCategoryId);
			this.store.removeDraftCategoryId(selectedCategoryId);
			return;
		}

		this.patchForm(this.catalogFacade.selectedCategory());
	}

	hasUnsavedChanges() {
		return this.changeTracker.hasChanges(getCategoryFormValue(this.form));
	}

	isSaveDisabled() {
		return this.form.invalid || !this.hasUnsavedChanges() || this.store.saving();
	}

	isDraftSelected() {
		const selectedCategoryId = this.catalogFacade.selectedCategoryId();
		return !!selectedCategoryId && this.store.draftCategoryIds().includes(selectedCategoryId);
	}

	private setSelectedCategoryInternal(categoryId: string) {
		this.catalogFacade.setSelectedCategoryId(categoryId);
		this.patchForm(
			this.catalogFacade.categories().find(category => category.id === categoryId) ??
				null
		);
	}

	private patchForm(category: SkillCategory | null) {
		patchCategoryForm(this.form, category);

		if (!category) {
			this.changeTracker.clear();
			return;
		}

		this.captureFormState();
	}

	private resetForm() {
		resetCategoryForm(this.form);
		this.changeTracker.clear();
	}

	private captureFormState() {
		this.changeTracker.capture(getCategoryFormValue(this.form));
	}

	private createDraftId() {
		return `draft-category-${crypto.randomUUID()}`;
	}
}
