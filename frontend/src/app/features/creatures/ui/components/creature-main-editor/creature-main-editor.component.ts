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
import { ToggleSwitch } from 'primeng/toggleswitch';
import {
	CreatureAnatomySchemeOption,
	CreatureTypeOption
} from '../../../domain/creatures.models';
import { CreatureDraft } from '../../pages/admin-creatures-page/admin-creature-editor.models';

@Component({
	selector: 'app-creature-main-editor',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		InputNumber,
		InputText,
		Select,
		ToggleSwitch
	],
	templateUrl: './creature-main-editor.component.html',
	styleUrl:
		'../../pages/admin-creatures-page/admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureMainEditorComponent {
	readonly draft = input.required<CreatureDraft>();
	readonly creatureTypes = input.required<CreatureTypeOption[]>();
	readonly anatomySchemes = input.required<CreatureAnatomySchemeOption[]>();

	readonly nameChange = output<string>();
	readonly typeChange = output<string>();
	readonly anatomySchemeChange = output<string | null>();
	readonly sortOrderChange = output<number | null>();
	readonly activeChange = output<boolean>();
}
