import { computed, inject, Injectable } from '@angular/core';
import {
	AutoValueSourceKind,
	AutoValueSourceMode,
	AUTO_VALUE_CHARACTER_OPTIONS,
	AUTO_VALUE_SCALE_OPTIONS,
	AUTO_VALUE_SOURCE_CURVE_OPTIONS,
	AUTO_VALUE_SOURCE_KIND_OPTIONS,
	AUTO_VALUE_SOURCE_MODE_OPTIONS,
	AUTO_VALUE_SOURCE_TARGET_OPTIONS,
	AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS,
	NumericParameterPreview,
	ROUNDING_MODE_OPTIONS,
	SpellAutoParameterSource,
	SpellAutoParameterValue
} from '../utils/spell-numeric-parameter.utils';
import {
	CommandSelectOption,
	CommandSelectOptionGroup,
	SpellAreaDimension,
	SpellParameterValueMode
} from '../models/spell-detail-page.types';
import { SpellAreaEditorFacade } from './spell-area-editor.facade';

export interface SpellAreaAutoDimensionVm {
	value: SpellAutoParameterValue;
	scope: string;
	characterOptions: typeof AUTO_VALUE_CHARACTER_OPTIONS;
	scaleOptions: typeof AUTO_VALUE_SCALE_OPTIONS;
	rangeModeOptions: Array<
		CommandSelectOption<SpellAutoParameterValue['rangeMode']>
	>;
	sourceModeOptions: typeof AUTO_VALUE_SOURCE_MODE_OPTIONS;
	sourceKindOptions: typeof AUTO_VALUE_SOURCE_KIND_OPTIONS;
	sourceTargetOptions: typeof AUTO_VALUE_SOURCE_TARGET_OPTIONS;
	sourceCurveOptions: typeof AUTO_VALUE_SOURCE_CURVE_OPTIONS;
	sourceTransformOptions: typeof AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS;
	roundingModeOptions: typeof ROUNDING_MODE_OPTIONS;
	sourceKeyOptions(
		source: SpellAutoParameterSource
	): CommandSelectOptionGroup[];
	transformSourceOptions(
		value: SpellAutoParameterValue,
		source: SpellAutoParameterSource
	): CommandSelectOptionGroup[];
	defaultSourceKey(sourceKind: AutoValueSourceKind): string;
	sourceKeyLabel(source: SpellAutoParameterSource): string;
	sourceSummary(source: SpellAutoParameterSource): string;
	isSourceCollapsed(scope: string, source: SpellAutoParameterSource): boolean;
}

export interface SpellAreaDimensionActionsVm {
	changeMode(mode: SpellParameterValueMode): void;
	changeStaticValue(value: string): void;
	patchAuto(patch: Partial<SpellAutoParameterValue>): void;
	changeAutoSourceMode(mode: AutoValueSourceMode): void;
	addAutoSource(): void;
	patchAutoSource(event: {
		sourceId: string;
		patch: Partial<SpellAutoParameterSource>;
	}): void;
	deleteAutoSource(sourceId: string): void;
	toggleSourceCollapsed(source: SpellAutoParameterSource): void;
}

export interface SpellAreaDimensionVm {
	dimension: SpellAreaDimension;
	valueMode: SpellParameterValueMode;
	modeOptions: Array<CommandSelectOption<SpellParameterValueMode>>;
	staticValue: string;
	auto: SpellAreaAutoDimensionVm | null;
	preview: NumericParameterPreview;
	actions: SpellAreaDimensionActionsVm;
}

@Injectable()
export class SpellAreaEditorViewModel {
	private readonly facade = inject(SpellAreaEditorFacade);

	readonly areaShape = this.facade.areaShape;
	readonly dimensionsVm = computed<SpellAreaDimensionVm[]>(() =>
		this.facade.dimensions().map(dimension => {
			const valueMode = this.facade.parameterValueMode(dimension.key);
			const autoValue = this.facade.autoParameterValue(dimension.key);

			return {
				dimension,
				valueMode,
				modeOptions: this.facade.parameterValueModeOptions,
				staticValue: this.facade.staticParameterValue(dimension.key),
				auto: autoValue
					? {
							value: autoValue,
							scope: `area:${dimension.key}`,
							characterOptions: AUTO_VALUE_CHARACTER_OPTIONS,
							scaleOptions: AUTO_VALUE_SCALE_OPTIONS,
							rangeModeOptions: [
								{ label: 'Без диапазона', value: 'none' as const },
								{ label: 'Масштабировать', value: 'scale' as const }
							],
							sourceModeOptions: AUTO_VALUE_SOURCE_MODE_OPTIONS,
							sourceKindOptions: AUTO_VALUE_SOURCE_KIND_OPTIONS,
							sourceTargetOptions: AUTO_VALUE_SOURCE_TARGET_OPTIONS,
							sourceCurveOptions: AUTO_VALUE_SOURCE_CURVE_OPTIONS,
							sourceTransformOptions: AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS,
							roundingModeOptions: ROUNDING_MODE_OPTIONS,
							sourceKeyOptions: (source: SpellAutoParameterSource) =>
								this.facade.sourceKeyOptionGroups(source),
							transformSourceOptions: (
								value: Parameters<
									SpellAreaEditorFacade['transformSourceOptions']
								>[0],
								source: SpellAutoParameterSource
							) => this.facade.transformSourceOptions(value, source),
							defaultSourceKey: (
								sourceKind: Parameters<
									SpellAreaEditorFacade['defaultSourceKey']
								>[0]
							) => this.facade.defaultSourceKey(sourceKind),
							sourceKeyLabel: (source: SpellAutoParameterSource) =>
								this.facade.sourceKeyLabel(source),
							sourceSummary: (source: SpellAutoParameterSource) =>
								this.facade.sourceSummary(source),
							isSourceCollapsed: (
								scope: string,
								source: SpellAutoParameterSource
							) => this.facade.isSourceCollapsed(scope, source)
						}
					: null,
				preview: this.facade.numericPreview(dimension.key),
				actions: {
					changeMode: (
						mode: Parameters<SpellAreaEditorFacade['updateParameterMode']>[1]
					) => this.facade.updateParameterMode(dimension, mode),
					changeStaticValue: (value: string) =>
						this.facade.updateStaticParameterValue(dimension.key, value),
					patchAuto: (
						patch: Parameters<SpellAreaEditorFacade['updateAutoParameter']>[1]
					) => this.facade.updateAutoParameter(dimension.key, patch),
					changeAutoSourceMode: (
						mode: Parameters<SpellAreaEditorFacade['updateAutoSourceMode']>[1]
					) => this.facade.updateAutoSourceMode(dimension.key, mode),
					addAutoSource: () => this.facade.addAutoSource(dimension.key),
					patchAutoSource: (event: {
						sourceId: string;
						patch: Partial<SpellAutoParameterSource>;
					}) =>
						this.facade.updateAutoSource(
							dimension.key,
							event.sourceId,
							event.patch
						),
					deleteAutoSource: (sourceId: string) =>
						this.facade.deleteAutoSource(dimension.key, sourceId),
					toggleSourceCollapsed: (source: SpellAutoParameterSource) =>
						this.facade.toggleSourceCollapsed(`area:${dimension.key}`, source)
				}
			};
		})
	);
}
