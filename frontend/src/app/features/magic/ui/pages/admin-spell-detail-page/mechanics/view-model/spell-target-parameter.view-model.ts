import { inject, Injectable } from '@angular/core';
import { SpellMechanicParameter } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SpellTargetConfig } from '../../../../../domain/spell.models';
import { SpellMechanicBlockDraft } from '../../models/spell-detail-page.types';
import {
	TargetTemplateId,
	TargetTemplateOptionGroup
} from '../../utils/spell-target-config.utils';
import { SpellMechanicParameterReadModel } from '../read-model/spell-mechanic-parameter.read-model';

export interface SpellTargetParameterVm {
	templateOptions: TargetTemplateOptionGroup[];
	template: TargetTemplateId;
	previewText: string;
	runtimeSummary: string;
	defaultText: string | null;
	config: SpellTargetConfig | null;
	countParameterOptions: ReturnType<
		SpellMechanicParameterReadModel['targetCountParameterOptions']
	>;
}

@Injectable()
export class SpellTargetParameterViewModel {
	private readonly parameterReadModel = inject(SpellMechanicParameterReadModel);

	create(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	): SpellTargetParameterVm {
		const template = this.parameterReadModel.mechanicTargetTemplate(
			block,
			parameter
		);

		return {
			templateOptions:
				this.parameterReadModel.targetTemplateOptionGroupsForParameter(
					parameter
				),
			template,
			previewText: this.parameterReadModel.mechanicTargetPreview(
				block,
				parameter
			),
			runtimeSummary: this.parameterReadModel.mechanicTargetRuntimeSummary(
				block,
				parameter
			),
			defaultText:
				parameter.defaultTargetConfig && template === 'mechanicDefault'
					? this.parameterReadModel.targetConfigText(
							parameter.defaultTargetConfig
						)
					: null,
			config: this.parameterReadModel.mechanicTargetConfig(block, parameter.id),
			countParameterOptions:
				this.parameterReadModel.targetCountParameterOptions(block, parameter.id)
		};
	}
}
