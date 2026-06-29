import { inject, Injectable } from '@angular/core';
import {
	PersistedSpellStatus,
	SPELL_STATUS_OPTIONS,
	canManageSpellActivity
} from '../../../../domain/spell.models';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';

@Injectable()
export class SpellMainEditorFacade {
	private readonly pageStore = inject(AdminSpellDetailPageStore);

	readonly draft = this.pageStore.draft;
	readonly statusOptions = SPELL_STATUS_OPTIONS;

	updateName(name: string) {
		this.pageStore.patchDraft({ name });
	}

	updateDescription(description: string) {
		this.pageStore.patchDraft({ description });
	}

	updateStatus(status: PersistedSpellStatus) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.pageStore.patchDraft({
			status,
			isActive:
				status === 'DRAFT'
					? false
					: draft.status === 'DRAFT'
						? true
						: draft.isActive
		});
	}

	updateActive(isActive: boolean) {
		this.pageStore.patchDraft({ isActive });
	}

	updateSortOrder(sortOrder: number | null) {
		this.pageStore.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	canManageActivity(status: PersistedSpellStatus) {
		return canManageSpellActivity(status);
	}
}
