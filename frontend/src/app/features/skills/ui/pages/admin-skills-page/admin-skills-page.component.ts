import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
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
		IconField,
		InputIcon,
		InputNumber,
		InputText,
		ReactiveFormsModule,
		Select,
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
	private readonly catalogFacade = inject(SkillsCatalogFacade);
	private readonly skillEditorFacade = inject(SkillEditorFacade);
	private readonly categoryEditorFacade = inject(CategoryEditorFacade);
	private readonly levelEditorFacade = inject(SkillLevelEditorFacade);
	protected readonly tabValue = signal<string | number | undefined>(undefined);

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
	protected readonly categoryOptions = this.catalogFacade.categoryOptions;
	protected readonly selectedSkill = this.catalogFacade.selectedSkill;
	protected readonly selectedCategory = this.catalogFacade.selectedCategory;
	protected readonly selectedLevel = this.catalogFacade.selectedLevel;

	constructor() {
		effect(() => {
			this.tabValue.set(this.activeTab());
		});
	}

	protected setCategorySearch(query: string) {
		this.catalogFacade.setCategorySearch(query);
	}

	protected selectSkillFilterCategory(categoryId: string) {
		this.skillEditorFacade.selectSkillFilterCategory(categoryId);
	}

	protected selectSkill(skillId: string) {
		this.skillEditorFacade.selectSkill(skillId);
	}

	protected selectCategory(categoryId: string) {
		this.categoryEditorFacade.selectCategory(categoryId);
	}

	protected selectLevel(levelId: string) {
		this.levelEditorFacade.selectLevel(levelId);
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

	protected addSkill() {
		this.skillEditorFacade.addSkill();
	}

	protected addCategory() {
		this.categoryEditorFacade.addCategory();
	}

	protected saveSkill() {
		this.skillEditorFacade.saveSkill();
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
}
