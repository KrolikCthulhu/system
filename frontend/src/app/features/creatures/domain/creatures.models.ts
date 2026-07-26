export interface CreatureReference {
	id: string;
	slug: string;
	name: string;
}

export interface CreatureTypeOption extends CreatureReference {
	isActive: boolean;
	sortOrder: number;
}

export type CreatureAnatomySchemeOption = CreatureTypeOption;

export interface CreatureSizeOption extends CreatureReference {
	description: string | null;
	rank: number;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureArmorPresetOption extends CreatureTypeOption {
	points: number;
	protection: number;
}

export interface CreatureSkillOption extends CreatureTypeOption {
	categoryId: string;
	rollCharacteristicId: string | null;
	category: CreatureReference;
	maxLevel: number;
	searchText?: string;
}

export interface CreatureCharacteristicOption {
	id: string;
	name: string;
	minValue: number;
	maxValue: number;
	defaultValue: number;
	isActive: boolean;
	sortOrder: number;
}

export type CreatureAttackProfileKind = 'melee' | 'ranged';

export interface CreatureCombatIntentOption extends CreatureReference {
	category: string;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureDamageTypeOption extends CreatureReference {
	isActive: boolean;
	sortOrder: number;
}

export type CreatureConditionOption = CreatureDamageTypeOption;

export interface CreatureAttackAvailabilityRule {
	type: 'resource_free' | 'active_condition';
	label: string;
	resourceKey: string;
	condition: { id?: string; slug?: string; name?: string } | null;
	unavailableText: string;
	sortOrder: number;
}

export interface CreatureNaturalAttackProfileIntent {
	combatIntentId: string;
	nameOverride: string;
	costModifier: number;
	damageModifier: number;
	ruleText: string;
	availabilityRules: CreatureAttackAvailabilityRule[];
	sortOrder: number;
}

export interface CreatureAttackFollowupAction {
	kind: 'release_grab' | 'drag_grab' | 'shake_grab' | 'custom';
	name: string;
	costMode: 'fixed' | 'per_meter' | 'rule';
	costPotential: number | null;
	costPerMeter: number | null;
	damageMode: 'none' | 'base_attack_damage' | 'custom';
	appliesArmor: boolean;
	conditionOnDamage: { id?: string; slug?: string; name?: string } | null;
	conditionLevel: number | null;
	keepsGrab: boolean;
	description: string;
	availabilityRules: CreatureAttackAvailabilityRule[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureNaturalAttackProfile {
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
	intents: CreatureNaturalAttackProfileIntent[];
	followupActions: CreatureAttackFollowupAction[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureNaturalAttackOption extends CreatureReference {
	skillId: string;
	skill: CreatureReference;
	attackProfiles: CreatureNaturalAttackProfile[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureSkillOptionGroup {
	label: string;
	items: CreatureSkillOption[];
}

export interface CreatureTierSkill {
	id: string;
	skillId: string;
	level: number;
	skill: CreatureReference;
}

export interface CreatureTierCharacteristic {
	id: string;
	characteristicId: string;
	value: number;
	characteristic: CreatureCharacteristicOption;
}

export interface CreatureTierAttackOverrideNaturalAttack {
	name: string;
	slug: string;
}

export interface CreatureTierAttackOverride {
	naturalAttack: CreatureTierAttackOverrideNaturalAttack;
	profileKind: CreatureAttackProfileKind | null;
	profileName: string;
	isAvailable: boolean;
	costModifier: number;
	damageModifier: number;
	rangeModifier: number;
	dicePoolModifier: number;
	sortOrder: number;
}

export interface CreatureTierAbility {
	name: string;
	costPotential: number | null;
	target: string;
	duration: string;
	description: string;
	effectText: string;
	appliesCondition: { name: string; slug: string } | null;
	conditionDisplayName: string;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureTargetSelectionScoringRule {
	key: string;
	label: string;
	points: number;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureTargetSelection {
	title: string;
	description: string;
	tacticText: string;
	positionChecklist: string[];
	scoringRules: CreatureTargetSelectionScoringRule[];
}

export type CreatureTierActionKind =
	| 'attack'
	| 'grab_action'
	| 'active_ability'
	| 'reaction'
	| 'passive';

export interface CreatureTierActionReference {
	name: string;
	slug: string;
}

export interface CreatureTierActionSource {
	type: 'natural_attack' | 'weapon' | 'condition' | 'ability' | 'custom';
	name: string;
	slug: string;
	profileName: string;
	intent: CreatureTierActionReference | null;
}

export interface CreatureTierActionCost {
	mode: 'free' | 'fixed' | 'per_meter' | 'rule';
	potential: number | null;
	perMeter: number | null;
}

export interface CreatureTierActionTarget {
	type:
		| 'self'
		| 'creature'
		| 'hostile_creature'
		| 'held_target'
		| 'marked_target'
		| 'none';
	visibility: 'visible' | 'any';
	description: string;
}

export interface CreatureTierActionRoll {
	type: 'none' | 'attack_profile' | 'check';
	characteristic: CreatureTierActionReference | null;
	skill: CreatureTierActionReference | null;
}

export interface CreatureTierActionDefense {
	type: 'none' | 'target_physical_defense';
	canDodge: boolean;
	canParry: boolean;
}

export interface CreatureTierActionEffect {
	type:
		| 'damage'
		| 'apply_condition'
		| 'remove_condition'
		| 'create_grab'
		| 'release_grab'
		| 'move_with_grab'
		| 'dice_pool_modifier'
		| 'special_rule';
	value: number | null;
	damageMode:
		| 'clean_successes'
		| 'clean_successes_plus_base'
		| 'base_damage'
		| null;
	damageType: CreatureTierActionReference | null;
	condition: CreatureTierActionReference | null;
	conditionDisplayName: string;
	conditionLevel: number | null;
	targetScope:
		| 'holder'
		| 'source_against_holder'
		| 'source_group_against_holder'
		| 'all_creatures_against_holder'
		| null;
	appliesArmor: boolean;
	requiresDamageAfterArmor: boolean;
	text: string;
	sortOrder: number;
}

export interface CreatureTierAction {
	slug: string;
	name: string;
	kind: CreatureTierActionKind;
	source: CreatureTierActionSource | null;
	cost: CreatureTierActionCost;
	target: CreatureTierActionTarget | null;
	availabilityRules: CreatureAttackAvailabilityRule[];
	roll: CreatureTierActionRoll | null;
	defense: CreatureTierActionDefense | null;
	effects: CreatureTierActionEffect[];
	playerText: string;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureTier {
	id: string;
	tier: number;
	name: string;
	hp: number;
	sizeId: string | null;
	size: CreatureSizeOption | null;
	armorPresetId: string | null;
	armorPreset: CreatureArmorPresetOption | null;
	attackOverrides: CreatureTierAttackOverride[];
	abilities: CreatureTierAbility[];
	actions: CreatureTierAction[];
	actionOverrides: CreatureTierAction[];
	targetSelection: CreatureTargetSelection;
	skills: CreatureTierSkill[];
	characteristics: CreatureTierCharacteristic[];
	isActive: boolean;
	sortOrder: number;
}

export type CreatureAnatomyZoneKind = 'MAIN' | 'TARGETED';

export interface CreatureAnatomyZone {
	id: string;
	slug: string;
	name: string;
	sourceZoneId: string | null;
	parentId: string | null;
	kind: CreatureAnatomyZoneKind;
	isRandomHitEligible: boolean;
	randomHitWeight: number;
	targetedAttackDicePenalty: number;
	extraPotentialCost: number;
	overriddenFields: string[];
	isInherited: boolean;
	isRemoved: boolean;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureNaturalAttack {
	id: string;
	naturalAttackId: string;
	naturalAttack: CreatureNaturalAttackOption;
	attackProfiles: CreatureNaturalAttackProfile[];
	isActive: boolean;
	sortOrder: number;
}

export interface Creature {
	id: string;
	slug: string;
	name: string;
	typeId: string;
	type: CreatureReference;
	anatomySchemeId: string | null;
	anatomyScheme: CreatureReference | null;
	anatomyZones: CreatureAnatomyZone[];
	naturalAttacks: CreatureNaturalAttack[];
	actions: CreatureTierAction[];
	tiers: CreatureTier[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreaturesCatalog {
	creatures: Creature[];
	creatureTypes: CreatureTypeOption[];
	creatureSizes: CreatureSizeOption[];
	anatomySchemes: CreatureAnatomySchemeOption[];
	armorPresets: CreatureArmorPresetOption[];
	naturalAttacks: CreatureNaturalAttackOption[];
	combatIntents: CreatureCombatIntentOption[];
	damageTypes: CreatureDamageTypeOption[];
	skills: CreatureSkillOption[];
	characteristics: CreatureCharacteristicOption[];
	conditions: CreatureConditionOption[];
}
