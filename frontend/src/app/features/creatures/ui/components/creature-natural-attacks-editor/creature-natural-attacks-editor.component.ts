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
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import {
	CreatureAttackAvailabilityRule,
	CreatureCharacteristicOption,
	CreatureDamageTypeOption,
	CreatureNaturalAttackOption,
	CreatureParrySkillGroup,
	CreatureSkillOptionGroup
} from '../../../domain/creatures.models';
import {
	CreatureCombatIntentGroup,
	CreatureNaturalAttackDraft,
	CreatureNaturalAttackProfileDraft,
	CreatureNaturalAttackProfilePatch
} from '../../pages/admin-creatures-page/admin-creature-editor.models';

interface SelectOption<T> {
	label: string;
	value: T;
}

const DEFENSE_TYPE_OPTIONS: SelectOption<
	CreatureNaturalAttackProfileDraft['defaultDefense']['type']
>[] = [
	{ label: 'Без защиты', value: 'none' },
	{ label: 'Физическая защита цели', value: 'target_physical_defense' }
];

const PARRY_SKILL_GROUP_OPTIONS: SelectOption<CreatureParrySkillGroup>[] = [
	{ label: 'Рукопашный бой', value: 'unarmed' },
	{ label: 'Оружие ближнего боя', value: 'melee_weapon' },
	{ label: 'Щит', value: 'shield' }
];

@Component({
	selector: 'app-creature-natural-attacks-editor',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Checkbox,
		InputNumber,
		MultiSelect,
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

	protected readonly defenseTypeOptions = DEFENSE_TYPE_OPTIONS;
	protected readonly parrySkillGroupOptions = PARRY_SKILL_GROUP_OPTIONS;

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

	protected updateDefaultDefense(
		naturalAttackId: string,
		profileIndex: number,
		profile: CreatureNaturalAttackProfileDraft,
		patch: Partial<CreatureNaturalAttackProfileDraft['defaultDefense']>
	) {
		const defaultDefense = { ...profile.defaultDefense, ...patch };

		if (defaultDefense.type === 'none' || !defaultDefense.canParry) {
			defaultDefense.parrySkillGroups = [];
		}

		this.profileChange.emit({
			naturalAttackId,
			profileIndex,
			patch: { defaultDefense }
		});
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
