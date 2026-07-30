import { inject, Injectable } from '@angular/core';
import { ProgressionPresetRoundingMode } from '../../../../../progression-presets/domain/progression-presets.models';
import { SpellMechanic } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { MechanicCalculationGraphState } from '../../../../../spell-mechanics/ui/mechanic-calculation-graph.models';
import { SpellTargetConfig } from '../../../../domain/spell.models';
import {
	SpellDraft,
	SpellMechanicBlockDraft,
	SpellParameterValueMode
} from '../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import {
	AutoValueSourceMode,
	createAutoParameterSource,
	ProgressionSourceKind,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellParameterValue,
	SpellProgressionParameterValue
} from '../utils/spell-numeric-parameter.utils';
import { TargetTemplateId } from '../utils/spell-target-config.utils';
import {
	addAutoSourceCommand,
	addMechanicBlockCommand,
	applyAutoPresetCommand,
	deleteAutoSourceCommand,
	updateAutoParameterCommand,
	updateAutoSourceCommand,
	updateAutoSourceModeCommand,
	updateFormulaGraphCommand,
	updateMechanicBlockParameterCommand,
	updateMechanicBlockParameterModeCommand,
	updateMechanicTargetConfigCommand,
	updateMechanicTargetTemplateCommand,
	updateProgressionConfigCommand,
	updateProgressionParameterCommand,
	updateProgressionPresetCommand,
	updateProgressionRoundingModeCommand,
	updateProgressionSourceKindCommand
} from './commands/spell-mechanic-draft.commands';

@Injectable()
export class SpellMechanicDraftFacade {
	private readonly store = inject(AdminSpellDetailPageStore);

	updateMechanicTargetConfig(
		targetId: string,
		patch: Partial<SpellTargetConfig>
	) {
		this.patchDraft(command =>
			updateMechanicTargetConfigCommand(command.draft, targetId, patch)
		);
	}

	updateMechanicTargetTemplate(
		block: SpellMechanicBlockDraft,
		parameterId: string,
		templateId: TargetTemplateId
	) {
		const parameter = this.findMechanic(block.mechanicId)?.parameters.find(
			item => item.id === parameterId
		);

		if (!parameter) {
			return;
		}

		this.patchDraft(command =>
			updateMechanicTargetTemplateCommand(
				command.draft,
				block,
				parameter,
				templateId,
				crypto.randomUUID()
			)
		);
	}

	addSelectedMechanicBlock() {
		const mechanic = this.store
			.spellMechanics()
			.find(item => item.id === this.store.selectedWizardMechanicId());
		const draft = this.store.draft();

		if (!mechanic || !draft) {
			return;
		}

		this.store.patchDraft(
			addMechanicBlockCommand(draft, mechanic, this.essenceMagicWord(), {
				blockId: crypto.randomUUID(),
				textBlockId: crypto.randomUUID()
			})
		);
		this.store.selectAppendedMechanicBlock(draft.mechanicBlocks.length);
	}

