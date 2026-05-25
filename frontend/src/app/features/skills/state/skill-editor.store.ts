import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface SkillEditorState {
	saving: boolean;
	draftSkillIds: string[];
}

export const SkillEditorStore = signalStore(
	withState<SkillEditorState>({
		saving: false,
		draftSkillIds: []
	}),
	withMethods(store => ({
		setSaving(saving: boolean) {
			patchState(store, { saving });
		},
		addDraftSkillId(id: string) {
			patchState(store, state => ({ draftSkillIds: [...state.draftSkillIds, id] }));
		},
		removeDraftSkillId(id: string) {
			patchState(store, state => ({
				draftSkillIds: state.draftSkillIds.filter(item => item !== id)
			}));
		}
	}))
);
