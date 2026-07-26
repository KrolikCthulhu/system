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
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { CreatureAnatomyZone } from '../../../domain/creatures.models';
import {
	CreatureAnatomyZoneOverrideField,
	CreatureAnatomyZonePatch,
	CreatureAnatomyZoneViewGroup,
	SelectOption
} from '../../pages/admin-creatures-page/admin-creature-editor.models';

@Component({
	selector: 'app-creature-anatomy-editor',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		InputNumber,
		InputText,
		Select,
		Tag,
		ToggleSwitch
	],
	templateUrl: './creature-anatomy-editor.component.html',
	styleUrl:
		'../../pages/admin-creatures-page/admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureAnatomyEditorComponent {
	readonly zoneCount = input.required<number>();
	readonly isExpanded = input.required<boolean>();
	readonly groups = input.required<CreatureAnatomyZoneViewGroup[]>();
	readonly zoneKindOptions =
		input.required<SelectOption<CreatureAnatomyZone['kind']>[]>();
	readonly parentOptionsByZoneId =
		input.required<Map<string, SelectOption<string>[]>>();

	readonly expandedToggle = output<void>();
	readonly zoneChange = output<{
		index: number;
		patch: CreatureAnatomyZonePatch;
		field: CreatureAnatomyZoneOverrideField;
	}>();

	protected parentOptions(zoneId: string): SelectOption<string>[] {
		return this.parentOptionsByZoneId().get(zoneId) ?? [];
	}
}
