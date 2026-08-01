import { computed, inject, Injectable } from '@angular/core';
import {
	CommandSelectOption,
	CommandSelectOptionGroup,
	SpellAreaDimension,
	SpellParameterValueMode
} from '../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import {
	AutoValueSourceKind,
	AutoValueSourceMode,
	isAutoParameterValue,
	NumericParameterPreview,
	parameterValueText,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellParameterValue
} from '../utils/spell-numeric-parameter.utils';
import {
	addAreaAutoSourceCommand,
	createAreaDimensions,
	deleteAreaAutoSourceCommand,
	updateAreaAutoParameterCommand,
	updateAreaAutoSourceCommand,
	updateAreaAutoSourceModeCommand,
	updateAreaParameterModeCommand,
	updateAreaStaticParameterValueCommand
} from './spell-area-draft.commands';
import { areaNumericPreview } from './spell-area-preview.read-model';
import {
	areaSourceKeyLabel,
	areaSourceKeyOptionGroups,
	areaSourceNames,
	areaSourceSummary,
	areaTransformSourceOptions,
	defaultAreaSourceKey,
	SpellAreaSourceOptionsContext
} from './spell-area-source-options.read-model';

@Injectable()
export class SpellAreaEditorFacade {
	private readonly pageStore = inject(AdminSpellDetailPageStore);

	readonly areaShape = computed(() => {
		const gestureId = this.pageStore.draft()?.gestureId;

		return gestureId
			? (this.pageStore.magicWords().find(word => word.id === gestureId)
					?.areaShape ?? null)
			: null;
	});

	readonly dimensions = computed(() => createAreaDimensions(this.areaShape()));

	readonly parameterValueModeOptions: CommandSelectOption<SpellParameterValueMode>[] =
		[
			{ label: 'Значение', value: 'static' },
			{ label: 'Авто', value: 'auto' }
		];

	readonly progressionPreviewSteps = computed(() =>
		this.pageStore
			.skillLevels()
			.filter(level => level.isActive)
			.sort((left, right) => left.level - right.level)
			.map(level => level.level)
	);

	parameterValue(dimensionKey: string) {
		const value = this.pageStore.draft()?.config.area?.dimensions[dimensionKey];
		return isSpellParameterValue(value)
			? value
			: { mode: 'static', value: '0' };
	}

	parameterValueMode(dimensionKey: string): SpellParameterValueMode {
		return isAutoParameterValue(this.parameterValue(dimensionKey))
			? 'auto'
			: 'static';
	}

	staticParameterValue(dimensionKey: string) {
		return parameterValueText(this.parameterValue(dimensionKey));
	}

	updateParameterMode(
		dimension: SpellAreaDimension,
		mode: SpellParameterValueMode
	) {
		const draft = this.pageStore.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(
			updateAreaParameterModeCommand(
				draft,
				this.areaShape(),
				dimension,
				mode,
				this.parameterValue(dimension.key),
				{
					systemValue: this.defaultSourceKey('systemValue'),
					mechanicParameter: this.defaultSourceKey('mechanicParameter')
				}
			)
		);
	}

	updateStaticParameterValue(dimensionKey: string, value: string) {
		const draft = this.pageStore.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(
			updateAreaStaticParameterValueCommand(
				draft,
				this.areaShape(),
				dimensionKey,
				value
			)
		);
	}

	autoParameterValue(dimensionKey: string): SpellAutoParameterValue | null {
		const value = this.parameterValue(dimensionKey);
		return isAutoParameterValue(value) ? value : null;
	}

	updateAutoParameter(
		dimensionKey: string,
		patch: Partial<SpellAutoParameterValue>
	) {
		const draft = this.pageStore.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(
			updateAreaAutoParameterCommand(
				draft,
				this.areaShape(),
				dimensionKey,
				this.autoParameterValue(dimensionKey),
				patch
			)
		);
	}

	updateAutoSourceMode(dimensionKey: string, sourceMode: AutoValueSourceMode) {
		const draft = this.pageStore.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(
			updateAreaAutoSourceModeCommand(
				draft,
				this.areaShape(),
				dimensionKey,
				this.autoParameterValue(dimensionKey),
				sourceMode
			)
		);
	}

	addAutoSource(dimensionKey: string) {
		const draft = this.pageStore.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(
			addAreaAutoSourceCommand(
				draft,
				this.areaShape(),
				dimensionKey,
				this.autoParameterValue(dimensionKey)
			)
		);
	}

	updateAutoSource(
		dimensionKey: string,
		sourceId: string,
		patch: Partial<SpellAutoParameterSource>
	) {
		const draft = this.pageStore.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(
			updateAreaAutoSourceCommand(
				draft,
				this.areaShape(),
				dimensionKey,
				this.autoParameterValue(dimensionKey),
				sourceId,
				patch
			)
		);
	}

	deleteAutoSource(dimensionKey: string, sourceId: string) {
		const draft = this.pageStore.draft();

		if (!draft) {
			return;
		}

		this.patchDraft(
			deleteAreaAutoSourceCommand(
				draft,
				this.areaShape(),
				dimensionKey,
				this.autoParameterValue(dimensionKey),
				sourceId
			)
		);
	}

	sourceKeyOptionGroups(
		source: SpellAutoParameterSource
	): CommandSelectOptionGroup[] {
		return areaSourceKeyOptionGroups(source, this.sourceOptionsContext());
	}

	transformSourceOptions(
		value: SpellAutoParameterValue,
		currentSource: SpellAutoParameterSource
	): CommandSelectOptionGroup[] {
		return areaTransformSourceOptions(value, currentSource);
	}

	defaultSourceKey(sourceKind: AutoValueSourceKind) {
		return defaultAreaSourceKey(sourceKind, this.sourceOptionsContext());
	}

	sourceKeyLabel(source: SpellAutoParameterSource) {
		return areaSourceKeyLabel(source);
	}

	sourceSummary(source: SpellAutoParameterSource) {
		return areaSourceSummary(source);
	}

	isSourceCollapsed(scope: string, source: SpellAutoParameterSource) {
		return this.pageStore.isAutoSourceCollapsed(collapseKey(scope, source));
	}

	toggleSourceCollapsed(scope: string, source: SpellAutoParameterSource) {
		this.pageStore.toggleAutoSourceCollapsed(collapseKey(scope, source));
	}

	numericPreview(dimensionKey: string): NumericParameterPreview {
		return areaNumericPreview(
			this.parameterValue(dimensionKey),
			areaSourceNames(this.sourceOptionsContext()),
			this.progressionPreviewSteps(),
			this.maxActiveSkillLevel()
		);
	}

	private sourceOptionsContext(): SpellAreaSourceOptionsContext {
		return {
			mechanicBlocks: this.pageStore.draft()?.mechanicBlocks ?? [],
			mechanics: this.pageStore.spellMechanics(),
			systemValues: this.pageStore.systemValues()
		};
	}

	private patchDraft(
		patch: Partial<NonNullable<ReturnType<typeof this.pageStore.draft>>> | null
	) {
		if (patch) {
			this.pageStore.patchDraft(patch);
		}
	}

	private maxActiveSkillLevel() {
		return Math.max(
			0,
			...this.pageStore
				.skillLevels()
				.filter(level => level.isActive)
				.map(level => level.level)
		);
	}
}

function collapseKey(scope: string, source: SpellAutoParameterSource) {
	return `${scope}:${source.id}`;
}

function isSpellParameterValue(value: unknown): value is SpellParameterValue {
	return typeof value === 'string' || isRecord(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
