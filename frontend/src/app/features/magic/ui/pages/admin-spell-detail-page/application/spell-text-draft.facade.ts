import { inject, Injectable } from '@angular/core';
import {
	SpellTextBlock,
	SpellTextBlockKind
} from '../../../../domain/spell.models';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import {
	addSpellMechanicTextBlocksCommand,
	addSpellTextBlockCommand,
	deleteSpellTextBlockCommand,
	moveSpellTextBlockCommand,
	updateSpellTextBlockCommand
} from './commands/spell-text-draft.commands';

@Injectable()
export class SpellTextDraftFacade {
	private readonly store = inject(AdminSpellDetailPageStore);

	addSpellTextBlock(kind: SpellTextBlockKind) {
		const draft = this.store.draft();

		if (!draft) {
			return;
		}

		this.store.patchDraft(
			addSpellTextBlockCommand(draft, kind, crypto.randomUUID())
		);
	}

	addSpellMechanicTextBlocks() {
		const draft = this.store.draft();

		if (!draft) {
			return;
		}

		const patch = addSpellMechanicTextBlocksCommand(
			draft,
			draft.mechanicBlocks.map(() => crypto.randomUUID())
		);

		if (!patch) {
			return;
		}

		this.store.patchDraft(patch);
	}

	updateSpellTextBlock(blockId: string, patch: Partial<SpellTextBlock>) {
		const draft = this.store.draft();

		if (!draft) {
			return;
		}

		this.store.patchDraft(updateSpellTextBlockCommand(draft, blockId, patch));
	}

	deleteSpellTextBlock(blockId: string) {
		const draft = this.store.draft();

		if (!draft) {
			return;
		}

		this.store.patchDraft(deleteSpellTextBlockCommand(draft, blockId));
	}

	moveSpellTextBlock(index: number, direction: -1 | 1) {
		const draft = this.store.draft();
		if (!draft) {
			return;
		}

		const patch = moveSpellTextBlockCommand(draft, index, direction);

		if (!patch) {
			return;
		}

		this.store.patchDraft(patch);
	}
}
