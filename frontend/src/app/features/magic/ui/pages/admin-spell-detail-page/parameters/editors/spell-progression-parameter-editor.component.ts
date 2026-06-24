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
import { ProgressionPresetRoundingMode } from '../../../../../../progression-presets/domain/progression-presets.models';
import {
	ConfigField,
	ProgressionSourceKind,
	SpellProgressionParameterValue
} from '../../utils/spell-numeric-parameter.utils';

interface CommandSelectOption<TValue = string> {
	label: string;
	value: TValue;
}

@Component({
	selector: 'app-spell-progression-parameter-editor',
	standalone: true,
	imports: [Button, FormsModule, InputNumber, Select],
	templateUrl: './spell-progression-parameter-editor.component.html',
	styleUrl: './spell-progression-parameter-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellProgressionParameterEditorComponent {
	readonly value = input.required<SpellProgressionParameterValue>();
	readonly sourceKindOptions =
		input.required<CommandSelectOption<ProgressionSourceKind>[]>();
	readonly showSourceKey = input(false);
	readonly sourceKeyLabel = input('');
	readonly sourceKeyOptions = input<CommandSelectOption[]>([]);
	readonly presetOptions = input.required<CommandSelectOption[]>();
	readonly configFields = input.required<ConfigField[]>();
	readonly roundingModeOptions =
		input.required<CommandSelectOption<ProgressionPresetRoundingMode>[]>();

	readonly sourceKindChange = output<ProgressionSourceKind>();
	readonly sourceKeyChange = output<string>();
	readonly presetChange = output<string | null>();
	readonly configChange = output<{ key: string; value: number | null }>();
	readonly roundingModeChange = output<ProgressionPresetRoundingMode>();
	readonly roundingHelpClick = output<MouseEvent>();
	readonly openFormulaEditor = output<void>();
}
