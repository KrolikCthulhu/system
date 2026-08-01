import { inject, Injectable } from '@angular/core';
import {
	SpellEffectScaleConfig,
	SpellEffectScaleItemConfig,
	SpellEffectScaleMode,
	SpellNestedMechanicBlockConfig
} from '../../../../domain/spell.models';
import { SpellMechanicParameter } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	SpellDraft,
	SpellMechanicBlockDraft
} from '../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import { SpellParameterValue } from '../utils/spell-numeric-parameter.utils';
import {
	addEffectScaleNestedMechanicCommand,
	deleteEffectScaleNestedMechanicCommand,
	updateEffectScaleConfigCommand,
	updateEffectScaleItemCommand,
	updateEffectScaleNestedMechanicCommand,
	updateEffectScaleNestedParameterCommand
} from '../application/commands/spell-effect-scale-draft.commands';
import { spellEffectScaleConfig } from '../read-model/spell-preview-context.factory';
import { effectScaleReadinessIssues } from '../read-model/spell-mechanic-readiness.rules';
import { effectScaleRequirementText } from '../read-model/spell-text-preview.read-model';
import { compareByOrderAndName } from '../read-model/spell-detail-options.read-model';
import { SpellMechanicParameterReadModel } from './read-model/spell-mechanic-parameter.read-model';

@Injectable()
export class SpellEffectScaleFacade {
	private readonly store = inject(AdminSpellDetailPageStore);
	private readonly parameterReadModel = inject(SpellMechanicParameterReadModel);

	readonly effectScaleModeOptions: Array<{
		label: string;
		value: SpellEffectScaleMode;
	}> = [
		{ label: 'Лучший доступный', value: 'best' },
		{ label: 'Выбор доступного', value: 'choice' },
		{ label: 'Все доступные', value: 'all' },
		{ label: 'Точное совпадение', value: 'exact' }
	];
	readonly effectScaleMechanicParameters = (
		block: SpellNestedMechanicBlockConfig
	) =>
		this.parameterReadModel.mechanicBlockParameters(
			block as SpellMechanicBlockDraft
		);
	readonly effectScaleUsesParameterSelect = (
		kind: SpellMechanicParameter['kind']
	) => this.parameterReadModel.usesParameterSelect(kind);
	readonly effectScaleParameterOptions = (parameter: SpellMechanicParameter) =>
		this.parameterReadModel.parameterOptions(parameter);
	readonly effectScaleParameterValue = (
		block: SpellNestedMechanicBlockConfig,
		parameterId: string
	) =>
		this.parameterReadModel.parameterValue(
			block as SpellMechanicBlockDraft,
			parameterId
		);
	readonly effectScaleStaticParameterValue = (
		block: SpellNestedMechanicBlockConfig,
		parameterId: string
	) =>
		this.parameterReadModel.staticParameterValue(
			block as SpellMechanicBlockDraft,
			parameterId
		);
	readonly effectScaleConfigChangeHandler = (
		block: SpellMechanicBlockDraft,
		patch: Partial<SpellEffectScaleConfig>
	) => this.updateEffectScaleConfig(block, patch);
	readonly effectScaleNestedMechanicAddHandler = (
		block: SpellMechanicBlockDraft,
		itemId: string
	) => this.addEffectScaleNestedMechanic(block, itemId);
	readonly effectScaleNestedMechanicChangeHandler = (
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		mechanicId: string
	) =>
		this.updateEffectScaleNestedMechanic(
			block,
			itemId,
			nestedBlockId,
			mechanicId
		);
	readonly effectScaleNestedMechanicDeleteHandler = (
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string
	) => this.deleteEffectScaleNestedMechanic(block, itemId, nestedBlockId);
	readonly effectScaleNestedParameterChangeHandler = (
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		parameterId: string,
		value: SpellParameterValue | null
	) =>
		this.updateEffectScaleNestedParameter(
			block,
			itemId,
			nestedBlockId,
			parameterId,
			value
		);

	isEffectScaleBlock(block: SpellMechanicBlockDraft) {
		return (
			this.findMechanic(block.mechanicId)?.actions.some(
				action => action.kind === 'effectScale'
			) ?? false
		);
	}

	effectScaleConfig(block: SpellMechanicBlockDraft): SpellEffectScaleConfig {
		return spellEffectScaleConfig(block);
	}

	effectScaleRequirementText(item: SpellEffectScaleItemConfig) {
		return effectScaleRequirementText(item);
	}

	effectScaleReadinessIssues(block: SpellMechanicBlockDraft) {
		return effectScaleReadinessIssues(
			block,
			this.store.draft(),
			this.store.spellMechanics()
		);
	}

	parameterOptions(parameter: SpellMechanicParameter) {
		return this.parameterReadModel.parameterOptions(parameter);
	}

	private updateEffectScaleConfig(
		block: SpellMechanicBlockDraft,
		patch: Partial<SpellEffectScaleConfig>
	) {
		const draft = this.store.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(updateEffectScaleConfigCommand(draft, block.id, patch));
	}

	private updateEffectScaleItem(
		block: SpellMechanicBlockDraft,
		itemId: string,
		patch: Partial<SpellEffectScaleItemConfig>
	) {
		const draft = this.store.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(
			updateEffectScaleItemCommand(draft, block.id, itemId, patch)
		);
	}

	private addEffectScaleNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string
	) {
		const mechanic = this.store
			.spellMechanics()
			.filter(item => item.isActive)
			.sort(compareByOrderAndName)[0];

		if (!mechanic) {
			return;
		}

		const draft = this.store.draft();

		if (!draft || !mechanic) {
			return;
		}

		this.patchDraft(
			addEffectScaleNestedMechanicCommand(
				draft,
				block.id,
				itemId,
				mechanic,
				this.essenceMagicWord()
			)
		);
	}

	private updateEffectScaleNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		mechanicId: string
	) {
		const mechanic = this.findMechanic(mechanicId);
		const draft = this.store.draft();

		if (!draft || !mechanic) {
			return;
		}

		this.patchDraft(
			updateEffectScaleNestedMechanicCommand(
				draft,
				block.id,
				itemId,
				nestedBlockId,
				mechanic,
				this.essenceMagicWord()
			)
		);
	}

	private updateEffectScaleNestedParameter(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string,
		parameterId: string,
		value: SpellParameterValue | null
	) {
		const draft = this.store.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(
			updateEffectScaleNestedParameterCommand(
				draft,
				this.store.spellMechanics(),
				block.id,
				itemId,
				nestedBlockId,
				parameterId,
				value
			)
		);
	}

	private deleteEffectScaleNestedMechanic(
		block: SpellMechanicBlockDraft,
		itemId: string,
		nestedBlockId: string
	) {
		const draft = this.store.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(
			deleteEffectScaleNestedMechanicCommand(
				draft,
				block.id,
				itemId,
				nestedBlockId
			)
		);
	}

	private patchDraft(patch: Partial<SpellDraft> | null) {
		if (patch) {
			this.store.patchDraft(patch);
		}
	}

	private findMechanic(mechanicId: string) {
		return (
			this.store
				.spellMechanics()
				.find(mechanic => mechanic.id === mechanicId) ?? null
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
