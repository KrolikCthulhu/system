import { inject, Injectable } from '@angular/core';
import { ProgressionPresetRoundingMode } from '../../../../../progression-presets/domain/progression-presets.models';
import { SpellTargetConfig } from '../../../../domain/spell.models';
import { SpellMechanicParameter } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SpellMechanicDraftFacade } from '../application/spell-mechanic-draft.facade';
import {
	SpellMechanicBlockDraft,
	SpellParameterValueMode
} from '../models/spell-detail-page.types';
import {
	createStaticParameterValue,
	ProgressionSourceKind,
	SpellParameterValue,
	SpellProgressionParameterValue
} from '../utils/spell-numeric-parameter.utils';
import { TargetTemplateId } from '../utils/spell-target-config.utils';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import { SpellMechanicParameterReadModel } from './read-model/spell-mechanic-parameter.read-model';

@Injectable()
export class SpellMechanicParametersFacade {
	private readonly store = inject(AdminSpellDetailPageStore);
	private readonly draftFacade = inject(SpellMechanicDraftFacade);
	private readonly readModel = inject(SpellMechanicParameterReadModel);

	updateSelectedMechanicBlockParameter(
		parameterId: string,
		value: SpellParameterValue | null
	) {
		this.draftFacade.updateSelectedMechanicBlockParameter(parameterId, value);
	}

	updateSelectedPlainParameterValue(
		parameter: SpellMechanicParameter,
		value: string
	) {
		this.updateSelectedMechanicBlockParameter(
			parameter.id,
			this.readModel.supportsProgression(parameter)
				? createStaticParameterValue(value)
				: value
		);
	}

	updateSelectedMechanicBlockParameterMode(
		parameterId: string,
		mode: SpellParameterValueMode
	) {
		this.draftFacade.updateSelectedMechanicBlockParameterMode(
			parameterId,
			mode
		);
	}

	updateSelectedProgressionParameter(
		parameterId: string,
		patch: Partial<SpellProgressionParameterValue>
	) {
		this.draftFacade.updateSelectedProgressionParameter(parameterId, patch);
	}

	updateSelectedProgressionPreset(parameterId: string, presetId: string) {
		this.draftFacade.updateSelectedProgressionPreset(parameterId, presetId);
	}

	updateSelectedProgressionConfig(
		parameterId: string,
		key: string,
		value: number | null
	) {
		this.draftFacade.updateSelectedProgressionConfig(parameterId, key, value);
	}

	updateSelectedProgressionRoundingMode(
		parameterId: string,
		roundingModeValue: ProgressionPresetRoundingMode
	) {
		this.draftFacade.updateSelectedProgressionRoundingMode(
			parameterId,
			roundingModeValue
		);
	}

	updateSelectedProgressionSourceKind(
		block: SpellMechanicBlockDraft,
		parameterId: string,
		sourceKind: ProgressionSourceKind
	) {
		this.draftFacade.updateSelectedProgressionSourceKind(
			parameterId,
			sourceKind,
			this.readModel.defaultProgressionSourceKey(block, sourceKind)
		);
	}

	toggleMechanicParameterExpanded(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		this.store.toggleMechanicParameterExpanded(
			this.readModel.mechanicParameterCollapseKey(block, parameter)
		);
	}

	toggleCasterLevelMatrix(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	) {
		this.store.toggleCasterLevelMatrixExpanded(
			this.readModel.casterLevelMatrixKey(block, parameter)
		);
	}

	updateMechanicTargetTemplate(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter,
		templateId: TargetTemplateId
	) {
		this.draftFacade.updateMechanicTargetTemplate(
			block,
			parameter.id,
			templateId
		);
	}

	updateMechanicTargetConfig(
		block: SpellMechanicBlockDraft,
		parameterId: string,
		patch: Partial<SpellTargetConfig>
	) {
		const targetId = this.readModel.parameterValue(block, parameterId);
		this.draftFacade.updateMechanicTargetConfig(targetId, patch);
	}
}
