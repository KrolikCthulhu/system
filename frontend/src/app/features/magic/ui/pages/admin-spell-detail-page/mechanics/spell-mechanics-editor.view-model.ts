import { computed, inject, Injectable } from '@angular/core';
import { SpellMechanicBlocksFacade } from './spell-mechanic-blocks.facade';
import { SpellMechanicParameterReadModel } from './read-model/spell-mechanic-parameter.read-model';
import { SpellEffectScaleViewModel } from './view-model/spell-effect-scale.view-model';
import { SpellMechanicBlockListViewModel } from './view-model/spell-mechanic-block-list.view-model';
import { SpellMechanicParameterCardViewModel } from './view-model/spell-mechanic-parameter-card.view-model';
import { SpellSelectedMechanicBlockViewModel } from './view-model/spell-selected-mechanic-block.view-model';

@Injectable()
export class SpellMechanicsEditorViewModel {
	private readonly blocksFacade = inject(SpellMechanicBlocksFacade);
	private readonly parameterReadModel = inject(SpellMechanicParameterReadModel);
	private readonly blockListViewModel = inject(SpellMechanicBlockListViewModel);
	private readonly selectedBlockViewModel = inject(
		SpellSelectedMechanicBlockViewModel
	);
	private readonly parameterCardViewModel = inject(
		SpellMechanicParameterCardViewModel
	);
	private readonly effectScaleViewModel = inject(SpellEffectScaleViewModel);

	readonly blockListVm = computed(() => this.blockListViewModel.create());

	readonly selectedBlockVm = computed(() => {
		const block = this.blocksFacade.selectedBlock();

		return block ? this.selectedBlockViewModel.create(block) : null;
	});

	readonly parameterCardsVm = computed(() => {
		const block = this.blocksFacade.selectedBlock();

		return block
			? this.parameterReadModel
					.mechanicBlockParameters(block)
					.map(parameter =>
						this.parameterCardViewModel.create(block, parameter)
					)
			: [];
	});

	readonly effectScaleVm = computed(() => {
		const block = this.blocksFacade.selectedBlock();

		return block ? this.effectScaleViewModel.create(block) : null;
	});
}
