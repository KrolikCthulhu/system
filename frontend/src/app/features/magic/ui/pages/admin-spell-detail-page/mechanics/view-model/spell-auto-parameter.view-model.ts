import { inject, Injectable } from '@angular/core';
import { SpellMechanicParameter } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SpellMechanicBlockDraft } from '../../models/spell-detail-page.types';
import { SpellAutoParameterReadModel } from '../read-model/spell-auto-parameter.read-model';
import { SpellMechanicParameterReadModel } from '../read-model/spell-mechanic-parameter.read-model';

export interface SpellAutoParameterVm {
	value: NonNullable<
		ReturnType<SpellAutoParameterReadModel['autoParameterValue']>
	>;
	scope: string;
	characterOptions: SpellAutoParameterReadModel['autoValueCharacterOptions'];
	scaleOptions: SpellAutoParameterReadModel['autoValueScaleOptions'];
	rangeModeOptions: SpellAutoParameterReadModel['autoValueRangeModeOptions'];
	sourceModeOptions: SpellAutoParameterReadModel['autoValueSourceModeOptions'];
	sourceKindOptions: SpellAutoParameterReadModel['autoValueSourceKindOptions'];
	sourceTargetOptions: SpellAutoParameterReadModel['autoValueSourceTargetOptions'];
	sourceCurveOptions: SpellAutoParameterReadModel['autoValueSourceCurveOptions'];
	sourceTransformOptions: SpellAutoParameterReadModel['autoValueSourceTransformOptions'];
	roundingModeOptions: SpellMechanicParameterReadModel['roundingModeOptions'];
	sourceKeyOptions: ReturnType<
		SpellAutoParameterReadModel['mechanicAutoSourceKeyOptionsRenderer']
	>;
	transformSourceOptions: SpellAutoParameterReadModel['autoTransformSourceOptions'];
	defaultSourceKey: ReturnType<
		SpellAutoParameterReadModel['defaultAutoSourceKeyRenderer']
	>;
	sourceKeyLabel: SpellAutoParameterReadModel['autoSourceKeyLabel'];
	sourceSummary: SpellAutoParameterReadModel['autoSourceSummary'];
	isSourceCollapsed: SpellAutoParameterReadModel['isAutoSourceCollapsed'];
	presetOptions: ReturnType<SpellAutoParameterReadModel['autoPresetOptions']>;
	presetPanelStyle: SpellAutoParameterReadModel['autoPresetPanelStyle'];
}

@Injectable()
export class SpellAutoParameterViewModel {
	private readonly parameterReadModel = inject(SpellMechanicParameterReadModel);
	private readonly autoParameterReadModel = inject(SpellAutoParameterReadModel);

	create(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter,
		autoValue: NonNullable<
			ReturnType<typeof this.autoParameterReadModel.autoParameterValue>
		>
	): SpellAutoParameterVm {
		return {
			value: autoValue,
			scope: `mechanic:${parameter.id}`,
			characterOptions: this.autoParameterReadModel.autoValueCharacterOptions,
			scaleOptions: this.autoParameterReadModel.autoValueScaleOptions,
			rangeModeOptions: this.autoParameterReadModel.autoValueRangeModeOptions,
			sourceModeOptions: this.autoParameterReadModel.autoValueSourceModeOptions,
			sourceKindOptions: this.autoParameterReadModel.autoValueSourceKindOptions,
			sourceTargetOptions:
				this.autoParameterReadModel.autoValueSourceTargetOptions,
			sourceCurveOptions:
				this.autoParameterReadModel.autoValueSourceCurveOptions,
			sourceTransformOptions:
				this.autoParameterReadModel.autoValueSourceTransformOptions,
			roundingModeOptions: this.parameterReadModel.roundingModeOptions,
			sourceKeyOptions:
				this.autoParameterReadModel.mechanicAutoSourceKeyOptionsRenderer(block),
			transformSourceOptions:
				this.autoParameterReadModel.autoTransformSourceOptions,
			defaultSourceKey:
				this.autoParameterReadModel.defaultAutoSourceKeyRenderer(block),
			sourceKeyLabel: this.autoParameterReadModel.autoSourceKeyLabel,
			sourceSummary: this.autoParameterReadModel.autoSourceSummary,
			isSourceCollapsed: this.autoParameterReadModel.isAutoSourceCollapsed,
			presetOptions: this.autoParameterReadModel.autoPresetOptions(parameter),
			presetPanelStyle: this.autoParameterReadModel.autoPresetPanelStyle
		};
	}
}
