import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import {
	SpellMechanic,
	SpellMechanicParameter
} from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { CommandSelectOption } from '../../models/spell-detail-page.types';

@Component({
	selector: 'app-spell-add-mechanic-dialog',
	standalone: true,
	imports: [Button, Dialog, FormsModule, Select, Tag],
	templateUrl: './spell-add-mechanic-dialog.component.html',
	styleUrl: './spell-add-mechanic-dialog.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellAddMechanicDialogComponent {
	readonly visible = input.required<boolean>();
	readonly mechanicOptions = input.required<CommandSelectOption[]>();
	readonly selectedMechanicId = input<string | null>(null);
	readonly selectedMechanic = input<SpellMechanic | null>(null);
	readonly requiredParameters =
		input.required<(mechanic: SpellMechanic) => SpellMechanicParameter[]>();
	readonly parameterDefaultLabel =
		input.required<(parameter: SpellMechanicParameter) => string>();
	readonly parameterReady =
		input.required<(parameter: SpellMechanicParameter) => boolean>();

	readonly visibleChange = output<boolean>();
	readonly mechanicChange = output<string | null>();
	readonly confirm = output<void>();
}
