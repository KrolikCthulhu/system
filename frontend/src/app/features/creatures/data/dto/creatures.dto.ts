export interface CreatureReferenceDto {
	id: string;
	slug: string;
	name: string;
}

export interface CreatureTypeOptionDto extends CreatureReferenceDto {
	isActive: boolean;
	sortOrder: number;
}

export type CreatureAnatomySchemeOptionDto = CreatureTypeOptionDto;

export interface CreatureSizeOptionDto extends CreatureReferenceDto {
	description: string | null;
	rank: number;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureArmorPresetOptionDto extends CreatureTypeOptionDto {
	points: number;
	protection: number;
}

export interface CreatureSkillOptionDto extends CreatureTypeOptionDto {
	categoryId: string;
	rollCharacteristicId: string | null;
	category: CreatureReferenceDto;
	maxLevel: number;
}

export interface CreatureCharacteristicOptionDto {
	id: string;
	name: string;
	minValue: number;
	maxValue: number;
	defaultValue: number;
	isActive: boolean;
	sortOrder: number;
}

export type CreatureAttackProfileKindDto = 'melee' | 'ranged';

export interface CreatureCombatIntentOptionDto extends CreatureReferenceDto {
	category: string;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureDamageTypeOptionDto extends CreatureReferenceDto {
	isActive: boolean;
	sortOrder: number;
}

export type CreatureConditionOptionDto = CreatureDamageTypeOptionDto;

export type CreatureAttackAvailabilityComparisonOperatorDto =
	| 'gt'
	| 'gte'
	| 'eq'
	| 'ne'
	| 'lte'
	| 'lt';

export interface CreatureAttackAvailabilityComparisonOperandDto {
	kind: 'actor_property' | 'target_property' | 'constant';
	property?: 'sizeRank' | null;
	value?: number | null;
}

export interface CreatureAttackAvailabilityRuleDto {
	type: 'resource_free' | 'active_condition' | 'comparison' | 'special_rule';
	label: string;
	resourceKey?: string;
	condition?: { id?: string; slug?: string; name?: string } | null;
	left?: CreatureAttackAvailabilityComparisonOperandDto | null;
	operator?: CreatureAttackAvailabilityComparisonOperatorDto | null;
	right?: CreatureAttackAvailabilityComparisonOperandDto | null;
	unavailableText?: string;
	sortOrder?: number;
}

export interface CreatureNaturalAttackProfileIntentDto {
	combatIntentId: string;
	nameOverride?: string;
	costModifier: number;
	damageModifier: number;
	ruleText: string;
	availabilityRules?: CreatureAttackAvailabilityRuleDto[];
	sortOrder: number;
}

export interface CreatureAttackFollowupActionDto {
	kind?:
		| 'unlink_condition'
		| 'move_linked_target'
		| 'damage_linked_target'
		| 'custom';
	name: string;
	costMode?: 'fixed' | 'per_meter' | 'rule';
	costPotential?: number | null;
	costPerMeter?: number | null;
	damageMode?: 'none' | 'base_attack_damage' | 'custom';
	appliesArmor?: boolean;
	conditionOnDamage?: { id?: string; slug?: string; name?: string } | null;
	conditionLevel?: number | null;
	keepsLinkedCondition?: boolean;
	description?: string;
	availabilityRules?: CreatureAttackAvailabilityRuleDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface CreatureNaturalAttackProfileDto {
	kind: CreatureAttackProfileKindDto;
	name: string;
	skillId: string;
	characteristicId: string | null;
	baseCost: number;
	baseDamage: number;
	rangeMeters: number;
	usesAmmo: boolean;
	canBeParried: boolean;
	defaultDefense?: CreatureTierActionDefenseDto;
	availabilityRules?: CreatureAttackAvailabilityRuleDto[];
	damageTypeIds: string[];
	intents: CreatureNaturalAttackProfileIntentDto[];
	followupActions?: CreatureAttackFollowupActionDto[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureNaturalAttackOptionDto extends CreatureReferenceDto {
	skillId: string;
	skill: CreatureReferenceDto;
	attackProfiles: CreatureNaturalAttackProfileDto[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureTierSkillDto {
	id: string;
	skillId: string;
	level: number;
	skill: CreatureReferenceDto;
}

export interface CreatureTierCharacteristicDto {
	id: string;
	characteristicId: string;
	value: number;
	characteristic: CreatureCharacteristicOptionDto;
}

export interface CreatureTierAttackOverrideNaturalAttackDto {
	name: string;
	slug: string;
}

export interface CreatureTierAttackOverrideDto {
	naturalAttack: CreatureTierAttackOverrideNaturalAttackDto;
	profileKind: CreatureAttackProfileKindDto | null;
	profileName: string;
	isAvailable: boolean;
	costModifier: number;
	damageModifier: number;
	rangeModifier: number;
	dicePoolModifier: number;
	sortOrder: number;
}

export interface CreatureTierAbilityDto {
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

export interface CreatureTargetSelectionScoringRuleDto {
	key: string;
	label: string;
	points: number;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureTargetSelectionDto {
	title: string;
	description: string;
	tacticText: string;
	positionChecklist: string[];
	scoringRules: CreatureTargetSelectionScoringRuleDto[];
}

export type CreatureTierActionKindDto =
	| 'attack'
	| 'condition_action'
	| 'active_ability'
	| 'reaction'
	| 'passive';

export interface CreatureTierActionReferenceDto {
	name: string;
	slug: string;
}

export interface CreatureTierActionSourceDto {
	type: 'natural_attack' | 'weapon' | 'condition' | 'ability' | 'custom';
	name: string;
	slug: string;
	profileName: string;
	intent: CreatureTierActionReferenceDto | null;
}

export interface CreatureTierActionCostDto {
	mode: 'free' | 'fixed' | 'per_meter' | 'rule';
	potential: number | null;
	perMeter: number | null;
}

export interface CreatureTierActionTargetDto {
	type:
		| 'self'
		| 'creature'
		| 'hostile_creature'
		| 'linked_condition_target'
		| 'marked_target'
		| 'none';
	visibility: 'visible' | 'any';
	description: string;
}

export interface CreatureTierActionRollDto {
	type: 'none' | 'attack_profile' | 'check';
	characteristic: CreatureTierActionReferenceDto | null;
	skill: CreatureTierActionReferenceDto | null;
}

export interface CreatureTierActionDefenseDto {
	type: 'none' | 'target_physical_defense';
	canDodge: boolean;
	canParry: boolean;
	parrySkillGroups: CreatureParrySkillGroupDto[];
}

export type CreatureParrySkillGroupDto = 'unarmed' | 'melee_weapon' | 'shield';

export interface CreatureTierActionEffectDto {
	type:
		| 'damage'
		| 'apply_condition'
		| 'remove_condition'
		| 'link_condition'
		| 'unlink_condition'
		| 'move_linked_target'
		| 'dice_pool_modifier'
		| 'special_rule';
	value: number | null;
	damageMode:
		| 'clean_successes'
		| 'clean_successes_plus_base'
		| 'base_damage'
		| null;
	damageType: CreatureTierActionReferenceDto | null;
	condition: CreatureTierActionReferenceDto | null;
	linkedCondition: CreatureTierActionReferenceDto | null;
	conditionDisplayName: string;
	conditionLevel: number | null;
	targetScope:
		| 'actor'
		| 'selected_target'
		| 'linked_condition_target'
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

export interface CreatureTierActionDto {
	slug: string;
	name: string;
	kind: CreatureTierActionKindDto;
	source: CreatureTierActionSourceDto | null;
	cost: CreatureTierActionCostDto;
	target: CreatureTierActionTargetDto | null;
	availabilityRules: CreatureAttackAvailabilityRuleDto[];
	roll: CreatureTierActionRollDto | null;
	defense: CreatureTierActionDefenseDto | null;
	effects: CreatureTierActionEffectDto[];
	playerText: string;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureTierDto {
	id: string;
	tier: number;
	name: string;
	hp: number;
	sizeId: string | null;
	size: CreatureSizeOptionDto | null;
	armorPresetId: string | null;
	armorPreset: CreatureArmorPresetOptionDto | null;
	attackOverrides: CreatureTierAttackOverrideDto[];
	abilities: CreatureTierAbilityDto[];
	actions: CreatureTierActionDto[];
	actionOverrides: CreatureTierActionDto[];
	targetSelection: CreatureTargetSelectionDto;
	skills: CreatureTierSkillDto[];
	characteristics: CreatureTierCharacteristicDto[];
	isActive: boolean;
	sortOrder: number;
}

export type CreatureAnatomyZoneKindDto = 'MAIN' | 'TARGETED';

export interface CreatureAnatomyZoneDto {
	id: string;
	slug: string;
	name: string;
	sourceZoneId: string | null;
	parentId: string | null;
	kind: CreatureAnatomyZoneKindDto;
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

export interface CreatureNaturalAttackDto {
	id: string;
	naturalAttackId: string;
	naturalAttack: CreatureNaturalAttackOptionDto;
	attackProfiles: CreatureNaturalAttackProfileDto[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureDto {
	id: string;
	slug: string;
	name: string;
	typeId: string;
	type: CreatureReferenceDto;
	anatomySchemeId: string | null;
	anatomyScheme: CreatureReferenceDto | null;
	anatomyZones: CreatureAnatomyZoneDto[];
	naturalAttacks: CreatureNaturalAttackDto[];
	actions: CreatureTierActionDto[];
	tiers: CreatureTierDto[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreaturePublicTierSummaryDto {
	id: string;
	tier: number;
	name: string;
	hp: number;
	sizeId: string | null;
	size: CreatureSizeOptionDto | null;
	isActive: boolean;
	sortOrder: number;
}

export interface CreaturePublicSummaryDto {
	id: string;
	slug: string;
	name: string;
	tiers: CreaturePublicTierSummaryDto[];
	isActive: boolean;
	sortOrder: number;
}

export interface CreaturesCatalogResponseDto {
	creatures: CreatureDto[];
	creatureTypes: CreatureTypeOptionDto[];
	creatureSizes: CreatureSizeOptionDto[];
	anatomySchemes: CreatureAnatomySchemeOptionDto[];
	armorPresets: CreatureArmorPresetOptionDto[];
	naturalAttacks: CreatureNaturalAttackOptionDto[];
	combatIntents: CreatureCombatIntentOptionDto[];
	damageTypes: CreatureDamageTypeOptionDto[];
	skills: CreatureSkillOptionDto[];
	characteristics: CreatureCharacteristicOptionDto[];
	conditions: CreatureConditionOptionDto[];
}

export interface CreaturePublicCatalogResponseDto {
	creatures: CreaturePublicSummaryDto[];
}

export interface CreatureTierSkillCommandDto {
	skillId: string;
	level: number;
}

export interface CreatureTierCharacteristicCommandDto {
	characteristicId: string;
	value: number;
}

export interface CreatureTierAttackOverrideCommandDto {
	naturalAttack: CreatureTierAttackOverrideNaturalAttackDto;
	profileKind: CreatureAttackProfileKindDto | null;
	profileName: string;
	isAvailable: boolean;
	costModifier: number;
	damageModifier: number;
	rangeModifier: number;
	dicePoolModifier: number;
	sortOrder: number;
}

export type CreatureTierAbilityCommandDto = CreatureTierAbilityDto;
export type CreatureTargetSelectionCommandDto = CreatureTargetSelectionDto;
export type CreatureTierActionCommandDto = CreatureTierActionDto;

export interface CreatureTierCommandDto {
	tier: number;
	name: string;
	hp: number;
	sizeId: string | null;
	armorPresetId: string | null;
	attackOverrides?: CreatureTierAttackOverrideCommandDto[];
	abilities?: CreatureTierAbilityCommandDto[];
	actions?: CreatureTierActionCommandDto[];
	actionOverrides?: CreatureTierActionCommandDto[];
	targetSelection?: CreatureTargetSelectionCommandDto;
	skills: CreatureTierSkillCommandDto[];
	characteristics: CreatureTierCharacteristicCommandDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface CreatureAnatomyZoneCommandDto {
	id?: string;
	sourceZoneId?: string | null;
	name: string;
	slug?: string;
	parentId?: string | null;
	kind: CreatureAnatomyZoneKindDto;
	isRandomHitEligible: boolean;
	randomHitWeight: number;
	targetedAttackDicePenalty: number;
	extraPotentialCost: number;
	overriddenFields?: string[];
	isInherited?: boolean;
	isRemoved?: boolean;
	isActive?: boolean;
	sortOrder?: number;
}

export interface CreatureNaturalAttackCommandDto {
	naturalAttackId: string;
	attackProfiles?: CreatureNaturalAttackProfileDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface CreateCreatureDto {
	name: string;
	typeId: string;
	anatomySchemeId?: string | null;
	anatomyZones?: CreatureAnatomyZoneCommandDto[];
	naturalAttacks?: CreatureNaturalAttackCommandDto[];
	actions?: CreatureTierActionCommandDto[];
	tiers: CreatureTierCommandDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateCreatureDto {
	name?: string;
	typeId?: string;
	anatomySchemeId?: string | null;
	anatomyZones?: CreatureAnatomyZoneCommandDto[];
	naturalAttacks?: CreatureNaturalAttackCommandDto[];
	actions?: CreatureTierActionCommandDto[];
	tiers?: CreatureTierCommandDto[];
	isActive?: boolean;
	sortOrder?: number;
}
