export type DefenseMode = 'dodge' | 'parry' | 'none';

export type ParrySkillGroup = 'unarmed' | 'melee_weapon' | 'shield';

export interface CombatActionReference {
	name: string;
	slug: string;
}

export interface CombatActionRollConfig {
	type: 'none' | 'attack_profile' | 'check';
	characteristic: CombatActionReference | null;
	skill: CombatActionReference | null;
}

export interface CombatActionDefenseConfig {
	type: 'none' | 'target_physical_defense';
	canDodge: boolean;
	canParry: boolean;
	parrySkillGroups: ParrySkillGroup[];
}

export interface CombatCheckAction {
	slug: string;
	name: string;
	roll?: CombatActionRollConfig | null;
	defense?: CombatActionDefenseConfig | null;
	source?: {
		type: string;
		name: string;
		slug: string;
		profileName: string;
	} | null;
}

export interface CombatDefenseOption {
	mode: DefenseMode;
	label: string;
	skillSlug: string | null;
	skillName: string | null;
}

export interface CombatResolvedRoll {
	skillSlug: string | null;
	skillName: string;
	characteristicSlug: string | null;
	characteristicName: string;
	diceCount: number;
	dice: number[];
	successes: number;
	sixes: number;
	ones: number;
	ignoredOnes: number;
	consequenceCount: number;
	skillLevel: number;
}
