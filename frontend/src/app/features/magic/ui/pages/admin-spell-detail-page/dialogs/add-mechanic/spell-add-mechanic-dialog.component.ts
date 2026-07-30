import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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

export interface SpellAddMechanicDialogViewModel {
	visible: boolean;
	mechanicOptions: CommandSelectOption[];
	selectedMechanicId: string | null;
	selectedMechanic: SpellMechanic | null;
	requiredParameters(mechanic: SpellMechanic): SpellMechanicParameter[];
	parameterDefaultLabel(parameter: SpellMechanicParameter): string;
	parameterReady(parameter: SpellMechanicParameter): boolean;
}

export interface SpellAddMechanicDialogActions {
	setVisible(visible: boolean): void;
	updateMechanic(mechanicId: string | null): void;
	confirm(): void;
}

@Component({
	selector: 'app-spell-add-mechanic-dialog',
	standalone: true,
	imports: [Button, Dialog, FormsModule, Select, Tag],
	templateUrl: './spell-add-mechanic-dialog.component.html',
	styleUrl: './spell-add-mechanic-dialog.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellAddMechanicDialogComponent {
	readonly viewModel = input.required<SpellAddMechanicDialogViewModel>();
	readonly actions = input.required<SpellAddMechanicDialogActions>();
}
