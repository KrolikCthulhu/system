import { inject, Injectable } from '@angular/core';
import { SpellMechanicParameter } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	CasterLevelMatrixPreview,
	CommandSelectOption,
	SpellMechanicBlockDraft,
	SpellMechanicParameterHeaderPreview,
	SpellParameterValueMode
} from '../../models/spell-detail-page.types';
import { NumericParameterPreview } from '../../utils/spell-numeric-parameter.utils';
import { SpellAutoParameterReadModel } from '../read-model/spell-auto-parameter.read-model';
import { SpellMechanicParameterReadModel } from '../read-model/spell-mechanic-parameter.read-model';
import {
	SpellAutoParameterViewModel,
	SpellAutoParameterVm
} from './spell-auto-parameter.view-model';
import {
	SpellParameterActionsViewModel,
	SpellParameterActionsVm
} from './spell-parameter-actions.view-model';
import {
	SpellProgressionParameterViewModel,
	SpellProgressionParameterVm
} from './spell-progression-parameter.view-model';
import {
	SpellStaticParameterViewModel,
	SpellStaticParameterVm
} from './spell-static-parameter.view-model';
import {
	SpellTargetParameterViewModel,
	SpellTargetParameterVm
} from './spell-target-parameter.view-model';

export interface SpellMechanicParameterNumericPreviewVm {
	preview: NumericParameterPreview;
	casterLevelMatrix: CasterLevelMatrixPreview | null;
	casterLevelMatrixExpanded: boolean;
}

export interface SpellMechanicParameterCardVm {
	block: SpellMechanicBlockDraft;
	parameter: SpellMechanicParameter;
	kindLabel: string;
	expanded: boolean;
	headerPreview: SpellMechanicParameterHeaderPreview | null;
	supportsProgression: boolean;
	valueMode: SpellParameterValueMode;
	modeOptions: Array<CommandSelectOption<SpellParameterValueMode>>;
	progression: SpellProgressionParameterVm | null;
	auto: SpellAutoParameterVm | null;
	target: SpellTargetParameterVm | null;
	staticParameter: SpellStaticParameterVm | null;
	numericPreview: SpellMechanicParameterNumericPreviewVm | null;
	actions: SpellParameterActionsVm;
}

@Injectable()
export class SpellMechanicParameterCardViewModel {
	private readonly parameterReadModel = inject(SpellMechanicParameterReadModel);
	private readonly autoParameterReadModel = inject(SpellAutoParameterReadModel);
	private readonly progressionViewModel = inject(
		SpellProgressionParameterViewModel
	);
	private readonly autoViewModel = inject(SpellAutoParameterViewModel);
	private readonly targetViewModel = inject(SpellTargetParameterViewModel);
	private readonly staticViewModel = inject(SpellStaticParameterViewModel);
	private readonly actionsViewModel = inject(SpellParameterActionsViewModel);

	create(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	): SpellMechanicParameterCardVm {
		const supportsProgression =
			this.parameterReadModel.supportsProgression(parameter);
		const valueMode = this.parameterReadModel.parameterValueMode(
			block,
			parameter.id
		);
		const progressionValue = this.parameterReadModel.progressionParameterValue(
			block,
			parameter.id
		);
		const autoValue = this.autoParameterReadModel.autoParameterValue(
			block,
			parameter.id
		);
		const numericPreview = this.parameterReadModel.numericParameterPreview(
			block,
			parameter
		);

		return {
			block,
			parameter,
			kindLabel: this.parameterReadModel.parameterKindLabel(parameter.kind),
			expanded: this.parameterReadModel.isMechanicParameterExpanded(
				block,
				parameter
			),
			headerPreview: supportsProgression
				? this.parameterReadModel.parameterHeaderPreview(block, parameter)
				: null,
			supportsProgression,
			valueMode,
			modeOptions: this.parameterReadModel.parameterValueModeOptions,
			progression:
				supportsProgression && valueMode === 'progression' && progressionValue
					? this.progressionViewModel.create(block, progressionValue)
					: null,
			auto:
				supportsProgression && valueMode === 'auto' && autoValue
					? this.autoViewModel.create(block, parameter, autoValue)
					: null,
			target:
				parameter.kind === 'target'
					? this.targetViewModel.create(block, parameter)
					: null,
			staticParameter:
				parameter.kind !== 'target'
					? this.staticViewModel.create(block, parameter, supportsProgression)
					: null,
			numericPreview: numericPreview
				? {
						preview: numericPreview,
						casterLevelMatrix: this.parameterReadModel.casterLevelMatrixPreview(
							block,
							parameter
						),
						casterLevelMatrixExpanded:
							this.parameterReadModel.isCasterLevelMatrixExpanded(
								block,
								parameter
							)
					}
				: null,
			actions: this.actionsViewModel.create(block, parameter)
		};
	}
}
