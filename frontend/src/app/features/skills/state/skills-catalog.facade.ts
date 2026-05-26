import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SKILLS_REPOSITORY } from '../data/skills-repository.port';
import { AdminSkillsCatalogStore, SkillsTabValue } from './admin-skills-catalog.store';

@Injectable()
export class SkillsCatalogFacade {
	private readonly destroyRef = inject(DestroyRef);
	private readonly repository = inject(SKILLS_REPOSITORY);
	private readonly store = inject(AdminSkillsCatalogStore);

	readonly breadcrumbs = this.store.breadcrumbs;
	readonly activeTab = this.store.activeTab;
	readonly categorySearch = this.store.categorySearch;
	readonly selectedSkillFilterCategoryId =
		this.store.selectedSkillFilterCategoryId;
	readonly selectedSkillId = this.store.selectedSkillId;
	readonly selectedCategoryId = this.store.selectedCategoryId;
	readonly selectedLevelId = this.store.selectedLevelId;
	readonly categories = this.store.categories;
	readonly skills = this.store.skills;
	readonly levels = this.store.levels;
	readonly filteredSkillCategories = this.store.filteredSkillCategories;
	readonly selectedSkillFilterCategory = this.store.selectedSkillFilterCategory;
	readonly visibleSkills = this.store.visibleSkills;
	readonly categoryOptions = this.store.categoryOptions;
	readonly selectedSkill = this.store.selectedSkill;
	readonly selectedCategory = this.store.selectedCategory;
	readonly selectedLevel = this.store.selectedLevel;

	constructor() {
		this.loadCatalog();
	}

	setCategorySearch(query: string) {
		this.store.setCategorySearch(query);
	}

	setActiveTab(tab: SkillsTabValue) {
		this.store.setActiveTab(tab);
	}

	setSelectedSkillFilterCategoryId(categoryId: string) {
		this.store.setSelectedSkillFilterCategoryId(categoryId);
	}

	setSelectedSkillId(skillId: string | null) {
		this.store.setSelectedSkillId(skillId);
	}

	setSelectedCategoryId(categoryId: string | null) {
		this.store.setSelectedCategoryId(categoryId);
	}

	setSelectedLevelId(levelId: string | null) {
		this.store.setSelectedLevelId(levelId);
	}

	prependSkill: typeof this.store.prependSkill = skill =>
		this.store.prependSkill(skill);
	replaceSkill: typeof this.store.replaceSkill = (currentId, skill) =>
		this.store.replaceSkill(currentId, skill);
	upsertSkill: typeof this.store.upsertSkill = skill => this.store.upsertSkill(skill);
	removeSkill: typeof this.store.removeSkill = skillId =>
		this.store.removeSkill(skillId);
	prependCategory: typeof this.store.prependCategory = category =>
		this.store.prependCategory(category);
	replaceCategory: typeof this.store.replaceCategory = (currentId, category) =>
		this.store.replaceCategory(currentId, category);
	upsertCategory: typeof this.store.upsertCategory = category =>
		this.store.upsertCategory(category);
	removeCategory: typeof this.store.removeCategory = categoryId =>
		this.store.removeCategory(categoryId);
	removeSkillsByCategory: typeof this.store.removeSkillsByCategory = categoryId =>
		this.store.removeSkillsByCategory(categoryId);
	upsertLevel: typeof this.store.upsertLevel = level => this.store.upsertLevel(level);
	removeLevel: typeof this.store.removeLevel = levelId =>
		this.store.removeLevel(levelId);

	toggleSkillActive(skillId: string, isActive: boolean) {
		const previous = this.store.skills();

		this.store.setSkills(
			previous.map(skill => (skill.id === skillId ? { ...skill, isActive } : skill))
		);

		this.repository
			.updateSkillActive({ id: skillId, isActive })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: skill => this.store.upsertSkill(skill),
				error: () => this.store.setSkills(previous)
			});
	}

	toggleCategoryActive(categoryId: string, isActive: boolean) {
		const previous = this.store.categories();

		this.store.setCategories(
			previous.map(category =>
				category.id === categoryId ? { ...category, isActive } : category
			)
		);

		this.repository
			.updateCategoryActive({ id: categoryId, isActive })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: category => this.store.upsertCategory(category),
				error: () => this.store.setCategories(previous)
			});
	}

	toggleLevelActive(levelId: string, isActive: boolean) {
		const previous = this.store.levels();

		this.store.setLevels(
			previous.map(level => (level.id === levelId ? { ...level, isActive } : level))
		);

		this.repository
			.updateLevelActive({ id: levelId, isActive })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: level => this.store.upsertLevel(level),
				error: () => this.store.setLevels(previous)
			});
	}

	deleteSkill(skillId: string) {
		return this.repository.deleteSkill(skillId);
	}

	deleteCategory(categoryId: string) {
		return this.repository.deleteCategory(categoryId);
	}

	deleteLevel(levelId: string) {
		return this.repository.deleteLevel(levelId);
	}

	private loadCatalog() {
		this.store.setLoading(true);

		this.repository
			.loadAdminCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => this.store.setCatalog(catalog),
				error: () => this.store.setLoading(false)
			});
	}
}
