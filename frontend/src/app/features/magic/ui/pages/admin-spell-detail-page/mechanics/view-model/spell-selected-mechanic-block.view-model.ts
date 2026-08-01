import { inject, Injectable } from '@angular/core';
import { SpellMechanicApplicationConfig } from '../../../../../domain/spell.models';
import {
	CommandSelectOption,
	SpellMechanicBlockDraft
} from '../../models/spell-detail-page.types';
import { SpellMechanicBlocksFacade } from '../spell-mechanic-blocks.facade';

export interface SpellSelectedMechanicBlockActionsVm {
	changeMechanic(mechanicId: string): void;
	changeActive(isActive: boolean): void;
	delete(): void;
	changeApplication(patch: Partial<SpellMechanicApplicationConfig>): void;
}

export interface SpellSelectedMechanicBlockVm {
	block: SpellMechanicBlockDraft;
	mechanicOptions: CommandSelectOption[];
	previewText: string;
	applicationText: string;
	applicationConfig: SpellMechanicApplicationConfig;
	actions: SpellSelectedMechanicBlockActionsVm;
}

@Injectable()
export class SpellSelectedMechanicBlockViewModel {
	private readonly blocksFacade = inject(SpellMechanicBlocksFacade);

	create(block: SpellMechanicBlockDraft): SpellSelectedMechanicBlockVm {
		return {
			block,
			mechanicOptions: this.blocksFacade.mechanicOptions(),
			previewText: this.blocksFacade.mechanicBlockTextPreview(block),
			applicationText: this.blocksFacade.mechanicApplicationText(block),
			applicationConfig: this.blocksFacade.mechanicApplicationConfig(block),
			actions: {
				changeMechanic: (mechanicId: string) =>
					this.blocksFacade.updateSelectedMechanicBlockMechanic(mechanicId),
				changeActive: (isActive: boolean) =>
					this.blocksFacade.updateSelectedMechanicBlockActive(isActive),
				delete: () => this.blocksFacade.deleteSelectedMechanicBlock(),
				changeApplication: (
					patch: Parameters<
						typeof this.blocksFacade.updateSelectedMechanicApplication
					>[0]
				) => this.blocksFacade.updateSelectedMechanicApplication(patch)
			}
		};
	}
}
