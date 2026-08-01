import { inject, Injectable } from '@angular/core';
import { SpellMechanicBlockDraft } from '../../models/spell-detail-page.types';
import { SpellMechanicParameterReadModel } from '../read-model/spell-mechanic-parameter.read-model';

export interface SpellProgressionParameterVm {
	value: NonNullable<
		ReturnType<SpellMechanicParameterReadModel['progressionParameterValue']>
	>;
	sourceKindOptions: SpellMechanicParameterReadModel['progressionSourceKindOptions'];
	showSourceKey: boolean;
	sourceKeyLabel: string;
	sourceKeyOptions: ReturnType<
		SpellMechanicParameterReadModel['progressionSourceKeyOptions']
	>;
	presetOptions: ReturnType<
		SpellMechanicParameterReadModel['progressionPresetOptions']
	>;
	configFields: ReturnType<
		SpellMechanicParameterReadModel['progressionConfigFields']
	>;
	roundingModeOptions: SpellMechanicParameterReadModel['roundingModeOptions'];
}

@Injectable()
export class SpellProgressionParameterViewModel {
	private readonly parameterReadModel = inject(SpellMechanicParameterReadModel);

	create(
		block: SpellMechanicBlockDraft,
		progressionValue: NonNullable<
			ReturnType<typeof this.parameterReadModel.progressionParameterValue>
		>
	): SpellProgressionParameterVm {
		return {
			value: progressionValue,
			sourceKindOptions: this.parameterReadModel.progressionSourceKindOptions,
			showSourceKey:
				this.parameterReadModel.shouldShowProgressionSourceKey(
					progressionValue
				),
			sourceKeyLabel:
				this.parameterReadModel.progressionSourceKeyLabel(progressionValue),
			sourceKeyOptions: this.parameterReadModel.progressionSourceKeyOptions(
				block,
				progressionValue
			),
			presetOptions: this.parameterReadModel.progressionPresetOptions(),
			configFields:
				this.parameterReadModel.progressionConfigFields(progressionValue),
			roundingModeOptions: this.parameterReadModel.roundingModeOptions
		};
	}
}
