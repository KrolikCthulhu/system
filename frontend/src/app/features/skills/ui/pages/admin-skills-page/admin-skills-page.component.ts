import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Fluid } from 'primeng/fluid';
import { Select } from 'primeng/select';
import { Splitter } from 'primeng/splitter';
import { TableModule } from 'primeng/table';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import {
	Skill,
	SkillCategory,
	SkillLevel
} from '../../../domain/skills.models';
import { AdminSkillsCatalogStore } from '../../../state/admin-skills-catalog.store';
import { CategoryEditorFacade } from '../../../state/category-editor.facade';
import { CategoryEditorStore } from '../../../state/category-editor.store';
import { LevelEditorStore } from '../../../state/level-editor.store';
import { SkillEditorFacade } from '../../../state/skill-editor.facade';
import { SkillEditorStore } from '../../../state/skill-editor.store';
import { SkillLevelEditorFacade } from '../../../state/skill-level-editor.facade';
import { SkillsCatalogFacade } from '../../../state/skills-catalog.facade';

@Component({
	selector: 'app-admin-skills-page',
	imports: [
		Breadcrumb,
		Button,
		ConfirmDialog,
		FormsModule,
		Fluid,
		IconField,
		InputIcon,
		InputNumber,
		InputText,
		ReactiveFormsModule,
		Select,
		Splitter,
		Tab,
		TableModule,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Textarea,
		ToggleSwitch
	],
	templateUrl: './admin-skills-page.component.html',
	styleUrl: './admin-skills-page.component.scss',
	providers: [
		ConfirmationService,
		AdminSkillsCatalogStore,
		SkillEditorStore,
		CategoryEditorStore,
		LevelEditorStore,
		UnsavedChangesGuard,
		SkillsCatalogFacade,
		SkillEditorFacade,
		CategoryEditorFacade,
		SkillLevelEditorFacade
	]
})
export class AdminSkillsPageComponent {
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly router = inject(Router);
	private readonly catalogFacade = inject(SkillsCatalogFacade);
	private readonly skillEditorFacade = inject(SkillEditorFacade);
	private readonly categoryEditorFacade = inject(CategoryEditorFacade);
	private readonly levelEditorFacade = inject(SkillLevelEditorFacade);

	protected readonly tabValue = signal<string | number | undefined>(undefined);
	protected readonly skillEditorOpen = signal(false);
	protected readonly categoryEditorOpen = signal(false);
	protected readonly levelEditorOpen = signal(false);

	protected readonly breadcrumbs = this.catalogFacade.breadcrumbs;
	protected readonly activeTab = this.catalogFacade.activeTab;
	protected readonly categorySearch = this.catalogFacade.categorySearch;
	protected readonly selectedSkillFilterCategoryId =
		this.catalogFacade.selectedSkillFilterCategoryId;
	protected readonly selectedSkillId = this.catalogFacade.selectedSkillId;
	protected readonly selectedCategoryId = this.catalogFacade.selectedCategoryId;
	protected readonly selectedLevelId = this.catalogFacade.selectedLevelId;
	protected readonly categories = this.catalogFacade.categories;
	protected readonly levels = this.catalogFacade.levels;
	protected readonly skillForm = this.skillEditorFacade.form;
	protected readonly categoryForm = this.categoryEditorFacade.form;
	protected readonly levelForm = this.levelEditorFacade.form;
	protected readonly filteredSkillCategories =
		this.catalogFacade.filteredSkillCategories;
	protected readonly selectedSkillFilterCategory =
		this.catalogFacade.selectedSkillFilterCategory;
	protected readonly visibleSkills = this.catalogFacade.visibleSkills;
	protected readonly tableSkills = computed(() =>
		this.visibleSkills().filter(skill => !this.isDraftSkill(skill.id))
	);
	protected readonly categoryOptions = this.catalogFacade.categoryOptions;
	protected readonly selectedSkill = this.catalogFacade.selectedSkill;
	protected readonly selectedCategory = this.catalogFacade.selectedCategory;
	protected readonly selectedLevel = this.catalogFacade.selectedLevel;

	constructor() {
		effect(() => {
			this.tabValue.set(this.activeTab());
		});

		effect(() => {
			if (this.skillEditorOpen() && !this.selectedSkill()) {
				this.skillEditorOpen.set(false);
			}
		});

		effect(() => {
			if (this.categoryEditorOpen() && !this.selectedCategory()) {
				this.categoryEditorOpen.set(false);
			}
		});

		effect(() => {
			if (this.levelEditorOpen() && !this.selectedLevel()) {
				this.levelEditorOpen.set(false);
			}
		});
	}

	protected setCategorySearch(query: string) {
		this.catalogFacade.setCategorySearch(query);
	}

	protected selectSkillFilterCategory(categoryId: string) {
		this.skillEditorFacade.selectSkillFilterCategory(categoryId);
	}

	protected toggleSkillActive(skillId: string, isActive: boolean) {
		this.catalogFacade.toggleSkillActive(skillId, isActive);
	}

	protected toggleCategoryActive(categoryId: string, isActive: boolean) {
		this.catalogFacade.toggleCategoryActive(categoryId, isActive);
	}

	protected toggleLevelActive(levelId: string, isActive: boolean) {
		this.catalogFacade.toggleLevelActive(levelId, isActive);
	}

	protected openSkillEditor(skillId: string) {
		void this.router.navigate(['/admin/rules/skills', skillId]);
	}

