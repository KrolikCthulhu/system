import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import {
	CreatureCharacteristicOption,
	CreatureCombatIntentOption,
	CreatureConditionOption,
	CreatureDamageTypeOption,
	CreatureNaturalAttackOption,
	CreatureSkillOption,
	CreatureTierAction
} from '../../../domain/creatures.models';
import { CreatureTierActionsEditorComponent } from '../creature-tier-actions-editor/creature-tier-actions-editor.component';

@Component({
	selector: 'app-creature-base-actions-editor',
	standalone: true,
	imports: [CommonModule, CreatureTierActionsEditorComponent],
	templateUrl: './creature-base-actions-editor.component.html',
	styleUrl:
		'../../pages/admin-creatures-page/admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureBaseActionsEditorComponent {
	readonly actions = input.required<CreatureTierAction[]>();
	readonly actorName = input.required<string>();
	readonly naturalAttacks = input.required<CreatureNaturalAttackOption[]>();
	readonly combatIntents = input.required<CreatureCombatIntentOption[]>();
	readonly damageTypes = input.required<CreatureDamageTypeOption[]>();
	readonly conditions = input.required<CreatureConditionOption[]>();
	readonly skills = input.required<CreatureSkillOption[]>();
	readonly characteristics = input.required<CreatureCharacteristicOption[]>();

	readonly actionsChange = output<CreatureTierAction[]>();
}
