import { inject, Injectable } from '@angular/core';
import { SpellMechanicParameter } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SpellMechanicDraftFacade } from '../application/spell-mechanic-draft.facade';
import { SpellMechanicBlockDraft } from '../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import {
	AutoValueSourceMode,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	createAutoParameterSource,
	createAutoPreset,
	createAutoSourcesForMode
} from '../utils/spell-numeric-parameter.utils';
import { SpellAutoParameterReadModel } from './read-model/spell-auto-parameter.read-model';

@Injectable()
export class SpellAutoParameterFacade {
	private readonly store = inject(AdminSpellDetailPageStore);
	private readonly draftFacade = inject(SpellMechanicDraftFacade);
	private readonly readModel = inject(SpellAutoParameterReadModel);

	updateSelectedAutoParameter(
		parameterId: string,
		patch: Partial<SpellAutoParameterValue>
	) {
		this.draftFacade.updateSelectedAutoParameter(parameterId, patch);
	}

	updateSelectedAutoSourceMode(
		parameterId: string,
		sourceMode: AutoValueSourceMode
	) {
		const block = this.selectedBlock();
		const current = block
			? this.readModel.autoParameterValue(block, parameterId)
			: null;

		if (!current) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sourceMode,
			sources: createAutoSourcesForMode(sourceMode, current.sources)
		});
	}

	addSelectedAutoSource(parameterId: string) {
		const block = this.selectedBlock();
		const current = block
			? this.readModel.autoParameterValue(block, parameterId)
			: null;

		if (!current) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sources: [...current.sources, createAutoParameterSource()]
		});
	}

	updateSelectedAutoSource(
		parameterId: string,
		sourceId: string,
		patch: Partial<SpellAutoParameterSource>
	) {
		const block = this.selectedBlock();
		const current = block
			? this.readModel.autoParameterValue(block, parameterId)
			: null;

		if (!current) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sources: current.sources.map(source =>
				source.id === sourceId ? { ...source, ...patch } : source
			)
		});
	}

	deleteSelectedAutoSource(parameterId: string, sourceId: string) {
		const block = this.selectedBlock();
		const current = block
			? this.readModel.autoParameterValue(block, parameterId)
			: null;

		if (!current || current.sources.length <= 1) {
			return;
		}

		this.updateSelectedAutoParameter(parameterId, {
			sources: current.sources.filter(source => source.id !== sourceId)
		});
	}

	toggleAutoSourceCollapsed(scope: string, source: SpellAutoParameterSource) {
		this.store.toggleAutoSourceCollapsed(
			this.readModel.autoSourceCollapseKey(scope, source)
		);
	}

	applySelectedAutoPreset(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter,
		presetId: string | null
	) {
		if (!presetId) {
			return;
		}

		const preset = createAutoPreset(
			presetId,
			parameter.numericRole,
			this.readModel.defaultAutoSourceKey(block, 'systemValue'),
			this.readModel.defaultAutoSourceKey(block, 'mechanicParameter')
		);

		if (!preset) {
			return;
		}

		this.updateSelectedAutoParameter(parameter.id, preset);
	}

	private selectedBlock() {
		const index = this.store.selectedMechanicBlockIndex();
		return index === null
			? null
			: (this.store.draft()?.mechanicBlocks[index] ?? null);
	}
}
