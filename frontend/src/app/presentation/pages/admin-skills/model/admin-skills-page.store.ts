import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Skill, SkillCategory, SkillLevel } from '../../../../domain/skills/skills.models';
import { calculateExpectedSuccessPerDie } from '../../../../domain/skills/skill-level.rules';
import {
	CreateSkillCategoryUseCase,
	CreateSkillUseCase,
	LoadSkillsAdminCatalogUseCase,
	UpdateSkillActiveUseCase,
	UpdateSkillCategoryActiveUseCase,
	UpdateSkillCategoryUseCase,
	UpdateSkillLevelActiveUseCase,
	UpdateSkillLevelUseCase,
	UpdateSkillUseCase
} from '../../../../use-cases/skills/use-cases';
import {
	CategoryForm,
	createCategoryForm,
	patchCategoryForm,
	resetCategoryForm
} from './category-editor.form';
import {
	createLevelForm,
	LevelForm,
	patchLevelForm,
	resetLevelForm
} from './skill-level-editor.form';
import {
	createSkillForm,
	patchSkillForm,
	resetSkillForm,
	SkillForm
} from './skill-editor.form';

export type SkillsTabValue = 'skills' | 'categories' | 'levels';

export interface SkillCategoryFilterItem {
	id: string;
	name: string;
	count: number;
}

@Injectable()
export class AdminSkillsPageStore {
	private readonly destroyRef = inject(DestroyRef);
	private readonly loadCatalogUseCase = inject(LoadSkillsAdminCatalogUseCase);
	private readonly createSkillUseCase = inject(CreateSkillUseCase);
	private readonly updateSkillUseCase = inject(UpdateSkillUseCase);
	private readonly updateSkillActiveUseCase = inject(UpdateSkillActiveUseCase);
	private readonly createCategoryUseCase = inject(CreateSkillCategoryUseCase);
	private readonly updateCategoryUseCase = inject(UpdateSkillCategoryUseCase);
	private readonly updateCategoryActiveUseCase = inject(
		UpdateSkillCategoryActiveUseCase
	);
	private readonly updateLevelUseCase = inject(UpdateSkillLevelUseCase);
	private readonly updateLevelActiveUseCase = inject(
		UpdateSkillLevelActiveUseCase
	);

	readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Навыки' }
	];

	readonly activeTab = signal<SkillsTabValue>('skills');
	readonly categorySearch = signal('');
	readonly selectedSkillFilterCategoryId = signal<string>('all');
	readonly selectedSkillId = signal<string | null>(null);
	readonly selectedCategoryId = signal<string | null>(null);
	readonly selectedLevelId = signal<string | null>(null);

	readonly loading = signal(true);
	readonly savingSkill = signal(false);
	readonly savingCategory = signal(false);
	readonly savingLevel = signal(false);

	private readonly draftSkillIds = signal<Set<string>>(new Set());
	private readonly draftCategoryIds = signal<Set<string>>(new Set());

	readonly categories = signal<SkillCategory[]>([]);
	readonly skills = signal<Skill[]>([]);
	readonly levels = signal<SkillLevel[]>([]);

	readonly skillForm: SkillForm = createSkillForm();
	readonly categoryForm: CategoryForm = createCategoryForm();
	readonly levelForm: LevelForm = createLevelForm();

	readonly skillCategoryFilters = computed<SkillCategoryFilterItem[]>(() => {
		const skills = this.skills();
		const categories = this.categories().map(category => ({
			id: category.id,
			name: category.name,
			count: skills.filter(skill => skill.categoryId === category.id).length
		}));

		return [{ id: 'all', name: 'Все навыки', count: skills.length }, ...categories];
	});

	readonly filteredSkillCategories = computed(() => {
		const query = this.categorySearch().trim().toLowerCase();

		if (!query) {
			return this.skillCategoryFilters();
		}

		return this.skillCategoryFilters().filter(category =>
			category.name.toLowerCase().includes(query)
		);
	});

	readonly selectedSkillFilterCategory = computed(
		() =>
			this.skillCategoryFilters().find(
				category => category.id === this.selectedSkillFilterCategoryId()
			) ?? this.skillCategoryFilters()[0]
	);

	readonly visibleSkills = computed(() => {
		const filterCategoryId = this.selectedSkillFilterCategoryId();

		if (filterCategoryId === 'all') {
			return this.skills();
		}

		return this.skills().filter(skill => skill.categoryId === filterCategoryId);
	});

	readonly categoryOptions = computed(() =>
		this.categories().map(category => ({
			label: category.name,
			value: category.id
		}))
	);

	readonly selectedSkill = computed(() => {
		const selectedSkillId = this.selectedSkillId();
		return this.skills().find(skill => skill.id === selectedSkillId) ?? null;
	});

	readonly selectedCategory = computed(() => {
		const selectedCategoryId = this.selectedCategoryId();
		return (
			this.categories().find(category => category.id === selectedCategoryId) ??
			null
		);
	});

	readonly selectedLevel = computed(() => {
		const selectedLevelId = this.selectedLevelId();
		return this.levels().find(level => level.id === selectedLevelId) ?? null;
	});

	constructor() {
		effect(() => {
			const visibleSkills = this.visibleSkills();

			if (!visibleSkills.length) {
				this.selectedSkillId.set(null);
				resetSkillForm(this.skillForm);
				return;
			}

			if (!visibleSkills.some(skill => skill.id === this.selectedSkillId())) {
				this.setSelectedSkillInternal(visibleSkills[0].id);
			}
		});

		effect(() => {
			const categories = this.categories();

			if (!categories.length) {
				this.selectedCategoryId.set(null);
				resetCategoryForm(this.categoryForm);
				return;
			}

			if (!categories.some(category => category.id === this.selectedCategoryId())) {
				this.setSelectedCategoryInternal(categories[0].id);
			}
		});

		effect(() => {
			const levels = this.levels();

			if (!levels.length) {
				this.selectedLevelId.set(null);
				resetLevelForm(this.levelForm);
				return;
			}

			if (!levels.some(level => level.id === this.selectedLevelId())) {
				this.setSelectedLevelInternal(levels[0].id);
			}
		});

		this.loadCatalog();
	}

	selectSkillFilterCategory(categoryId: string) {
		if (
			categoryId !== this.selectedSkillFilterCategoryId() &&
			!this.canLeaveEditor('skill')
		) {
			return;
		}

		this.selectedSkillFilterCategoryId.set(categoryId);
	}

	selectSkill(skillId: string) {
		if (skillId === this.selectedSkillId()) {
			return;
		}

		if (!this.canLeaveEditor('skill')) {
			return;
		}

		this.setSelectedSkillInternal(skillId);
	}

	selectCategory(categoryId: string) {
		if (categoryId === this.selectedCategoryId()) {
			return;
		}

		if (!this.canLeaveEditor('category')) {
			return;
		}

		this.setSelectedCategoryInternal(categoryId);
	}

	selectLevel(levelId: string) {
		if (levelId === this.selectedLevelId()) {
			return;
		}

		if (!this.canLeaveEditor('level')) {
			return;
		}

		this.setSelectedLevelInternal(levelId);
	}

	toggleSkillActive(skillId: string, isActive: boolean) {
		const previous = this.skills();

		this.skills.update(skills =>
			skills.map(skill => (skill.id === skillId ? { ...skill, isActive } : skill))
		);

		this.updateSkillActiveUseCase
			.execute({ id: skillId, isActive })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: skill => {
					this.skills.update(skills =>
						skills.map(item => (item.id === skill.id ? skill : item))
					);
				},
				error: () => {
					this.skills.set(previous);
				}
			});
	}

	toggleCategoryActive(categoryId: string, isActive: boolean) {
		const previous = this.categories();

		this.categories.update(categories =>
			categories.map(category =>
				category.id === categoryId ? { ...category, isActive } : category
			)
		);

		this.updateCategoryActiveUseCase
			.execute({ id: categoryId, isActive })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: category => {
					this.categories.update(categories =>
						categories.map(item => (item.id === category.id ? category : item))
					);
				},
				error: () => {
					this.categories.set(previous);
				}
			});
	}

	toggleLevelActive(levelId: string, isActive: boolean) {
		const previous = this.levels();

		this.levels.update(levels =>
			levels.map(level => (level.id === levelId ? { ...level, isActive } : level))
		);

		this.updateLevelActiveUseCase
			.execute({ id: levelId, isActive })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: level => {
					this.levels.update(levels =>
						levels.map(item => (item.id === level.id ? level : item))
					);
				},
				error: () => {
					this.levels.set(previous);
				}
			});
	}

	addSkill() {
		if (!this.canLeaveEditor('skill')) {
			return;
		}

		const defaultCategoryId =
			this.selectedSkillFilterCategoryId() === 'all'
				? (this.categories()[0]?.id ?? '')
				: this.selectedSkillFilterCategoryId();
		const id = this.createDraftId('skill');

		this.skills.update(skills => [
			{
				id,
				name: 'Новый навык',
				code: `new_skill_${skills.length + 1}`,
				categoryId: defaultCategoryId,
				description: '',
				defaultLevel: 0,
				maxLevel: 6,
				usesDefaultLevelRules: true,
				isActive: true
			},
			...skills
		]);

		this.draftSkillIds.update(ids => new Set(ids).add(id));
		this.setSelectedSkillInternal(id);
	}

	addCategory() {
		if (!this.canLeaveEditor('category')) {
			return;
		}

		const id = this.createDraftId('category');

		this.categories.update(categories => [
			{
				id,
				name: 'Новая категория',
				code: `new_category_${categories.length + 1}`,
				description: '',
				isActive: true
			},
			...categories
		]);

		this.draftCategoryIds.update(ids => new Set(ids).add(id));
		this.activeTab.set('categories');
		this.setSelectedCategoryInternal(id);
	}

	saveSkill() {
		const selectedSkillId = this.selectedSkillId();

		if (!selectedSkillId || this.skillForm.invalid || !this.skillForm.dirty) {
			return;
		}

		this.savingSkill.set(true);

		const raw = this.skillForm.getRawValue();
		const request$ = this.isDraftSkillSelected()
			? this.createSkillUseCase.execute(raw)
			: this.updateSkillUseCase.execute({ id: selectedSkillId, ...raw });

		request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: skill => {
				if (this.isDraftSkillSelected()) {
					this.skills.update(skills =>
						skills.map(item => (item.id === selectedSkillId ? skill : item))
					);
					this.draftSkillIds.update(ids => {
						const next = new Set(ids);
						next.delete(selectedSkillId);
						return next;
					});
					this.selectedSkillId.set(skill.id);
				} else {
					this.skills.update(skills =>
						skills.map(item => (item.id === skill.id ? skill : item))
					);
				}

				patchSkillForm(this.skillForm, skill);
				this.savingSkill.set(false);
			},
			error: () => {
				this.savingSkill.set(false);
			}
		});
	}

	cancelSkill() {
		const selectedSkillId = this.selectedSkillId();

		if (!selectedSkillId) {
			return;
		}

		if (this.isDraftSkillSelected()) {
			this.skills.update(skills =>
				skills.filter(skill => skill.id !== selectedSkillId)
			);
			this.draftSkillIds.update(ids => {
				const next = new Set(ids);
				next.delete(selectedSkillId);
				return next;
			});
			return;
		}

		patchSkillForm(this.skillForm, this.selectedSkill());
	}

	saveCategory() {
		const selectedCategoryId = this.selectedCategoryId();

		if (
			!selectedCategoryId ||
			this.categoryForm.invalid ||
			!this.categoryForm.dirty
		) {
			return;
		}

		this.savingCategory.set(true);

		const raw = this.categoryForm.getRawValue();
		const request$ = this.isDraftCategorySelected()
			? this.createCategoryUseCase.execute(raw)
			: this.updateCategoryUseCase.execute({ id: selectedCategoryId, ...raw });

		request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: category => {
				if (this.isDraftCategorySelected()) {
					this.categories.update(categories =>
						categories.map(item =>
							item.id === selectedCategoryId ? category : item
						)
					);
					this.draftCategoryIds.update(ids => {
						const next = new Set(ids);
						next.delete(selectedCategoryId);
						return next;
					});
					this.selectedCategoryId.set(category.id);
				} else {
					this.categories.update(categories =>
						categories.map(item => (item.id === category.id ? category : item))
					);
				}

				patchCategoryForm(this.categoryForm, category);
				this.savingCategory.set(false);
			},
			error: () => {
				this.savingCategory.set(false);
			}
		});
	}

	cancelCategory() {
		const selectedCategoryId = this.selectedCategoryId();

		if (!selectedCategoryId) {
			return;
		}

		if (this.isDraftCategorySelected()) {
			this.categories.update(categories =>
				categories.filter(category => category.id !== selectedCategoryId)
			);
			this.draftCategoryIds.update(ids => {
				const next = new Set(ids);
				next.delete(selectedCategoryId);
				return next;
			});
			return;
		}

		patchCategoryForm(this.categoryForm, this.selectedCategory());
	}

	saveLevel() {
		const selectedLevelId = this.selectedLevelId();

		if (!selectedLevelId || this.levelForm.invalid || !this.levelForm.dirty) {
			return;
		}

		this.savingLevel.set(true);

		this.updateLevelUseCase
			.execute({ id: selectedLevelId, ...this.levelForm.getRawValue() })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: level => {
					this.levels.update(levels =>
						levels.map(item => (item.id === level.id ? level : item))
					);
					patchLevelForm(this.levelForm, level);
					this.savingLevel.set(false);
				},
				error: () => {
					this.savingLevel.set(false);
				}
			});
	}

	cancelLevel() {
		patchLevelForm(this.levelForm, this.selectedLevel());
	}

	setActiveTab(value: string | number | undefined) {
		if (value !== 'skills' && value !== 'categories' && value !== 'levels') {
			return;
		}

		if (value !== this.activeTab() && !this.canLeaveCurrentTab()) {
			return;
		}

		this.activeTab.set(value);
	}

	isSkillSaveDisabled() {
		return this.skillForm.invalid || !this.skillForm.dirty || this.savingSkill();
	}

	isCategorySaveDisabled() {
		return (
			this.categoryForm.invalid ||
			!this.categoryForm.dirty ||
			this.savingCategory()
		);
	}

	isLevelSaveDisabled() {
		return this.levelForm.invalid || !this.levelForm.dirty || this.savingLevel();
	}

	isDraftSkillSelected() {
		const selectedSkillId = this.selectedSkillId();
		return selectedSkillId ? this.draftSkillIds().has(selectedSkillId) : false;
	}

	isDraftCategorySelected() {
		const selectedCategoryId = this.selectedCategoryId();
		return selectedCategoryId
			? this.draftCategoryIds().has(selectedCategoryId)
			: false;
	}

	getExpectedSuccessPreview() {
		const raw = this.levelForm.getRawValue();

		return calculateExpectedSuccessPerDie({
			canRoll: raw.canRoll,
			successMin: raw.successMin,
			doubleSuccessMin: raw.doubleSuccessMin
		}).toFixed(4);
	}

	private loadCatalog() {
		this.loading.set(true);

		this.loadCatalogUseCase
			.execute()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.categories.set(catalog.categories);
					this.skills.set(catalog.skills);
					this.levels.set(catalog.levels);
					this.loading.set(false);
				},
				error: () => {
					this.loading.set(false);
				}
			});
	}

	private canLeaveCurrentTab() {
		switch (this.activeTab()) {
			case 'skills':
				return this.canLeaveEditor('skill');
			case 'categories':
				return this.canLeaveEditor('category');
			case 'levels':
				return this.canLeaveEditor('level');
		}
	}

	private canLeaveEditor(type: 'skill' | 'category' | 'level') {
		const form =
			type === 'skill'
				? this.skillForm
				: type === 'category'
					? this.categoryForm
					: this.levelForm;

		if (!form.dirty) {
			return true;
		}

		return window.confirm(
			'Есть несохранённые изменения. Сбросить их и продолжить?'
		);
	}

	private setSelectedSkillInternal(skillId: string) {
		this.selectedSkillId.set(skillId);
		patchSkillForm(
			this.skillForm,
			this.skills().find(skill => skill.id === skillId) ?? null
		);
	}

	private setSelectedCategoryInternal(categoryId: string) {
		this.selectedCategoryId.set(categoryId);
		patchCategoryForm(
			this.categoryForm,
			this.categories().find(category => category.id === categoryId) ?? null
		);
	}

	private setSelectedLevelInternal(levelId: string) {
		this.selectedLevelId.set(levelId);
		patchLevelForm(
			this.levelForm,
			this.levels().find(level => level.id === levelId) ?? null
		);
	}

	private createDraftId(prefix: string) {
		return `draft-${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
	}
}
