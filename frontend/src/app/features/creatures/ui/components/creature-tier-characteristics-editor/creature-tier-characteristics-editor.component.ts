import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumber } from 'primeng/inputnumber';
import { CreatureCharacteristicOption } from '../../../domain/creatures.models';
import { CreatureTierDraft } from '../../pages/admin-creatures-page/admin-creature-editor.models';

@Component({
	selector: 'app-creature-tier-characteristics-editor',
	standalone: true,
	imports: [CommonModule, FormsModule, InputNumber],
	templateUrl: './creature-tier-characteristics-editor.component.html',
	styleUrl:
		'../../pages/admin-creatures-page/admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureTierCharacteristicsEditorComponent {
	readonly tier = input.required<CreatureTierDraft>();
	readonly characteristicsById =
		input.required<Map<string, CreatureCharacteristicOption>>();

	readonly characteristicChange = output<{
		characteristicId: string;
		value: number | null;
	}>();
}
