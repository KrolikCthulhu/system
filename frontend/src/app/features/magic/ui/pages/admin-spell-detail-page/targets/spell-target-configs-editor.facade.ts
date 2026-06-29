import { computed, inject, Injectable } from '@angular/core';
import { SpellTargetConfig } from '../../../../domain/spell.models';
import {
	createTargetConfigDraft,
	targetConfigPreview
} from '../utils/spell-target-config.utils';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';

@Injectable()
export class SpellTargetConfigsEditorFacade {
	private readonly pageStore = inject(AdminSpellDetailPageStore);

	readonly draft = this.pageStore.draft;
	readonly selectedIndex = this.pageStore.selectedTargetConfigIndex;
	readonly selectedTargetConfig = computed(() => {
		const index = this.selectedIndex();

		return index === null ? null : (this.draft()?.targetConfigs[index] ?? null);
	});

	addTargetConfig() {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.pageStore.patchDraft({
			targetConfigs: [
				...draft.targetConfigs,
				createTargetConfigDraft(draft.targetConfigs.length)
			]
		});
		this.pageStore.selectAppendedTargetConfig(draft.targetConfigs.length);
	}

	selectTargetConfig(index: number) {
		this.pageStore.setSelectedTargetConfigIndex(index);
	}

	updateSelectedTargetConfig(patch: Partial<SpellTargetConfig>) {
		const index = this.selectedIndex();
		const draft = this.draft();

		if (index === null || !draft?.targetConfigs[index]) {
			return;
		}

		this.pageStore.patchDraft({
			targetConfigs: draft.targetConfigs.map((target, targetIndex) =>
				targetIndex === index ? { ...target, ...patch } : target
			)
		});
	}

	deleteSelectedTargetConfig() {
		const index = this.selectedIndex();

		if (index === null) {
			return;
		}

		this.deleteTargetConfig(index);
	}

	deleteTargetConfig(index: number) {
		const draft = this.draft();

		if (!draft?.targetConfigs[index]) {
			return;
		}

		this.pageStore.patchDraft({
			targetConfigs: draft.targetConfigs
				.filter((_, targetIndex) => targetIndex !== index)
				.map((target, targetIndex) => ({ ...target, sortOrder: targetIndex }))
		});
		this.pageStore.selectTargetConfigAfterDelete(
			index,
			draft.targetConfigs.length
		);
	}

	moveTargetConfig(index: number, direction: -1 | 1) {
		const draft = this.draft();
		const nextIndex = index + direction;

		if (!draft || nextIndex < 0 || nextIndex >= draft.targetConfigs.length) {
			return;
		}

		const targets = [...draft.targetConfigs];
		const [target] = targets.splice(index, 1);
		targets.splice(nextIndex, 0, target);

		this.pageStore.patchDraft({
			targetConfigs: targets.map((item, targetIndex) => ({
				...item,
				sortOrder: targetIndex
			}))
		});
		this.pageStore.selectMovedTargetConfig(index, direction);
	}

	isFirstTargetConfig(index: number) {
		return index === 0;
	}

	isLastTargetConfig(index: number) {
		return index === (this.draft()?.targetConfigs.length ?? 0) - 1;
	}

	targetConfigPreview(target: SpellTargetConfig) {
		return targetConfigPreview(target);
	}
}
