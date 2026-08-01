import { computed, inject, Injectable } from '@angular/core';
import { SpellMechanic } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SpellMechanicApplicationConfig } from '../../../../domain/spell.models';
import {
	createFormulaSourceNameMap,
	createSpellTextPreviewContext,
	spellMechanicApplicationConfig,
	SpellPreviewContextSource
} from '../read-model/spell-preview-context.factory';
import { createMechanicProblems } from '../read-model/spell-mechanic-readiness.rules';
import { formulaSourceGroupsForBlock } from '../read-model/spell-parameter-source-options.read-model';
import { mechanicBlockTextPreview } from '../read-model/spell-text-preview.read-model';
import {
	deleteMechanicBlockCommand,
	moveMechanicBlockCommand,
	replaceMechanicBlockCommand,
	updateMechanicBlockActiveCommand,
	updateMechanicBlockApplicationCommand
} from '../application/commands/spell-mechanic-block-draft.commands';
import { compareByOrderAndName } from '../read-model/spell-detail-options.read-model';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import {
	SpellDraft,
	SpellMechanicBlockDraft
} from '../models/spell-detail-page.types';
import { renderApplicationText } from '../utils/mechanic-text-template-renderer';
import {
	parameterValueText,
	SpellParameterValue
} from '../utils/spell-numeric-parameter.utils';

@Injectable()
export class SpellMechanicBlocksFacade {
	private readonly store = inject(AdminSpellDetailPageStore);
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
		formulaSourceNames: () => this.formulaSourceNames()
	};

	readonly draft = this.store.draft;
	readonly selectedIndex = this.store.selectedMechanicBlockIndex;
	readonly selectedBlock = computed(() => {
		const index = this.selectedIndex();
		return index === null
			? null
			: (this.draft()?.mechanicBlocks[index] ?? null);
	});
	readonly mechanicOptions = computed(() =>
		this.store
			.spellMechanics()
			.filter(mechanic => mechanic.isActive)
			.sort(compareByOrderAndName)
			.map(mechanic => ({
				label: mechanic.name,
				value: mechanic.id
			}))
	);
	private readonly formulaSourceGroups = computed(() =>
		formulaSourceGroupsForBlock(this.selectedBlock(), {
			mechanics: this.store.spellMechanics(),
			skillCategories: this.store.skillCategories(),
			skills: this.store.skills(),
			systemValues: this.store.systemValues(),
			parameterValueLabel: (_, value) =>
				parameterValueText(value as SpellParameterValue)
		})
	);
	private readonly formulaSourceNames = computed(() =>
		createFormulaSourceNameMap(this.formulaSourceGroups())
	);

	addMechanicBlock() {
		const mechanic = this.store
			.spellMechanics()
			.filter(item => item.isActive)
			.sort(compareByOrderAndName)[0];

		this.store.openAddMechanicWizard(mechanic?.id ?? null);
	}

	selectMechanicBlock(index: number) {
		this.store.setSelectedMechanicBlockIndex(index);
	}

	moveMechanicBlock(index: number, direction: -1 | 1) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(moveMechanicBlockCommand(draft, index, direction));
		this.store.selectMovedMechanicBlock(index, direction);
	}

	updateSelectedMechanicBlockMechanic(mechanicId: string) {
		const index = this.selectedIndex();

		if (index !== null) {
			this.updateMechanicBlockMechanic(index, mechanicId);
		}
	}

	updateSelectedMechanicBlockActive(isActive: boolean) {
		const index = this.selectedIndex();
		const draft = this.draft();

		if (index !== null && draft) {
			this.patchDraft(updateMechanicBlockActiveCommand(draft, index, isActive));
		}
	}

	deleteSelectedMechanicBlock() {
		const index = this.selectedIndex();
		const draft = this.draft();

		if (index === null || !draft) {
			return;
		}

		this.patchDraft(deleteMechanicBlockCommand(draft, index));
		this.store.selectMechanicBlockAfterDelete(
			index,
			draft.mechanicBlocks.length
		);
	}

	updateSelectedMechanicApplication(
		patch: Partial<SpellMechanicApplicationConfig>
	) {
		const index = this.selectedIndex();
		const draft = this.draft();
		const block = index === null ? null : draft?.mechanicBlocks[index];

		if (index === null || !draft || !block) {
			return;
		}

		this.patchDraft(
			updateMechanicBlockApplicationCommand(
				draft,
				index,
				this.mechanicApplicationConfig(block),
				patch
			)
		);
	}

	mechanicApplicationConfig(block: SpellMechanicBlockDraft) {
		return spellMechanicApplicationConfig(block, this.store.spellMechanics());
	}

	mechanicApplicationText(block: SpellMechanicBlockDraft) {
		return renderApplicationText(this.mechanicApplicationConfig(block));
	}

	mechanicName(block: SpellMechanicBlockDraft) {
		return this.findMechanic(block.mechanicId)?.name ?? 'Механика не найдена';
	}

	mechanicBlockTextPreview(block: SpellMechanicBlockDraft) {
		return mechanicBlockTextPreview(
			block,
			createSpellTextPreviewContext(this.previewContextSource)
		);
	}

	isMechanicBlockInvalid(block: SpellMechanicBlockDraft) {
		const index = this.draft()?.mechanicBlocks.indexOf(block) ?? -1;

		return createMechanicProblems(
			this.draft(),
			this.store.spellMechanics()
		).some(problem => problem.blockIndex === index);
	}

	private updateMechanicBlockMechanic(index: number, mechanicId: string) {
		const mechanic = this.findMechanic(mechanicId);
		const draft = this.draft();

		if (!mechanic || !draft) {
			return;
		}

		this.patchDraft(
			replaceMechanicBlockCommand(
				draft,
				index,
				mechanic,
				this.essenceMagicWord()
			)
		);
		this.store.setSelectedMechanicBlockIndex(index);
	}

	private patchDraft(patch: Partial<SpellDraft> | null) {
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

	private essenceMagicWord() {
		const essenceId = this.draft()?.essenceId;

		return (
			this.store
				.magicWords()
				.find(word => word.id === essenceId && word.type === 'ESSENCE') ?? null
		);
	}
}
