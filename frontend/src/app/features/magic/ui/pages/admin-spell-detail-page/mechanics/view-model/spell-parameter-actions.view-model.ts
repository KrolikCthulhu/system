import { inject, Injectable } from '@angular/core';
import { ProgressionPresetRoundingMode } from '../../../../../../progression-presets/domain/progression-presets.models';
import { SpellMechanicParameter } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SpellTargetConfigEditorValue } from '../../../../../../../shared/ui/spell-target-config-editor/spell-target-config-editor.component';
import {
	SpellMechanicBlockDraft,
	SpellParameterValueMode
} from '../../models/spell-detail-page.types';
import {
	AutoValueSourceMode,
	ProgressionSourceKind,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellProgressionParameterValue
} from '../../utils/spell-numeric-parameter.utils';
import { TargetTemplateId } from '../../utils/spell-target-config.utils';
import { SpellAutoParameterFacade } from '../spell-auto-parameter.facade';
import { SpellFormulaGraphFacade } from '../spell-formula-graph.facade';
import { SpellMechanicParametersFacade } from '../spell-mechanic-parameters.facade';

export interface SpellParameterActionsVm {
	toggleExpanded(): void;
	changeMode(mode: SpellParameterValueMode): void;
	changeProgressionSourceKind(sourceKind: ProgressionSourceKind): void;
	patchProgression(patch: Partial<SpellProgressionParameterValue>): void;
	changeProgressionPreset(presetId: string | null): void;
	changeProgressionConfig(event: { key: string; value: number | null }): void;
	changeProgressionRoundingMode(
		roundingMode: ProgressionPresetRoundingMode
	): void;
	openProgressionFormulaEditor(): void;
	patchAuto(patch: Partial<SpellAutoParameterValue>): void;
	changeAutoSourceMode(mode: AutoValueSourceMode): void;
	addAutoSource(): void;
	patchAutoSource(event: {
		sourceId: string;
		patch: Partial<SpellAutoParameterSource>;
	}): void;
	deleteAutoSource(sourceId: string): void;
	toggleAutoSourceCollapsed(source: SpellAutoParameterSource): void;
	applyAutoPreset(presetId: string | null): void;
	openFormulaEditor(): void;
	changeTargetTemplate(templateId: TargetTemplateId): void;
	changeTargetConfig(patch: Partial<SpellTargetConfigEditorValue>): void;
	changeSelectedParameter(value: string | null): void;
	changePlainParameter(value: string): void;
	toggleCasterLevelMatrix(): void;
}

@Injectable()
export class SpellParameterActionsViewModel {
	private readonly parametersFacade = inject(SpellMechanicParametersFacade);
	private readonly autoParameterFacade = inject(SpellAutoParameterFacade);
	private readonly formulaGraphFacade = inject(SpellFormulaGraphFacade);

	create(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	): SpellParameterActionsVm {
		return {
			toggleExpanded: () =>
				this.parametersFacade.toggleMechanicParameterExpanded(block, parameter),
			changeMode: (
				mode: Parameters<
					typeof this.parametersFacade.updateSelectedMechanicBlockParameterMode
				>[1]
			) =>
				this.parametersFacade.updateSelectedMechanicBlockParameterMode(
					parameter.id,
					mode
				),
			changeProgressionSourceKind: (
				sourceKind: Parameters<
					typeof this.parametersFacade.updateSelectedProgressionSourceKind
				>[2]
			) =>
				this.parametersFacade.updateSelectedProgressionSourceKind(
					block,
					parameter.id,
					sourceKind
				),
			patchProgression: (
				patch: Parameters<
					typeof this.parametersFacade.updateSelectedProgressionParameter
				>[1]
			) =>
				this.parametersFacade.updateSelectedProgressionParameter(
					parameter.id,
					patch
				),
			changeProgressionPreset: (presetId: string | null) =>
				this.parametersFacade.updateSelectedProgressionPreset(
					parameter.id,
					presetId ?? ''
				),
			changeProgressionConfig: (event: { key: string; value: number | null }) =>
				this.parametersFacade.updateSelectedProgressionConfig(
					parameter.id,
					event.key,
					event.value
				),
			changeProgressionRoundingMode: (
				roundingMode: Parameters<
					typeof this.parametersFacade.updateSelectedProgressionRoundingMode
				>[1]
			) =>
				this.parametersFacade.updateSelectedProgressionRoundingMode(
					parameter.id,
					roundingMode
				),
			openProgressionFormulaEditor: () =>
				this.formulaGraphFacade.openProgressionAsFormulaGraphEditor(
					block,
					parameter.id
				),
			patchAuto: (
				patch: Parameters<
					typeof this.autoParameterFacade.updateSelectedAutoParameter
				>[1]
			) =>
				this.autoParameterFacade.updateSelectedAutoParameter(
					parameter.id,
					patch
				),
			changeAutoSourceMode: (
				mode: Parameters<
					typeof this.autoParameterFacade.updateSelectedAutoSourceMode
				>[1]
			) =>
				this.autoParameterFacade.updateSelectedAutoSourceMode(
					parameter.id,
					mode
				),
			addAutoSource: () =>
				this.autoParameterFacade.addSelectedAutoSource(parameter.id),
			patchAutoSource: (event: {
				sourceId: string;
				patch: Partial<SpellAutoParameterSource>;
			}) =>
				this.autoParameterFacade.updateSelectedAutoSource(
					parameter.id,
					event.sourceId,
					event.patch
				),
			deleteAutoSource: (sourceId: string) =>
				this.autoParameterFacade.deleteSelectedAutoSource(
					parameter.id,
					sourceId
				),
			toggleAutoSourceCollapsed: (source: SpellAutoParameterSource) =>
				this.autoParameterFacade.toggleAutoSourceCollapsed(
					`mechanic:${parameter.id}`,
					source
				),
			applyAutoPreset: (presetId: string | null) =>
				this.autoParameterFacade.applySelectedAutoPreset(
					block,
					parameter,
					presetId
				),
			openFormulaEditor: () =>
				this.formulaGraphFacade.openSelectedFormulaGraphEditor(parameter.id),
			changeTargetTemplate: (
				templateId: Parameters<
					typeof this.parametersFacade.updateMechanicTargetTemplate
				>[2]
			) =>
				this.parametersFacade.updateMechanicTargetTemplate(
					block,
					parameter,
					templateId
				),
			changeTargetConfig: (
				patch: Parameters<
					typeof this.parametersFacade.updateMechanicTargetConfig
				>[2]
			) =>
				this.parametersFacade.updateMechanicTargetConfig(
					block,
					parameter.id,
					patch
				),
			changeSelectedParameter: (value: string | null) =>
				this.parametersFacade.updateSelectedMechanicBlockParameter(
					parameter.id,
					value
				),
			changePlainParameter: (value: string) =>
				this.parametersFacade.updateSelectedPlainParameterValue(
					parameter,
					value
				),
			toggleCasterLevelMatrix: () =>
				this.parametersFacade.toggleCasterLevelMatrix(block, parameter)
		};
	}
}
