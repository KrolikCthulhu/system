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
import { CreatureSkillOptionGroup } from '../../../domain/creatures.models';
import { CreatureTierDraft } from '../../pages/admin-creatures-page/admin-creature-editor.models';

@Component({
	selector: 'app-creature-tier-skills-editor',
	standalone: true,
	imports: [CommonModule, FormsModule, Button, InputNumber, Select],
	templateUrl: './creature-tier-skills-editor.component.html',
	styleUrl:
		'../../pages/admin-creatures-page/admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureTierSkillsEditorComponent {
	readonly tier = input.required<CreatureTierDraft>();
	readonly skillOptionsByKey =
		input.required<Map<string, CreatureSkillOptionGroup[]>>();

	readonly addSkill = output<void>();
	readonly skillChange = output<{ index: number; skillId: string }>();
	readonly skillLevelChange = output<{ index: number; level: number | null }>();
	readonly removeSkill = output<number>();

	protected skillOptions(currentSkillId: string): CreatureSkillOptionGroup[] {
		return (
			this.skillOptionsByKey().get(`${this.tier().tier}:${currentSkillId}`) ??
			[]
		);
	}
}
