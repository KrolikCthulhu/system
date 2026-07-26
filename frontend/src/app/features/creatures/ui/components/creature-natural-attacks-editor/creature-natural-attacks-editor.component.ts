import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Checkbox } from 'primeng/checkbox';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import {
	CreatureAttackAvailabilityRule,
	CreatureCharacteristicOption,
	CreatureDamageTypeOption,
	CreatureNaturalAttackOption,
	CreatureSkillOptionGroup
} from '../../../domain/creatures.models';
import {
	CreatureCombatIntentGroup,
	CreatureNaturalAttackDraft,
	CreatureNaturalAttackProfileDraft,
	CreatureNaturalAttackProfilePatch
} from '../../pages/admin-creatures-page/admin-creature-editor.models';

@Component({
	selector: 'app-creature-natural-attacks-editor',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Checkbox,
		InputNumber,
		Select,
		Tag,
		ToggleSwitch
	],
	templateUrl: './creature-natural-attacks-editor.component.html',
	styleUrl:
		'../../pages/admin-creatures-page/admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureNaturalAttacksEditorComponent {
	readonly naturalAttacks = input.required<CreatureNaturalAttackOption[]>();
	readonly attackDrafts = input.required<CreatureNaturalAttackDraft[]>();
	readonly skillOptionGroups = input.required<CreatureSkillOptionGroup[]>();
	readonly characteristics = input.required<CreatureCharacteristicOption[]>();
	readonly damageTypes = input.required<CreatureDamageTypeOption[]>();
	readonly combatIntentGroups = input.required<CreatureCombatIntentGroup[]>();

	readonly naturalAttackChange = output<{
		naturalAttackId: string;
		isSelected: boolean;
	}>();
	readonly profileChange = output<{
		naturalAttackId: string;
		profileIndex: number;
		patch: CreatureNaturalAttackProfilePatch;
	}>();
	readonly damageTypeChange = output<{
		naturalAttackId: string;
		profileIndex: number;
		damageTypeId: string;
		isSelected: boolean;
	}>();
	readonly intentChange = output<{
		naturalAttackId: string;
		profileIndex: number;
		combatIntentId: string;
		isSelected: boolean;
	}>();

	protected attackDraft(
		naturalAttackId: string
	): CreatureNaturalAttackDraft | null {
		return (
			this.attackDrafts().find(
				attackDraft => attackDraft.naturalAttackId === naturalAttackId
			) ?? null
		);
	}

	protected profileKindLabel(kind: CreatureNaturalAttackProfileDraft['kind']) {
		return kind === 'melee' ? 'Ближний бой' : 'Дальний бой';
	}

	protected hasIntent(
		profile: CreatureNaturalAttackProfileDraft,
		combatIntentId: string
	): boolean {
		return profile.intents.some(
			intent => intent.combatIntentId === combatIntentId
		);
	}

	protected attackAvailabilityText(
		rules: CreatureAttackAvailabilityRule[]
	): string {
		return [...rules]
			.sort((first, second) => first.sortOrder - second.sortOrder)
			.map(rule => rule.unavailableText || rule.label)
			.join('; ');
	}
}
