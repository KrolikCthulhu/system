import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface CategoryEditorState {
	saving: boolean;
	draftCategoryIds: string[];
}

export const CategoryEditorStore = signalStore(
	withState<CategoryEditorState>({
		saving: false,
		draftCategoryIds: []
	}),
	withMethods(store => ({
		setSaving(saving: boolean) {
			patchState(store, { saving });
		},
		addDraftCategoryId(id: string) {
			patchState(store, state => ({
				draftCategoryIds: [...state.draftCategoryIds, id]
			}));
		},
		removeDraftCategoryId(id: string) {
			patchState(store, state => ({
				draftCategoryIds: state.draftCategoryIds.filter(item => item !== id)
			}));
		}
	}))
);
