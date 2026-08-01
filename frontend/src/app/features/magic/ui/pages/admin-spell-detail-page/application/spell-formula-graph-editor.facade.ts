import { computed, inject, Injectable } from '@angular/core';
import {
	MechanicCalculationGraphState,
	MechanicCalculationSourceGroup
} from '../../../../../spell-mechanics/ui/mechanic-calculation-graph.models';
import { SpellMechanicParameter } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	createFormulaSourceNameMap,
	createSpellParameterSourceOptionsContext,
	SpellPreviewContextSource
} from '../read-model/spell-preview-context.factory';
import { formulaSourceGroupsForBlock } from '../read-model/spell-parameter-source-options.read-model';
import { SpellMechanicBlockDraft } from '../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import { SpellMechanicDraftFacade } from './spell-mechanic-draft.facade';
import { isFormulaParameterValue } from '../utils/spell-numeric-parameter.utils';

@Injectable()
export class SpellFormulaGraphEditorFacade {
	private readonly store = inject(AdminSpellDetailPageStore);
	private readonly draftFacade = inject(SpellMechanicDraftFacade);
	private readonly previewContextSource: SpellPreviewContextSource = {
		draft: () => this.store.draft(),
		mechanics: () => this.store.spellMechanics(),
		progressionPresets: () => this.store.progressionPresets(),
		skills: () => this.store.skills(),
		skillCategories: () => this.store.skillCategories(),
		skillLevels: () => this.store.skillLevels(),
		damageTypes: () => this.store.damageTypes(),
		conditions: () => this.store.conditions(),
		magicWords: () => this.store.magicWords(),
		systemValues: () => this.store.systemValues(),
		sandboxInputValues: () => this.store.sandboxInputValues(),
		textPreviewMode: () => this.store.spellTextPreviewMode(),
		formulaSourceNames: () => this.sourceNames()
	};

	readonly selectedFormulaParameter = this.store.selectedFormulaParameter;

	readonly sourceGroups = computed<MechanicCalculationSourceGroup[]>(() => {
		return formulaSourceGroupsForBlock(
			this.selectedBlock(),
			createSpellParameterSourceOptionsContext(this.previewContextSource)
		);
	});

	private readonly sourceNames = computed(() =>
		createFormulaSourceNameMap(this.sourceGroups())
	);

	selectedGraph() {
		const selection = this.selectedFormulaParameter();
		const block = this.selectedBlock();

		return block
			? (this.formulaParameterValue(block, selection?.parameterId ?? '')
					?.graph ?? null)
			: null;
	}

	setVisible(visible: boolean) {
		if (!visible) {
			this.close();
		}
	}

	updateGraph(graph: MechanicCalculationGraphState | null) {
		this.draftFacade.updateSelectedFormulaGraph(graph);
	}

	private close() {
		this.store.setSelectedFormulaParameter(null);
	}

	private selectedBlock() {
		const selection = this.selectedFormulaParameter();

		return selection
			? (this.store.draft()?.mechanicBlocks[selection.blockIndex] ?? null)
			: null;
	}

	private formulaParameterValue(
		block: SpellMechanicBlockDraft,
		parameterId: string
	) {
		const value = this.rawParameterValue(block, parameterId);

		return isFormulaParameterValue(value) ? value : null;
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
		const parameter = this.mechanicBlockMechanic(block)?.parameters.find(
			item => item.id === parameterIdOrSlug || item.slug === parameterIdOrSlug
		);

		return parameter ? parameterStorageKey(parameter) : parameterIdOrSlug;
	}

	private mechanicBlockMechanic(block: SpellMechanicBlockDraft) {
		return (
			this.store
				.spellMechanics()
				.find(mechanic => mechanic.id === block.mechanicId) ?? null
		);
	}
}

function parameterStorageKey(parameter: SpellMechanicParameter) {
	return parameter.slug || parameter.id;
}
