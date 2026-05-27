import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface CharacteristicEditorState {
	saving: boolean;
	draftCharacteristicIds: string[];
}

export const CharacteristicEditorStore = signalStore(
	withState<CharacteristicEditorState>({
		saving: false,
		draftCharacteristicIds: []
	}),
	withMethods(store => ({
		setSaving(saving: boolean) {
			patchState(store, { saving });
		},
		addDraftCharacteristicId(id: string) {
			patchState(store, state => ({
				draftCharacteristicIds: [...state.draftCharacteristicIds, id]
			}));
		},
		removeDraftCharacteristicId(id: string) {
			patchState(store, state => ({
				draftCharacteristicIds: state.draftCharacteristicIds.filter(
					item => item !== id
				)
			}));
		}
	}))
);