	updateMechanicBlockParameter(
		blockIndex: number,
		parameterId: string,
		value: SpellParameterValue | null
	) {
		this.patchDraft(command =>
			updateMechanicBlockParameterCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				value
			)
		);
	}

	updateMechanicBlockParameterMode(
		blockIndex: number,
		parameterId: string,
		mode: SpellParameterValueMode
	) {
		this.patchDraft(command =>
			updateMechanicBlockParameterModeCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				mode,
				this.firstProgressionPreset()
			)
		);
	}

	updateSelectedMechanicBlockParameter(
		parameterId: string,
		value: SpellParameterValue | null
	) {
		const index = this.store.selectedMechanicBlockIndex();

		if (index !== null) {
			this.updateMechanicBlockParameter(index, parameterId, value);
		}
	}

	updateSelectedMechanicBlockParameterMode(
		parameterId: string,
		mode: SpellParameterValueMode
	) {
		const index = this.store.selectedMechanicBlockIndex();

		if (index !== null) {
			this.updateMechanicBlockParameterMode(index, parameterId, mode);
		}
	}

	updateSelectedProgressionParameter(
		parameterId: string,
		patch: Partial<SpellProgressionParameterValue>
	) {
		this.patchSelectedBlock((command, blockIndex) =>
			updateProgressionParameterCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				patch
			)
		);
	}

	updateSelectedProgressionPreset(parameterId: string, presetId: string) {
		const preset =
			this.store.progressionPresets().find(item => item.id === presetId) ??
			null;

		this.patchSelectedBlock((command, blockIndex) =>
			updateProgressionPresetCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				presetId,
				preset
			)
		);
	}

	updateSelectedProgressionConfig(
		parameterId: string,
		key: string,
		value: number | null
	) {
		this.patchSelectedBlock((command, blockIndex) =>
			updateProgressionConfigCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				key,
				value
			)
		);
	}

	updateSelectedProgressionRoundingMode(
		parameterId: string,
		roundingModeValue: ProgressionPresetRoundingMode
	) {
		this.patchSelectedBlock((command, blockIndex) =>
			updateProgressionRoundingModeCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				roundingModeValue
			)
		);
	}

	updateSelectedAutoParameter(
		parameterId: string,
		patch: Partial<SpellAutoParameterValue>
	) {
		this.patchSelectedBlock((command, blockIndex) =>
			updateAutoParameterCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				patch
			)
		);
	}

	updateSelectedAutoSourceMode(
		parameterId: string,
		sourceMode: AutoValueSourceMode
	) {
		this.patchSelectedBlock((command, blockIndex) =>
			updateAutoSourceModeCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				sourceMode
			)
		);
	}

	addSelectedAutoSource(parameterId: string) {
		this.patchSelectedBlock((command, blockIndex) =>
			addAutoSourceCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				createAutoParameterSource()
			)
		);
	}

	updateSelectedAutoSource(
		parameterId: string,
		sourceId: string,
		patch: Partial<SpellAutoParameterSource>
	) {
		this.patchSelectedBlock((command, blockIndex) =>
			updateAutoSourceCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				sourceId,
				patch
			)
		);
	}

	deleteSelectedAutoSource(parameterId: string, sourceId: string) {
		this.patchSelectedBlock((command, blockIndex) =>
			deleteAutoSourceCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				sourceId
			)
		);
	}

	applySelectedAutoPreset(
		parameterId: string,
		numericRole: Parameters<typeof applyAutoPresetCommand>[4],
		presetId: string | null,
		systemValueSourceKey: string,
		mechanicParameterSourceKey: string
	) {
		this.patchSelectedBlock((command, blockIndex) =>
			applyAutoPresetCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				numericRole,
				presetId,
				systemValueSourceKey,
				mechanicParameterSourceKey
			)
		);
	}

	updateSelectedFormulaGraph(graph: MechanicCalculationGraphState | null) {
		const selection = this.store.selectedFormulaParameter();

		if (!selection) {
			return;
		}

		this.patchDraft(command =>
			updateFormulaGraphCommand(
				command.draft,
				command.mechanics,
				selection.blockIndex,
				selection.parameterId,
				graph
			)
		);
	}

	updateSelectedProgressionSourceKind(
		parameterId: string,
		sourceKind: ProgressionSourceKind,
		nextSourceKey: string
	) {
		this.patchSelectedBlock((command, blockIndex) =>
			updateProgressionSourceKindCommand(
				command.draft,
				command.mechanics,
				blockIndex,
				parameterId,
				sourceKind,
				nextSourceKey
			)
		);
	}

	resetDraft() {
		this.store.resetDraftSnapshot();
	}

	private patchSelectedBlock(
		createPatch: (
			command: DraftCommandContext,
			blockIndex: number
		) => Partial<SpellDraft> | null
	) {
		const blockIndex = this.store.selectedMechanicBlockIndex();

		if (blockIndex === null) {
			return;
		}

		this.patchDraft(command => createPatch(command, blockIndex));
	}

	private patchDraft(
		createPatch: (command: DraftCommandContext) => Partial<SpellDraft> | null
	) {
		const draft = this.store.draft();

		if (!draft) {
			return;
		}

		const patch = createPatch({
			draft,
			mechanics: this.store.spellMechanics()
		});

		if (patch) {
			this.store.patchDraft(patch);
		}
	}

	private findMechanic(mechanicId: string): SpellMechanic | null {
		return (
			this.store
				.spellMechanics()
				.find(mechanic => mechanic.id === mechanicId) ?? null
		);
	}

	private firstProgressionPreset() {
		return (
			this.store
				.progressionPresets()
				.filter(preset => preset.isActive)
				.sort(
					(left, right) =>
						left.sortOrder - right.sortOrder ||
						left.name.localeCompare(right.name)
				)[0] ?? null
		);
	}

	private essenceMagicWord() {
		const essenceId = this.store.draft()?.essenceId;
		return (
			this.store
				.magicWords()
				.find(word => word.id === essenceId && word.type === 'ESSENCE') ?? null
		);
	}
}

interface DraftCommandContext {
	draft: SpellDraft;
	mechanics: SpellMechanic[];
}