	protected openCategoryEditor(categoryId: string) {
		this.categoryEditorFacade.selectCategory(categoryId);
		this.categoryEditorOpen.set(true);
	}

	protected openLevelEditor(levelId: string) {
		this.levelEditorFacade.selectLevel(levelId);
		this.levelEditorOpen.set(true);
	}

	protected closeSkillEditor() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.skillEditorFacade.hasUnsavedChanges(),
			discard: () => this.skillEditorFacade.cancelSkill(),
			proceed: () => this.skillEditorOpen.set(false)
		});
	}

	protected closeCategoryEditor() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.categoryEditorFacade.hasUnsavedChanges(),
			discard: () => this.categoryEditorFacade.cancelCategory(),
			proceed: () => this.categoryEditorOpen.set(false)
		});
	}

	protected closeLevelEditor() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.levelEditorFacade.hasUnsavedChanges(),
			discard: () => this.levelEditorFacade.cancelLevel(),
			proceed: () => this.levelEditorOpen.set(false)
		});
	}

	protected addSkill() {
		this.skillEditorFacade.addSkill();
		this.skillEditorOpen.set(true);
	}

	protected addCategory() {
		this.categoryEditorFacade.addCategory();
		this.categoryEditorOpen.set(true);
	}

	protected saveSkill() {
		this.skillEditorFacade.saveSkill({
			onCreated: skill => {
				this.skillEditorOpen.set(false);
				void this.router.navigate(['/admin/rules/skills', skill.id]);
			}
		});
	}

	protected cancelSkill() {
		this.skillEditorFacade.cancelSkill();
	}

	protected saveCategory() {
		this.categoryEditorFacade.saveCategory();
	}

	protected cancelCategory() {
		this.categoryEditorFacade.cancelCategory();
	}

	protected saveLevel() {
		this.levelEditorFacade.saveLevel();
	}

	protected cancelLevel() {
		this.levelEditorFacade.cancelLevel();
	}

	protected confirmDeleteSkill(skill: Skill) {
		this.confirmationService.confirm({
			header: 'Удалить навык?',
			message: `Навык "${skill.name}" будет удалён без возможности восстановления.`,
			icon: 'pi pi-trash',
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.skillEditorFacade.deleteSkill(skill.id)
		});
	}

	protected confirmDeleteCategory(category: SkillCategory) {
		const relatedSkillsCount = this.countCategorySkills(category.id);
		const message =
			relatedSkillsCount > 0
				? `Категория "${category.name}" будет удалена вместе со связанными навыками (${relatedSkillsCount}). Это действие нельзя отменить.`
				: `Категория "${category.name}" будет удалена без возможности восстановления.`;

		this.confirmationService.confirm({
			header: 'Удалить категорию?',
			message,
			icon: 'pi pi-trash',
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.categoryEditorFacade.deleteCategory(category.id)
		});
	}

	protected confirmDeleteLevel(level: SkillLevel) {
		this.confirmationService.confirm({
			header: 'Удалить уровень?',
			message: `Уровень "${level.name}" будет удалён без возможности восстановления.`,
			icon: 'pi pi-trash',
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.levelEditorFacade.deleteLevel(level.id)
		});
	}

	protected setActiveTab(value: string | number | undefined) {
		if (value !== 'skills' && value !== 'categories' && value !== 'levels') {
			return;
		}

		const currentTab = this.activeTab();

		if (value === currentTab) {
			return;
		}

		this.tabValue.set(currentTab);

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasCurrentTabUnsavedChanges(),
			discard: () => this.discardCurrentTabChanges(),
			proceed: () => this.catalogFacade.setActiveTab(value)
		});
	}

	protected requestActiveTabChange(
		event: Event,
		value: 'skills' | 'categories' | 'levels'
	) {
		event.preventDefault();
		event.stopPropagation();
		this.setActiveTab(value);
	}

	protected isSkillSaveDisabled() {
		return this.skillEditorFacade.isSaveDisabled();
	}

	protected isCategorySaveDisabled() {
		return this.categoryEditorFacade.isSaveDisabled();
	}

	protected isLevelSaveDisabled() {
		return this.levelEditorFacade.isSaveDisabled();
	}

	protected isDraftSkillSelected() {
		return this.skillEditorFacade.isDraftSelected();
	}

	protected isDraftSkill(skillId: string) {
		return this.skillEditorFacade.isDraftSkill(skillId);
	}

	protected isDraftCategorySelected() {
		return this.categoryEditorFacade.isDraftSelected();
	}

	protected getExpectedSuccessPreview() {
		return this.levelEditorFacade.getExpectedSuccessPreview();
	}

	private hasCurrentTabUnsavedChanges() {
		switch (this.activeTab()) {
			case 'skills':
				return this.skillEditorFacade.hasUnsavedChanges();
			case 'categories':
				return this.categoryEditorFacade.hasUnsavedChanges();
			case 'levels':
				return this.levelEditorFacade.hasUnsavedChanges();
		}
	}

	private discardCurrentTabChanges() {
		switch (this.activeTab()) {
			case 'skills':
				this.skillEditorFacade.cancelSkill();
				return;
			case 'categories':
				this.categoryEditorFacade.cancelCategory();
				return;
			case 'levels':
				this.levelEditorFacade.cancelLevel();
				return;
		}
	}

	private countCategorySkills(categoryId: string) {
		return this.catalogFacade
			.skills()
			.filter(skill => skill.categoryId === categoryId).length;
	}
}
