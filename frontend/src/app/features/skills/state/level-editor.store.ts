import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface LevelEditorState {
	saving: boolean;
}

export const LevelEditorStore = signalStore(
	withState<LevelEditorState>({ saving: false }),
	withMethods(store => ({
		setSaving(saving: boolean) {
			patchState(store, { saving });
		}
	}))
);
