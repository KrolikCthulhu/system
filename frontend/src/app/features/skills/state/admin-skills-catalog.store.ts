import { computed } from '@angular/core';
import {
	patchState,
	signalStore,
	withComputed,
	withMethods,
	withState
} from '@ngrx/signals';
import {
	Skill,
	SkillCategory,
	SkillLevel,
	SkillsAdminCatalog
} from '../domain/skills.models';

export type SkillsTabValue = 'skills' | 'categories' | 'levels';

export interface SkillCategoryFilterItem {
	id: string;
	name: string;
	count: number;
}

interface AdminSkillsCatalogState {
	activeTab: SkillsTabValue;
	categorySearch: string;
	selectedSkillFilterCategoryId: string;
	selectedSkillId: string | null;
	selectedCategoryId: string | null;
	selectedLevelId: string | null;
	loading: boolean;
	categories: SkillCategory[];
	skills: Skill[];
	levels: SkillLevel[];
}

const initialState: AdminSkillsCatalogState = {
	activeTab: 'skills',
	categorySearch: '',
	selectedSkillFilterCategoryId: 'all',
	selectedSkillId: null,
	selectedCategoryId: null,
	selectedLevelId: null,
	loading: true,
	categories: [],
	skills: [],
	levels: []
};

export const AdminSkillsCatalogStore = signalStore(
	withState(initialState),
	withComputed(store => {
		const skillCategoryFilters = computed<SkillCategoryFilterItem[]>(() => {
			const skills = store.skills();
			const categories = store.categories().map(category => ({
				id: category.id,
				name: category.name,
				count: skills.filter(skill => skill.categoryId === category.id).length
			}));

			return [{ id: 'all', name: 'Все навыки', count: skills.length }, ...categories];
		});
		const filteredSkillCategories = computed(() => {
			const query = store.categorySearch().trim().toLowerCase();

			if (!query) {
				return skillCategoryFilters();
			}

			return skillCategoryFilters().filter(category =>
				category.name.toLowerCase().includes(query)
			);
		});
		const selectedSkillFilterCategory = computed(
			() =>
				skillCategoryFilters().find(
					category => category.id === store.selectedSkillFilterCategoryId()
				) ?? skillCategoryFilters()[0]
		);

		return {
			breadcrumbs: computed(() => [
				{ label: 'Правила системы' },
				{ label: 'Навыки' }
			]),
			skillCategoryFilters,
			filteredSkillCategories,
			selectedSkillFilterCategory,
			visibleSkills: computed(() => {
			const filterCategoryId = store.selectedSkillFilterCategoryId();

			if (filterCategoryId === 'all') {
				return store.skills();
			}

				return store
					.skills()
					.filter(skill => skill.categoryId === filterCategoryId);
			}),
			categoryOptions: computed(() =>
				store.categories().map(category => ({
					label: category.name,
					value: category.id
				}))
			),
			selectedSkill: computed(() => {
				const selectedSkillId = store.selectedSkillId();
				return store.skills().find(skill => skill.id === selectedSkillId) ?? null;
			}),
			selectedCategory: computed(() => {
				const selectedCategoryId = store.selectedCategoryId();
				return (
					store
						.categories()
						.find(category => category.id === selectedCategoryId) ?? null
				);
			}),
			selectedLevel: computed(() => {
				const selectedLevelId = store.selectedLevelId();
				return store.levels().find(level => level.id === selectedLevelId) ?? null;
			})
		};
	}),
	withMethods(store => ({
		setLoading(loading: boolean) {
			patchState(store, { loading });
		},
		setCatalog(catalog: SkillsAdminCatalog) {
			patchState(store, {
				categories: catalog.categories,
				skills: catalog.skills,
				levels: catalog.levels,
				loading: false
			});
		},
		setActiveTab(activeTab: SkillsTabValue) {
			patchState(store, { activeTab });
		},
		setCategorySearch(categorySearch: string) {
			patchState(store, { categorySearch });
		},
		setSelectedSkillFilterCategoryId(selectedSkillFilterCategoryId: string) {
			patchState(store, { selectedSkillFilterCategoryId });
		},
		setSelectedSkillId(selectedSkillId: string | null) {
			patchState(store, { selectedSkillId });
		},
		setSelectedCategoryId(selectedCategoryId: string | null) {
			patchState(store, { selectedCategoryId });
		},
		setSelectedLevelId(selectedLevelId: string | null) {
			patchState(store, { selectedLevelId });
		},
		setSkills(skills: Skill[]) {
			patchState(store, { skills });
		},
		setCategories(categories: SkillCategory[]) {
			patchState(store, { categories });
		},
		setLevels(levels: SkillLevel[]) {
			patchState(store, { levels });
		},
		prependSkill(skill: Skill) {
			patchState(store, state => ({ skills: [skill, ...state.skills] }));
		},
		replaceSkill(currentId: string, skill: Skill) {
			patchState(store, state => ({
				skills: state.skills.map(item => (item.id === currentId ? skill : item))
			}));
		},
		upsertSkill(skill: Skill) {
			patchState(store, state => ({
				skills: state.skills.map(item => (item.id === skill.id ? skill : item))
			}));
		},
		removeSkill(skillId: string) {
			patchState(store, state => ({
				skills: state.skills.filter(skill => skill.id !== skillId)
			}));
		},
		prependCategory(category: SkillCategory) {
			patchState(store, state => ({
				categories: [category, ...state.categories]
			}));
		},
		replaceCategory(currentId: string, category: SkillCategory) {
			patchState(store, state => ({
				categories: state.categories.map(item =>
					item.id === currentId ? category : item
				)
			}));
		},
		upsertCategory(category: SkillCategory) {
			patchState(store, state => ({
				categories: state.categories.map(item =>
					item.id === category.id ? category : item
				)
			}));
		},
		removeCategory(categoryId: string) {
			patchState(store, state => ({
				categories: state.categories.filter(category => category.id !== categoryId)
			}));
		},
		removeSkillsByCategory(categoryId: string) {
			patchState(store, state => ({
				skills: state.skills.filter(skill => skill.categoryId !== categoryId)
			}));
		},
		upsertLevel(level: SkillLevel) {
			patchState(store, state => ({
				levels: state.levels.map(item => (item.id === level.id ? level : item))
			}));
		},
		removeLevel(levelId: string) {
			patchState(store, state => ({
				levels: state.levels.filter(level => level.id !== levelId)
			}));
		}
	}))
);
