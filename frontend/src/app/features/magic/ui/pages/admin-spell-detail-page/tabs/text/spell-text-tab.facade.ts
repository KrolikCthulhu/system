import { computed, inject, Injectable } from '@angular/core';
import { SpellMechanicBlockDraft } from '../../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../../state/admin-spell-detail-page.store';
import { SpellTextDraftFacade } from '../../application/spell-text-draft.facade';
import {
	createFormulaSourceNameMap,
	createSpellCastingReadinessContext,
	createSpellParameterSourceOptionsContext,
	createSpellTextPreviewContext,
	spellMechanicBlockMechanic,
	SpellPreviewContextSource
} from '../../read-model/spell-preview-context.factory';
import { spellCastingUnavailableReason } from '../../read-model/spell-casting-readiness.rules';
import {
	effectScaleRequirementText,
	renderSpellTextBlockParts,
	spellTextBlockPreview,
	SpellTextPreviewContext
} from '../../read-model/spell-text-preview.read-model';
import { formulaSourceGroupsForBlock } from '../../read-model/spell-parameter-source-options.read-model';
import {
	SpellTextTabActions,
	SpellTextTabViewModel
} from './spell-text-tab.component';

const SPELL_TEXT_BLOCK_KIND_OPTIONS: SpellTextTabViewModel['blockKindOptions'] =
	[
		{ label: 'Текст', value: 'text' },
		{ label: 'Текст механики', value: 'mechanicText' }
	];
const SPELL_TEXT_PREVIEW_MODE_OPTIONS: SpellTextTabViewModel['previewModeOptions'] =
	[
		{ label: 'Игровой', value: 'game' },
		{ label: 'Формулы', value: 'formula' }
	];

@Injectable()
export class SpellTextTabFacade {
	private readonly store = inject(AdminSpellDetailPageStore);
	private readonly draftFacade = inject(SpellTextDraftFacade);
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

	readonly viewModel = computed<SpellTextTabViewModel>(() => ({
		previewModeOptions: SPELL_TEXT_PREVIEW_MODE_OPTIONS,
		previewMode: this.store.spellTextPreviewMode(),
		previewParts: this.previewParts(),
		textBlocks: this.store.draft()?.textBlocks ?? [],
		blockKindOptions: SPELL_TEXT_BLOCK_KIND_OPTIONS,
		mechanicOptions: this.mechanicBlockOptions(),
		blockPreview: block => spellTextBlockPreview(block, this.previewContext()),
		effectScaleRequirementText: item => effectScaleRequirementText(item)
	}));
	readonly actions: SpellTextTabActions = {
		updatePreviewMode: mode => this.store.setSpellTextPreviewMode(mode),
		addTextBlock: kind => this.draftFacade.addSpellTextBlock(kind),
		syncFromMechanics: () => this.draftFacade.addSpellMechanicTextBlocks(),
		updateTextBlock: (blockId, patch) =>
			this.draftFacade.updateSpellTextBlock(blockId, patch),
		deleteTextBlock: blockId => this.draftFacade.deleteSpellTextBlock(blockId),
		moveTextBlock: (index, direction) =>
			this.draftFacade.moveSpellTextBlock(index, direction)
	};

	private readonly mechanicBlockOptions = computed(() => {
		const draft = this.store.draft();

		return (draft?.mechanicBlocks ?? []).map((block, index) => ({
			label: `${index + 1}. ${
				this.mechanicBlockMechanic(block)?.name ?? 'Механика не найдена'
			}`,
			value: block.id
		}));
	});
	private readonly previewParts = computed(() => {
		const draft = this.store.draft();

		if (!draft) {
			return [];
		}

		const mode = this.store.spellTextPreviewMode();
		const parts = draft.textBlocks
			.slice()
			.sort((left, right) => left.sortOrder - right.sortOrder)
			.filter(block => block.isActive)
			.flatMap(block =>
				renderSpellTextBlockParts(block, this.previewContext(), mode)
			)
			.filter(part => part.kind === 'effectScale' || part.text.trim().length);

		if (mode !== 'game') {
			return parts;
		}

		const unavailableReason = spellCastingUnavailableReason(
			this.castingReadinessContext()
		);

		return unavailableReason
			? [{ kind: 'paragraph' as const, text: unavailableReason }, ...parts]
			: parts;
	});
	private readonly formulaSourceNames = computed(() =>
		createFormulaSourceNameMap(this.formulaSourceGroups())
	);
	private readonly formulaSourceGroups = computed(() => {
		const selection = this.store.selectedFormulaParameter();
		const block = selection
			? (this.store.draft()?.mechanicBlocks[selection.blockIndex] ?? null)
			: null;

		return formulaSourceGroupsForBlock(
			block,
			createSpellParameterSourceOptionsContext(this.previewContextSource)
		);
	});

	previewContext(): SpellTextPreviewContext {
		return createSpellTextPreviewContext(this.previewContextSource);
	}

	private castingReadinessContext() {
		return createSpellCastingReadinessContext(this.previewContextSource);
	}

	private mechanicBlockMechanic(block: SpellMechanicBlockDraft) {
		return spellMechanicBlockMechanic(block, this.store.spellMechanics());
	}
}
