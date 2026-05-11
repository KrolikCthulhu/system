import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { AdminSkillsPageStore } from '../model/admin-skills-page.store';

@Component({
	selector: 'app-admin-skills-page',
	imports: [
		Breadcrumb,
		Button,
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
	providers: [AdminSkillsPageStore]
})
export class AdminSkillsPageComponent {
	private readonly store = inject(AdminSkillsPageStore);

	protected readonly breadcrumbs = this.store.breadcrumbs;
	protected readonly activeTab = this.store.activeTab;
	protected readonly categorySearch = this.store.categorySearch;
	protected readonly selectedSkillFilterCategoryId =
		this.store.selectedSkillFilterCategoryId;
	protected readonly selectedSkillId = this.store.selectedSkillId;
	protected readonly selectedCategoryId = this.store.selectedCategoryId;
	protected readonly selectedLevelId = this.store.selectedLevelId;

	protected readonly categories = this.store.categories;
	protected readonly levels = this.store.levels;
	protected readonly skillForm = this.store.skillForm;
	protected readonly categoryForm = this.store.categoryForm;
	protected readonly levelForm = this.store.levelForm;

	protected readonly filteredSkillCategories =
		this.store.filteredSkillCategories;
	protected readonly selectedSkillFilterCategory =
		this.store.selectedSkillFilterCategory;
	protected readonly visibleSkills = this.store.visibleSkills;
	protected readonly categoryOptions = this.store.categoryOptions;
	protected readonly selectedSkill = this.store.selectedSkill;
	protected readonly selectedCategory = this.store.selectedCategory;
	protected readonly selectedLevel = this.store.selectedLevel;

	protected selectSkillFilterCategory(categoryId: string) {
		this.store.selectSkillFilterCategory(categoryId);
	}

	protected selectSkill(skillId: string) {
		this.store.selectSkill(skillId);
	}

	protected selectCategory(categoryId: string) {
		this.store.selectCategory(categoryId);
	}

	protected selectLevel(levelId: string) {
		this.store.selectLevel(levelId);
	}

	protected toggleSkillActive(skillId: string, isActive: boolean) {
		this.store.toggleSkillActive(skillId, isActive);
	}

	protected toggleCategoryActive(categoryId: string, isActive: boolean) {
		this.store.toggleCategoryActive(categoryId, isActive);
	}

	protected toggleLevelActive(levelId: string, isActive: boolean) {
		this.store.toggleLevelActive(levelId, isActive);
	}

	protected addSkill() {
		this.store.addSkill();
	}

	protected addCategory() {
		this.store.addCategory();
	}

	protected saveSkill() {
		this.store.saveSkill();
	}

	protected cancelSkill() {
		this.store.cancelSkill();
	}

	protected saveCategory() {
		this.store.saveCategory();
	}

	protected cancelCategory() {
		this.store.cancelCategory();
	}

	protected saveLevel() {
		this.store.saveLevel();
	}

	protected cancelLevel() {
		this.store.cancelLevel();
	}

	protected setActiveTab(value: string | number | undefined) {
		this.store.setActiveTab(value);
	}

	protected isSkillSaveDisabled() {
		return this.store.isSkillSaveDisabled();
	}

	protected isCategorySaveDisabled() {
		return this.store.isCategorySaveDisabled();
	}

	protected isLevelSaveDisabled() {
		return this.store.isLevelSaveDisabled();
	}

	protected isDraftSkillSelected() {
		return this.store.isDraftSkillSelected();
	}

	protected isDraftCategorySelected() {
		return this.store.isDraftCategorySelected();
	}

	protected getExpectedSuccessPreview() {
		return this.store.getExpectedSuccessPreview();
	}
}
