import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface AttributeEditorState {
	saving: boolean;
	draftAttributeIds: string[];
}

export const AttributeEditorStore = signalStore(
	withState<AttributeEditorState>({
		saving: false,
		draftAttributeIds: []
	}),
	withMethods(store => ({
		setSaving(saving: boolean) {
			patchState(store, { saving });
		},
		addDraftAttributeId(id: string) {
			patchState(store, state => ({
				draftAttributeIds: [...state.draftAttributeIds, id]
			}));
		},
		removeDraftAttributeId(id: string) {
			patchState(store, state => ({
				draftAttributeIds: state.draftAttributeIds.filter(item => item !== id)
			}));
		}
	}))
);
