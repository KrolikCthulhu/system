import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Slider } from 'primeng/slider';
import {
	AutoValueSourceKind,
	SpellAutoParameterSource,
	SpellAutoParameterValue
} from '../../utils/spell-numeric-parameter.utils';
import {
	AutoHelpKey,
	CommandSelectOption,
	CommandSelectOptionGroup
} from '../../models/spell-detail-page.types';

@Component({
	selector: 'app-spell-auto-parameter-source-list',
	standalone: true,
	imports: [Button, FormsModule, InputNumber, Select, Slider],
	templateUrl: './spell-auto-parameter-source-list.component.html',
	styleUrl: './spell-auto-parameter-source-list.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellAutoParameterSourceListComponent {
	protected readonly inputNumberInputStyle = { width: '100%' };

	readonly value = input.required<SpellAutoParameterValue>();
	readonly scope = input.required<string>();
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
	readonly canEditTarget = input(false);
	readonly canDelete = input(false);
	readonly isSourceCollapsed =
		input.required<
			(scope: string, source: SpellAutoParameterSource) => boolean
		>();

	readonly sourceAdd = output<void>();
	readonly sourcePatch = output<{
		sourceId: string;
		patch: Partial<SpellAutoParameterSource>;
	}>();
	readonly sourceDelete = output<string>();
	readonly sourceCollapseToggle = output<SpellAutoParameterSource>();
	readonly helpClick = output<{ event: MouseEvent; key: AutoHelpKey }>();

	protected patchSource(
		source: SpellAutoParameterSource,
		patch: Partial<SpellAutoParameterSource>
	) {
		this.sourcePatch.emit({ sourceId: source.id, patch });
	}

	protected updateSourceKind(
		source: SpellAutoParameterSource,
		sourceKind: AutoValueSourceKind
	) {
		this.patchSource(source, {
			sourceKind,
			sourceKey: this.defaultSourceKey()(sourceKind)
		});
	}

	protected showHelp(event: MouseEvent, key: AutoHelpKey) {
		this.helpClick.emit({ event, key });
	}
}
