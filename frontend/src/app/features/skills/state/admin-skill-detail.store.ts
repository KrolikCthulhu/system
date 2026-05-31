import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Skill, SkillCategory } from '../domain/skills.models';

interface AdminSkillDetailState {
	activeTab: 'general' | 'calculation';
	loading: boolean;
	saving: boolean;
	errorMessage: string | null;
	skill: Skill | null;
	categories: SkillCategory[];
}

export const AdminSkillDetailStore = signalStore(
	withState<AdminSkillDetailState>({
		activeTab: 'general',
		loading: true,
		saving: false,
		errorMessage: null,
		skill: null,
		categories: []
	}),
	withMethods(store => ({
		setActiveTab(activeTab: 'general' | 'calculation') {
			patchState(store, { activeTab });
		},
		setLoading(loading: boolean) {
			patchState(store, { loading });
		},
		setSaving(saving: boolean) {
			patchState(store, { saving });
		},
		setErrorMessage(errorMessage: string | null) {
			patchState(store, { errorMessage });
		},
		setSkill(skill: Skill | null) {
			patchState(store, { skill });
		},
		setCategories(categories: SkillCategory[]) {
			patchState(store, { categories });
		}
	}))
);
