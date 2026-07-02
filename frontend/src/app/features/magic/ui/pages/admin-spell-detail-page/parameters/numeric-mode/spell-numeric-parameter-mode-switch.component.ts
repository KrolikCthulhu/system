import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButton } from 'primeng/selectbutton';
import { SpellParameterValueMode } from '../../models/spell-detail-page.types';

interface SpellParameterValueModeOption {
	label: string;
	value: SpellParameterValueMode;
}

@Component({
	selector: 'app-spell-numeric-parameter-mode-switch',
	standalone: true,
	imports: [FormsModule, SelectButton],
	templateUrl: './spell-numeric-parameter-mode-switch.component.html',
	styleUrl: './spell-numeric-parameter-mode-switch.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellNumericParameterModeSwitchComponent {
	readonly mode = input.required<SpellParameterValueMode>();
	readonly options = input.required<SpellParameterValueModeOption[]>();

	readonly modeChange = output<SpellParameterValueMode>();
}
