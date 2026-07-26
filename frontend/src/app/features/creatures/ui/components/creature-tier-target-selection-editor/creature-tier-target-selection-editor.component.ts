import { CommonModule } from '@angular/common';
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
import { ToggleSwitch } from 'primeng/toggleswitch';
import {
	CreatureTargetSelection,
	CreatureTargetSelectionScoringRule
} from '../../../domain/creatures.models';
import { SelectOption } from '../../pages/admin-creatures-page/admin-creature-editor.models';

@Component({
	selector: 'app-creature-tier-target-selection-editor',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Button,
		InputNumber,
		Select,
		ToggleSwitch
	],
	templateUrl: './creature-tier-target-selection-editor.component.html',
	styleUrl:
		'../../pages/admin-creatures-page/admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureTierTargetSelectionEditorComponent {
	readonly targetSelection = input.required<CreatureTargetSelection>();
	readonly ruleOptions = input.required<SelectOption<string>[]>();

	readonly addRule = output<void>();
	readonly ruleKeyChange = output<{ index: number; key: string | null }>();
	readonly ruleChange = output<{
		index: number;
		patch: Partial<CreatureTargetSelectionScoringRule>;
	}>();
	readonly removeRule = output<number>();
}
