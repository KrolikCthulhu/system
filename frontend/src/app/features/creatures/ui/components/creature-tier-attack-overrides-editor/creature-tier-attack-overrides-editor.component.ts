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
import { CreatureTierAttackOverride } from '../../../domain/creatures.models';
import {
	CreatureTierAttackProfileOption,
	CreatureTierDraft
} from '../../pages/admin-creatures-page/admin-creature-editor.models';

@Component({
	selector: 'app-creature-tier-attack-overrides-editor',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Button,
		InputNumber,
		Select,
		ToggleSwitch
	],
	templateUrl: './creature-tier-attack-overrides-editor.component.html',
	styleUrl:
		'../../pages/admin-creatures-page/admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureTierAttackOverridesEditorComponent {
	readonly tier = input.required<CreatureTierDraft>();
	readonly profileOptions = input.required<CreatureTierAttackProfileOption[]>();

	readonly addOverride = output<void>();
	readonly overrideProfileChange = output<{ index: number; key: string }>();
	readonly overrideChange = output<{
		index: number;
		patch: Partial<CreatureTierAttackOverride>;
	}>();
	readonly removeOverride = output<number>();

	protected profileKey(attackOverride: CreatureTierAttackOverride): string {
		return `${attackOverride.naturalAttack.slug}:${attackOverride.profileKind}`;
	}
}
