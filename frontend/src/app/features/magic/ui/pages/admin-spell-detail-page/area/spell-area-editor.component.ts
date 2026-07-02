import {
	ChangeDetectionStrategy,
	Component,
	inject,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { SelectButton } from 'primeng/selectbutton';
import { Tag } from 'primeng/tag';
import {
	AUTO_VALUE_CHARACTER_OPTIONS,
	AUTO_VALUE_SCALE_OPTIONS,
	AUTO_VALUE_SOURCE_CURVE_OPTIONS,
	AUTO_VALUE_SOURCE_KIND_OPTIONS,
	AUTO_VALUE_SOURCE_MODE_OPTIONS,
	AUTO_VALUE_SOURCE_TARGET_OPTIONS,
	AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS,
	ROUNDING_MODE_OPTIONS,
	SpellAutoParameterSource
} from '../utils/spell-numeric-parameter.utils';
import { AutoHelpKey } from '../models/spell-detail-page.types';
import { SpellAutoParameterEditorComponent } from '../parameters/auto/spell-auto-parameter-editor.component';
import { SpellAreaEditorFacade } from './spell-area-editor.facade';

@Component({
	selector: 'app-spell-area-editor',
	standalone: true,
	imports: [
		FormsModule,
		InputText,
		SelectButton,
		Tag,
		SpellAutoParameterEditorComponent
	],
	templateUrl: './spell-area-editor.component.html',
	styleUrl: './spell-area-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [SpellAreaEditorFacade]
})
export class SpellAreaEditorComponent {
	protected readonly facade = inject(SpellAreaEditorFacade);
	protected readonly characterOptions = AUTO_VALUE_CHARACTER_OPTIONS;
	protected readonly scaleOptions = AUTO_VALUE_SCALE_OPTIONS;
	protected readonly rangeModeOptions = [
		{ label: 'Без диапазона', value: 'none' as const },
		{ label: 'Масштабировать', value: 'scale' as const }
	];
	protected readonly sourceModeOptions = AUTO_VALUE_SOURCE_MODE_OPTIONS;
	protected readonly sourceKindOptions = AUTO_VALUE_SOURCE_KIND_OPTIONS;
	protected readonly sourceTargetOptions = AUTO_VALUE_SOURCE_TARGET_OPTIONS;
	protected readonly sourceCurveOptions = AUTO_VALUE_SOURCE_CURVE_OPTIONS;
	protected readonly sourceTransformOptions =
		AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS;
	protected readonly roundingModeOptions = ROUNDING_MODE_OPTIONS;
	protected readonly sourceKeyOptions = (source: SpellAutoParameterSource) =>
		this.facade.sourceKeyOptionGroups(source);
	protected readonly transformSourceOptions = (
		value: Parameters<SpellAreaEditorFacade['transformSourceOptions']>[0],
		source: SpellAutoParameterSource
	) => this.facade.transformSourceOptions(value, source);
	protected readonly defaultSourceKey = (
		sourceKind: Parameters<SpellAreaEditorFacade['defaultSourceKey']>[0]
	) => this.facade.defaultSourceKey(sourceKind);
	protected readonly sourceKeyLabel = (source: SpellAutoParameterSource) =>
		this.facade.sourceKeyLabel(source);
	protected readonly sourceSummary = (source: SpellAutoParameterSource) =>
		this.facade.sourceSummary(source);
	protected readonly isSourceCollapsed = (
		scope: string,
		source: SpellAutoParameterSource
	) => this.facade.isSourceCollapsed(scope, source);

	readonly helpClick = output<{ event: MouseEvent; key: AutoHelpKey }>();

	protected valueMode(dimensionKey: string) {
		return this.facade.parameterValueMode(dimensionKey);
	}

	protected staticValue(dimensionKey: string) {
		return this.facade.staticParameterValue(dimensionKey);
	}

	protected autoValue(dimensionKey: string) {
		return this.facade.autoParameterValue(dimensionKey);
	}

	protected preview(dimensionKey: string) {
		return this.facade.numericPreview(dimensionKey);
	}

	protected scope(dimensionKey: string) {
		return `area:${dimensionKey}`;
	}

	protected toggleSourceCollapsed(
		scope: string,
		source: SpellAutoParameterSource
	) {
		this.facade.toggleSourceCollapsed(scope, source);
	}
}
