import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Slider } from 'primeng/slider';
import { ProgressionPresetRoundingMode } from '../../../../../../progression-presets/domain/progression-presets.models';
import {
	AutoValueSourceKind,
	AutoValueSourceMode,
	SpellAutoParameterSource,
	SpellAutoParameterValue
} from '../../utils/spell-numeric-parameter.utils';
import {
	AutoHelpKey,
	CommandSelectOption,
	CommandSelectOptionGroup
} from '../../models/spell-detail-page.types';
import { SpellAutoParameterSourceListComponent } from './spell-auto-parameter-source-list.component';

@Component({
	selector: 'app-spell-auto-parameter-editor',
	standalone: true,
	imports: [
		FormsModule,
		InputNumber,
		Select,
		Slider,
		SpellAutoParameterSourceListComponent
	],
	templateUrl: './spell-auto-parameter-editor.component.html',
	styleUrl: './spell-auto-parameter-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellAutoParameterEditorComponent {
	protected readonly inputNumberInputStyle = { width: '100%' };

	readonly value = input.required<SpellAutoParameterValue>();
	readonly scope = input.required<string>();
	readonly characterOptions =
		input.required<
			CommandSelectOption<SpellAutoParameterValue['character']>[]
		>();
	readonly scaleOptions =
		input.required<CommandSelectOption<SpellAutoParameterValue['scale']>[]>();
	readonly rangeModeOptions =
		input.required<
			CommandSelectOption<SpellAutoParameterValue['rangeMode']>[]
		>();
	readonly sourceModeOptions =
		input.required<CommandSelectOption<AutoValueSourceMode>[]>();
	readonly sourceKindOptions =
		input.required<
			CommandSelectOption<SpellAutoParameterSource['sourceKind']>[]
		>();
	readonly sourceTargetOptions =
		input.required<CommandSelectOption<SpellAutoParameterSource['target']>[]>();
	readonly sourceCurveOptions =
		input.required<CommandSelectOption<SpellAutoParameterSource['curve']>[]>();
	readonly sourceTransformOptions =
		input.required<
			CommandSelectOption<SpellAutoParameterSource['transform']>[]
		>();
	readonly roundingModeOptions =
		input.required<CommandSelectOption<ProgressionPresetRoundingMode>[]>();
	readonly sourceKeyOptions =
		input.required<
			(source: SpellAutoParameterSource) => CommandSelectOptionGroup[]
		>();
	readonly transformSourceOptions =
		input.required<
			(
				value: SpellAutoParameterValue,
				source: SpellAutoParameterSource
			) => CommandSelectOptionGroup[]
		>();
	readonly defaultSourceKey =
		input.required<(sourceKind: AutoValueSourceKind) => string>();
	readonly sourceKeyLabel =
		input.required<(source: SpellAutoParameterSource) => string>();
	readonly sourceSummary =
		input.required<(source: SpellAutoParameterSource) => string>();
	readonly isSourceCollapsed =
		input.required<
			(scope: string, source: SpellAutoParameterSource) => boolean
		>();
	readonly presetOptions = input<CommandSelectOptionGroup[]>([]);
	readonly presetPanelStyle = input<Record<string, string> | null>(null);

	readonly parameterPatch = output<Partial<SpellAutoParameterValue>>();
	readonly sourceModeChange = output<AutoValueSourceMode>();
	readonly sourceAdd = output<void>();
	readonly sourcePatch = output<{
		sourceId: string;
		patch: Partial<SpellAutoParameterSource>;
	}>();
	readonly sourceDelete = output<string>();
	readonly sourceCollapseToggle = output<SpellAutoParameterSource>();
	readonly presetApply = output<string | null>();
	readonly helpClick = output<{ event: MouseEvent; key: AutoHelpKey }>();

	protected finalScalePercent() {
		return Math.round(this.value().finalScale * 100);
	}

	protected finalScaleFromPercent(value: number | null | undefined) {
		return Math.max(0, Math.min(300, value ?? 100)) / 100;
	}

	protected patch(patch: Partial<SpellAutoParameterValue>) {
		this.parameterPatch.emit(patch);
	}

	protected updateFinalScale(value: number | null | undefined) {
		this.patch({ finalScale: this.finalScaleFromPercent(value) });
	}

	protected showHelp(event: MouseEvent, key: AutoHelpKey) {
		this.helpClick.emit({ event, key });
	}
}
