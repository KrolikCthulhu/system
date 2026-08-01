import { inject, Injectable } from '@angular/core';
import { SpellMechanicBlockListItem } from '../../models/spell-detail-page.types';
import { SpellMechanicBlocksFacade } from '../spell-mechanic-blocks.facade';

export interface SpellMechanicBlockListActionsVm {
	add(): void;
	select(index: number): void;
	move(event: { index: number; direction: -1 | 1 }): void;
}

export interface SpellMechanicBlockListVm {
	items: SpellMechanicBlockListItem[];
	selectedIndex: number | null;
	actions: SpellMechanicBlockListActionsVm;
}

@Injectable()
export class SpellMechanicBlockListViewModel {
	private readonly blocksFacade = inject(SpellMechanicBlocksFacade);

	create(): SpellMechanicBlockListVm {
		return {
			items: this.blockListItems(),
			selectedIndex: this.blocksFacade.selectedIndex(),
			actions: {
				add: () => this.blocksFacade.addMechanicBlock(),
				select: (index: number) => this.blocksFacade.selectMechanicBlock(index),
				move: (event: { index: number; direction: -1 | 1 }) =>
					this.blocksFacade.moveMechanicBlock(event.index, event.direction)
			}
		};
	}

	private blockListItems(): SpellMechanicBlockListItem[] {
		const blocks = this.blocksFacade.draft()?.mechanicBlocks ?? [];

		return blocks.map((block, index) => ({
			id: block.id,
			index,
			name: this.blocksFacade.mechanicName(block),
			preview: this.blocksFacade.mechanicBlockTextPreview(block),
			invalid: this.blocksFacade.isMechanicBlockInvalid(block),
			first: index === 0,
			last: index === blocks.length - 1
		}));
	}
}
