import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import {
	CreatureArmorPresetOption,
	CreatureSizeOption
} from '../../../domain/creatures.models';
import { CreatureTierDraft } from '../../pages/admin-creatures-page/admin-creature-editor.models';

@Component({
	selector: 'app-creature-tier-main-editor',
	standalone: true,
	imports: [CommonModule, FormsModule, InputNumber, InputText, Select],
	templateUrl: './creature-tier-main-editor.component.html',
	styleUrl:
		'../../pages/admin-creatures-page/admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureTierMainEditorComponent {
	readonly tier = input.required<CreatureTierDraft>();
	readonly creatureSizes = input.required<CreatureSizeOption[]>();
	readonly armorPresets = input.required<CreatureArmorPresetOption[]>();
	readonly armorSummary = input.required<string>();

	readonly nameChange = output<string>();
	readonly hpChange = output<number | null>();
	readonly sizeChange = output<string | null>();
	readonly armorChange = output<string | null>();
}
