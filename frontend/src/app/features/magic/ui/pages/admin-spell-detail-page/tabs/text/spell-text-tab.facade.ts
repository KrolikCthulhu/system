import { computed, inject, Injectable } from '@angular/core';
import { SpellMechanicBlockDraft } from '../../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../../state/admin-spell-detail-page.store';
import { SpellTextDraftFacade } from '../../application/spell-text-draft.facade';
import {
	normalizeApplicationConfig,
	readDefaultApplicationConfig
} from '../../read-model/spell-mechanic-draft.helpers';
import { readSpellEffectScaleConfig } from '../../read-model/spell-effect-scale-config.presenter';
import {
	spellCastingUnavailableReason,
	SpellCastingReadinessContext
} from '../../read-model/spell-casting-readiness.presenter';
import { evaluateAutoParameterForGameText } from '../../read-model/spell-auto-parameter-runtime.presenter';
import {
	autoSourceRuntimeValue,
	SpellRuntimeSourceResolverContext
} from '../../read-model/spell-runtime-source-resolver.presenter';
import {
	effectScaleRequirementText,
	parameterValueLabel,
	renderSpellTextBlock,
	renderSpellTextBlockParts,
	spellTextBlockPreview,
	SpellTextPreviewContext
} from '../../read-model/spell-text-preview.presenter';
import {
	formulaSourceGroupsForBlock,
	SpellParameterSourceOptionsContext
} from '../../read-model/spell-parameter-source-options.presenter';
import { SpellAutoParameterValue } from '../../utils/spell-numeric-parameter.utils';
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
	private readonly formulaSourceNames = computed(
		() =>
			new Map(
				this.formulaSourceGroups()
					.flatMap(group => group.items)
					.map(item => [item.id, item.name] as const)
			)
	);
	private readonly formulaSourceGroups = computed(() => {
		const selection = this.store.selectedFormulaParameter();
		const block = selection
			? (this.store.draft()?.mechanicBlocks[selection.blockIndex] ?? null)
			: null;

		return formulaSourceGroupsForBlock(
			block,
			this.parameterSourceOptionsContext()
		);
	});

	previewContext(): SpellTextPreviewContext {
		return {
			draft: this.store.draft(),
			mechanics: this.store.spellMechanics(),
			progressionPresets: this.store.progressionPresets(),
			skills: this.store.skills(),
			damageTypes: this.store.damageTypes(),
			conditions: this.store.conditions(),
			formulaSourceNames: this.formulaSourceNames(),
			mode: this.store.spellTextPreviewMode(),
			mechanicApplicationConfig: block => this.mechanicApplicationConfig(block),
			effectScaleConfig: block =>
				readSpellEffectScaleConfig(block.config['effectScale']),
			evaluateAutoParameterForGameText: (block, value) =>
				this.evaluateAutoParameterForGameText(block, value)
		};
	}

	private parameterSourceOptionsContext(): SpellParameterSourceOptionsContext {
		return {
			mechanics: this.store.spellMechanics(),
			skillCategories: this.store.skillCategories(),
			skills: this.store.skills(),
			systemValues: this.store.systemValues(),
			parameterValueLabel: (kind, value) =>
				parameterValueLabel(kind, value, this.previewContext())
		};
	}

	private runtimeSourceResolverContext(): SpellRuntimeSourceResolverContext {
		const essence = this.essenceMagicWord();

		return {
			essenceProfile: essence?.essenceProfile ?? null,
			mechanics: this.store.spellMechanics(),
			sandboxInputValues: this.store.sandboxInputValues(),
			skills: this.store.skills(),
			systemValues: this.store.systemValues()
		};
	}

	private castingReadinessContext(): SpellCastingReadinessContext {
		return {
			draft: this.store.draft(),
			essence: this.essenceMagicWord(),
			mechanics: this.store.spellMechanics(),
			runtime: this.runtimeSourceResolverContext(),
			skills: this.store.skills()
		};
	}

	private mechanicBlockMechanic(block: SpellMechanicBlockDraft) {
		return (
			this.store
				.spellMechanics()
				.find(mechanic => mechanic.id === block.mechanicId) ?? null
		);
	}

	private mechanicApplicationConfig(block: SpellMechanicBlockDraft) {
		return normalizeApplicationConfig(
			block.config.application ??
				readDefaultApplicationConfig(
					this.mechanicBlockMechanic(block)?.configSchema ?? {}
				)
		);
	}

	private evaluateAutoParameterForGameText(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue
	) {
		return evaluateAutoParameterForGameText(block, value, {
			maxActiveSkillLevel: this.maxActiveSkillLevel(),
			sourceValue: (sourceBlock, source) =>
				autoSourceRuntimeValue(
					sourceBlock,
					source,
					this.runtimeSourceResolverContext()
				)
		});
	}

	private maxActiveSkillLevel() {
		return (
			this.store
				.skillLevels()
				.filter(level => level.isActive)
				.sort((left, right) => right.level - left.level)[0]?.level ?? 0
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
