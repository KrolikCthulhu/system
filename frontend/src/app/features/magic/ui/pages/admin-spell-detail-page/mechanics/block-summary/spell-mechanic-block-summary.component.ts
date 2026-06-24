import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { SpellMechanicApplicationConfig } from '../../../../../domain/spell.models';

interface SpellMechanicOption {
	label: string;
	value: string;
}

@Component({
	selector: 'app-spell-mechanic-block-summary',
	standalone: true,
	imports: [Button, FormsModule, Select, ToggleSwitch],
	templateUrl: './spell-mechanic-block-summary.component.html',
	styleUrl: './spell-mechanic-block-summary.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellMechanicBlockSummaryComponent {
	readonly mechanicId = input.required<string>();
	readonly isActive = input.required<boolean>();
	readonly mechanicOptions = input.required<SpellMechanicOption[]>();
	readonly previewText = input.required<string>();
	readonly applicationText = input.required<string>();
	readonly applicationConfig = input.required<SpellMechanicApplicationConfig>();

	readonly mechanicChange = output<string>();
	readonly activeChange = output<boolean>();
	readonly deleteBlock = output<void>();
	readonly applicationChange =
		output<Partial<SpellMechanicApplicationConfig>>();
}
