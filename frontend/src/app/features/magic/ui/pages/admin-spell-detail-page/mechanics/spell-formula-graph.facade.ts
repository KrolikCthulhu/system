import { inject, Injectable } from '@angular/core';
import { formatMechanicCalculationFormula } from '../../../../../spell-mechanics/ui/mechanic-calculation-graph.formula';
import { SpellMechanicBlockDraft } from '../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import { SpellMechanicDraftFacade } from '../application/spell-mechanic-draft.facade';
import {
	SpellFormulaParameterValue,
	createGraphFromProgression,
	isFormulaParameterValue,
	isProgressionParameterValue,
	progressionSourceFormulaSourceId
} from '../utils/spell-numeric-parameter.utils';
import { createSpellFormulaSourceNames } from './read-model/spell-formula-source.read-model';

@Injectable()
export class SpellFormulaGraphFacade {
	private readonly store = inject(AdminSpellDetailPageStore);
	private readonly draftFacade = inject(SpellMechanicDraftFacade);

	formulaPreview(block: SpellMechanicBlockDraft, parameterId: string) {
		return formatMechanicCalculationFormula(
			this.formulaParameterValue(block, parameterId)?.graph,
			this.formulaSourceNamesForBlock(block)
		);
	}

	openSelectedFormulaGraphEditor(parameterId: string) {
		const blockIndex = this.store.selectedMechanicBlockIndex();

		if (blockIndex !== null) {
			this.store.setSelectedFormulaParameter({ blockIndex, parameterId });
		}
	}

	openProgressionAsFormulaGraphEditor(
		block: SpellMechanicBlockDraft,
		parameterId: string
	) {
		const progressionValue = this.progressionParameterValue(block, parameterId);
		const preset = progressionValue
			? this.store
					.progressionPresets()
					.find(item => item.id === progressionValue.presetId)
			: null;

		if (!progressionValue || !preset) {
			return;
		}

		this.draftFacade.updateSelectedMechanicBlockParameter(parameterId, {
			mode: 'formula',
			graph: createGraphFromProgression(
				preset.kind,
				progressionValue.config,
				progressionSourceFormulaSourceId(progressionValue)
			)
		});
		this.openSelectedFormulaGraphEditor(parameterId);
	}

	private formulaParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	): SpellFormulaParameterValue | null {
		const value = this.rawParameterValue(block, parameterId);
		return isFormulaParameterValue(value) ? value : null;
	}

	private progressionParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	) {
		const value = this.rawParameterValue(block, parameterId);
		return isProgressionParameterValue(value) ? value : null;
	}

	private formulaSourceNamesForBlock(block: SpellMechanicBlockDraft) {
		return createSpellFormulaSourceNames(this.formulaSourceContext(block), {
			skillSourceMode: 'graph'
		});
	}

	private formulaSourceContext(block: SpellMechanicBlockDraft) {
		return {
			block,
			conditions: this.store.conditions(),
			damageTypes: this.store.damageTypes(),
			mechanics: this.store.spellMechanics(),
			progressionPresets: this.store.progressionPresets(),
			skillCategories: this.store.skillCategories(),
			skills: this.store.skills(),
			systemValues: this.store.systemValues(),
			targetConfigs: this.store.draft()?.targetConfigs ?? []
		};
	}

	private rawParameterValue(
		block: SpellMechanicBlockDraft,
		parameterIdOrSlug: string
	) {
		const key = this.parameterStorageKey(block, parameterIdOrSlug);

		return block.parameterValues[key];
	}

	private parameterStorageKey(
		block: SpellMechanicBlockDraft,
		parameterIdOrSlug: string
	) {
		const parameter = this.findMechanic(block.mechanicId)?.parameters.find(
			item => item.id === parameterIdOrSlug || item.slug === parameterIdOrSlug
		);

		return parameter ? parameter.slug || parameter.id : parameterIdOrSlug;
	}

	private findMechanic(mechanicId: string) {
		return (
			this.store
				.spellMechanics()
				.find(mechanic => mechanic.id === mechanicId) ?? null
		);
	}
}
