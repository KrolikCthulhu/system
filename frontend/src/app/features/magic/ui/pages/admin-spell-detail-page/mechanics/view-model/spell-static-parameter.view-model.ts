import { inject, Injectable } from '@angular/core';
import { SpellMechanicParameter } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SpellMechanicBlockDraft } from '../../models/spell-detail-page.types';
import { SpellMechanicParameterReadModel } from '../read-model/spell-mechanic-parameter.read-model';

export interface SpellStaticParameterVm {
	showValueLabel: boolean;
	usesSelect: boolean;
	options: ReturnType<SpellMechanicParameterReadModel['parameterOptions']>;
	selectValue: string | null;
	plainValue: string;
}

@Injectable()
export class SpellStaticParameterViewModel {
	private readonly parameterReadModel = inject(SpellMechanicParameterReadModel);

	create(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter,
		supportsProgression: boolean
	): SpellStaticParameterVm {
		return {
			showValueLabel: supportsProgression,
			usesSelect: this.parameterReadModel.usesParameterSelect(parameter.kind),
			options: this.parameterReadModel.parameterOptions(parameter),
			selectValue:
				this.parameterReadModel.parameterValue(block, parameter.id) || null,
			plainValue: this.parameterReadModel.staticParameterValue(
				block,
				parameter.id
			)
		};
	}
}
