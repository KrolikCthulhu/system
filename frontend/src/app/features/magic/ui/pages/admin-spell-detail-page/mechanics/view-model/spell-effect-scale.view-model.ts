import { inject, Injectable } from '@angular/core';
import {
	SpellEffectScaleConfig,
	SpellNestedMechanicBlockConfig
} from '../../../../../domain/spell.models';
import { SpellMechanicParameter } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	CommandSelectOption,
	SpellMechanicBlockDraft
} from '../../models/spell-detail-page.types';
import { SpellParameterValue } from '../../utils/spell-numeric-parameter.utils';
import { SpellEffectScaleFacade } from '../spell-effect-scale.facade';
import { SpellMechanicBlocksFacade } from '../spell-mechanic-blocks.facade';

export interface SpellEffectScaleActionsVm {
	updateConfig(
		block: SpellMechanicBlockDraft,
		patch: Partial<SpellEffectScaleConfig>
	): void;
	addNestedMechanic(block: SpellMechanicBlockDraft, itemId: string): void;
	updateNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		mechanicId: string
	): void;
	deleteNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string
	): void;
	updateNestedParameter(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		parameterId: string,
		value: SpellParameterValue | null
	): void;
}

export interface SpellEffectScaleVm {
	block: SpellMechanicBlockDraft;
	config: SpellEffectScaleConfig;
	mechanicOptions: CommandSelectOption[];
	modeOptions: SpellEffectScaleFacade['effectScaleModeOptions'];
	mechanicParameters: (
		block: SpellNestedMechanicBlockConfig
	) => SpellMechanicParameter[];
	usesParameterSelect: (kind: SpellMechanicParameter['kind']) => boolean;
	parameterOptions: (
		parameter: SpellMechanicParameter
	) => ReturnType<SpellEffectScaleFacade['effectScaleParameterOptions']>;
	parameterValue: (
		block: SpellNestedMechanicBlockConfig,
		parameterId: string
	) => SpellParameterValue | null;
	staticParameterValue: (
		block: SpellNestedMechanicBlockConfig,
		parameterId: string
	) => string;
	actions: SpellEffectScaleActionsVm;
}

@Injectable()
export class SpellEffectScaleViewModel {
	private readonly blocksFacade = inject(SpellMechanicBlocksFacade);
	private readonly effectScaleFacade = inject(SpellEffectScaleFacade);

	create(block: SpellMechanicBlockDraft): SpellEffectScaleVm | null {
		return this.effectScaleFacade.isEffectScaleBlock(block)
			? {
					block,
					config: this.effectScaleFacade.effectScaleConfig(block),
					mechanicOptions: this.blocksFacade.mechanicOptions(),
					modeOptions: this.effectScaleFacade.effectScaleModeOptions,
					mechanicParameters:
						this.effectScaleFacade.effectScaleMechanicParameters,
					usesParameterSelect:
						this.effectScaleFacade.effectScaleUsesParameterSelect,
					parameterOptions: this.effectScaleFacade.effectScaleParameterOptions,
					parameterValue: this.effectScaleFacade.effectScaleParameterValue,
					staticParameterValue:
						this.effectScaleFacade.effectScaleStaticParameterValue,
					actions: {
						updateConfig: this.effectScaleFacade.effectScaleConfigChangeHandler,
						addNestedMechanic:
							this.effectScaleFacade.effectScaleNestedMechanicAddHandler,
						updateNestedMechanic:
							this.effectScaleFacade.effectScaleNestedMechanicChangeHandler,
						deleteNestedMechanic:
							this.effectScaleFacade.effectScaleNestedMechanicDeleteHandler,
						updateNestedParameter:
							this.effectScaleFacade.effectScaleNestedParameterChangeHandler
					}
				}
			: null;
	}
}
