import {
	CreatureAnatomyZone,
	CreatureAnatomyZoneKind,
	CreatureAttackAvailabilityRule,
	CreatureAttackFollowupAction,
	CreatureAttackProfileKind,
	CreatureCombatIntentOption,
	CreatureNaturalAttackProfile,
	CreatureTargetSelection,
	CreatureTierAbility,
	CreatureTierAction,
	CreatureTierAttackOverride
} from '../../../domain/creatures.models';

export interface CreatureTierDraft {
	tier: number;
	name: string;
	hp: number;
	sizeId: string | null;
	armorPresetId: string | null;
	attackOverrides: CreatureTierAttackOverride[];
	abilities: CreatureTierAbility[];
	actions: CreatureTierAction[];
	actionOverrides: CreatureTierAction[];
	targetSelection: CreatureTargetSelection;
	characteristics: CreatureTierCharacteristicDraft[];
	skills: CreatureTierSkillDraft[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureTierCharacteristicDraft {
	characteristicId: string;
	value: number;
}

export interface CreatureTierSkillDraft {
	skillId: string;
	level: number;
}

export interface CreatureDraft {
	id: string | null;
	name: string;
	typeId: string;
	anatomySchemeId: string | null;
	anatomyZones: CreatureAnatomyZone[];
	naturalAttacks: CreatureNaturalAttackDraft[];
	actions: CreatureTierAction[];
	tiers: CreatureTierDraft[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureNaturalAttackDraft {
	naturalAttackId: string;
	attackProfiles: CreatureNaturalAttackProfileDraft[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureNaturalAttackProfileDraft {
	kind: CreatureAttackProfileKind;
	name: string;
	skillId: string;
	characteristicId: string | null;
	baseCost: number;
	baseDamage: number;
	rangeMeters: number;
	usesAmmo: boolean;
	canBeParried: boolean;
	availabilityRules: CreatureAttackAvailabilityRule[];
	damageTypeIds: string[];
	intents: CreatureNaturalAttackProfileIntentDraft[];
	followupActions: CreatureAttackFollowupAction[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureNaturalAttackProfileIntentDraft {
	combatIntentId: string;
	nameOverride: string;
	costModifier: number;
	damageModifier: number;
	ruleText: string;
	availabilityRules: CreatureAttackAvailabilityRule[];
	sortOrder: number;
}

export interface CreatureAnatomyZoneViewItem {
	zone: CreatureAnatomyZone;
	index: number;
	children: CreatureAnatomyZoneViewItem[];
}

export interface CreatureTierAttackProfileOption {
	label: string;
	value: string;
	naturalAttack: {
		name: string;
		slug: string;
	};
	profileKind: CreatureAttackProfileKind;
	profileName: string;
}

export interface CreatureAnatomyZoneViewGroup {
	trackId: string;
	parent: CreatureAnatomyZoneViewItem | null;
	children: CreatureAnatomyZoneViewItem[];
}

export interface SelectOption<TValue extends string> {
	label: string;
	value: TValue;
}

export type ActivityFilter = 'all' | 'active' | 'inactive';

export interface CreatureCombatIntentGroup {
	label: string;
	items: CreatureCombatIntentOption[];
}

export type CreatureAnatomyZoneOverrideField =
	| 'name'
	| 'parentId'
	| 'kind'
	| 'isRandomHitEligible'
	| 'randomHitWeight'
	| 'targetedAttackDicePenalty'
	| 'extraPotentialCost'
	| 'isActive'
	| 'sortOrder';

export type CreatureNaturalAttackProfilePatch =
	Partial<CreatureNaturalAttackProfile>;

export type CreatureAnatomyZonePatch = Partial<CreatureAnatomyZone>;
