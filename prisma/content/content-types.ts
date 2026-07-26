import {
	AreaShapeKind,
	AnatomyZoneKind,
	MagicWordType,
	Prisma,
	SpellStatus,
	SystemValueOwnerType
} from '../__generated__/index.js';

export type ContentDocument<TCollections extends Record<string, unknown>> = {
	schemaVersion: 1;
} & TCollections;

export type GroupedContentDocument<
	TCollections extends Record<string, unknown>
> = ContentDocument<TCollections> & {
	group: string;
};

export type SlugRef = {
	slug: string;
	name: string;
};

export type MagicWordRef = SlugRef & {
	type: keyof typeof MagicWordType;
};

export type SortableContentItem = SlugRef & {
	sortOrder: number;
};

export type NamedContentItem = SortableContentItem & {
	description?: string;
};

export type DamageTypeContent = SortableContentItem;

export const conditionDurationTypes = [
	'until_owner_next_activation',
	'until_next_round_start',
	'round_count',
	'game_time',
	'until_short_rest',
	'until_full_rest',
	'until_healed',
	'until_removed',
	'permanent'
] as const;

export type ConditionDurationType = (typeof conditionDurationTypes)[number];

export const conditionRepeatLevelModes = [
	'keep_current',
	'replace_new',
	'add',
	'keep_highest'
] as const;

export type ConditionRepeatLevelMode =
	(typeof conditionRepeatLevelModes)[number];

export const conditionRepeatDurationModes = [
	'keep_current',
	'replace_new',
	'add',
	'keep_highest'
] as const;

export type ConditionRepeatDurationMode =
	(typeof conditionRepeatDurationModes)[number];

export const conditionInstanceModes = [
	'single',
	'separate_by_source',
	'multiple_independent'
] as const;

export type ConditionInstanceMode = (typeof conditionInstanceModes)[number];

export const conditionInstanceLimitModes = ['none', 'fixed'] as const;

export type ConditionInstanceLimitMode =
	(typeof conditionInstanceLimitModes)[number];

export const conditionInstanceOverflowModes = [
	'reject_new',
	'replace_oldest',
	'replace_lowest_level',
	'manual_choice'
] as const;

export type ConditionInstanceOverflowMode =
	(typeof conditionInstanceOverflowModes)[number];

export const conditionInstanceUniquenessModes = [
	'none',
	'source',
	'holding_part',
	'source_and_holding_part',
	'item',
	'ability'
] as const;

export type ConditionInstanceUniquenessMode =
	(typeof conditionInstanceUniquenessModes)[number];

export const conditionDuplicateInstanceModes = [
	'reject_duplicate',
	'update_existing',
	'create_new'
] as const;

export type ConditionDuplicateInstanceMode =
	(typeof conditionDuplicateInstanceModes)[number];

export const conditionRemovalMethods = [
	'automatic',
	'spend_potential',
	'successful_check',
	'healing',
	'rest',
	'remove_source'
] as const;

export type ConditionRemovalMethod = (typeof conditionRemovalMethods)[number];

export const conditionEffectTypes = [
	'dice_pool_modifier',
	'potential_cost_modifier',
	'periodic_damage',
	'action_forbidden',
	'reaction_forbidden',
	'speed_modifier',
	'defense_modifier',
	'incoming_damage_modifier',
	'special_rule'
] as const;

export type ConditionEffectType = (typeof conditionEffectTypes)[number];

export const conditionEffectScopes = [
	'all_checks',
	'mind_checks',
	'body_checks',
	'characteristic',
	'skill',
	'attacks',
	'dodge',
	'parry',
	'movement'
] as const;

export type ConditionEffectScope = (typeof conditionEffectScopes)[number];

export const conditionEffectTargetScopes = [
	'holder',
	'source_against_holder',
	'source_group_against_holder',
	'all_creatures_against_holder'
] as const;

export type ConditionEffectTargetScope =
	(typeof conditionEffectTargetScopes)[number];

export type ConditionEffectContent = {
	type: ConditionEffectType;
	scope: ConditionEffectScope;
	targetScope?: ConditionEffectTargetScope;
	value?: number;
	config?: Prisma.InputJsonValue;
	sortOrder?: number;
};

export const conditionApplicationConditionTypes = [
	'target_is_creature',
	'target_has_anatomy',
	'target_missing_condition',
	'target_size_relative',
	'source_holds_target'
] as const;

export type ConditionApplicationConditionType =
	(typeof conditionApplicationConditionTypes)[number];

export const conditionSizeRelativeModes = [
	'target_not_larger_than_source_by_more_than',
	'target_not_smaller_than_source_by_more_than'
] as const;

export type ConditionSizeRelativeMode =
	(typeof conditionSizeRelativeModes)[number];

export type ConditionApplicationConditionContent = {
	type: ConditionApplicationConditionType;
	isActive?: boolean;
	config?: {
		conditionId?: string;
		sizeMode?: ConditionSizeRelativeMode;
		sizeDelta?: number;
	};
	sortOrder?: number;
};

export const conditionParameterTypes = [
	'text',
	'number',
	'boolean',
	'creature',
	'combat_participant',
	'body_part',
	'item',
	'distance',
	'check',
	'rule',
	'rule_template'
] as const;

export type ConditionParameterType = (typeof conditionParameterTypes)[number];

export const conditionRuleTemplateTypes = [
	'opposed_check',
	'fixed_difficulty',
	'spend_potential',
	'remove_source'
] as const;

export type ConditionRuleTemplateType =
	(typeof conditionRuleTemplateTypes)[number];

export type ConditionRuleTemplateValueContent = {
	template: ConditionRuleTemplateType;
	checkName?: string;
	potentialCost?: number;
	difficulty?: number;
};

export const conditionParameterValueSources = [
	'manual',
	'target',
	'source',
	'attack',
	'selected_body_zone',
	'check_result'
] as const;

export type ConditionParameterValueSource =
	(typeof conditionParameterValueSources)[number];

export type ConditionParameterContent = {
	key: string;
	label: string;
	type: ConditionParameterType;
	valueSource?: ConditionParameterValueSource;
	isRequired?: boolean;
	defaultValue?: string | number | boolean | ConditionRuleTemplateValueContent;
	sortOrder?: number;
};

export type ConditionTextTokenContent =
	| 'conditionName'
	| 'ownerName'
	| 'description'
	| 'duration'
	| 'currentLevel'
	| 'maxLevel'
	| 'remainingDuration'
	| 'removalMethods'
	| 'effects'
	| 'source'
	| 'targetName'
	| 'bodyPart'
	| 'holdingPart'
	| 'maxDistanceMeters'
	| 'movementRule'
	| 'escapeMode'
	| 'escapeCostPotential'
	| 'escapeDifficulty'
	| 'escapeRule'
	| `parameter:${string}`;

export type ConditionTextBlockContent =
	| {
			kind: 'text';
			text: string;
			isActive?: boolean;
			sortOrder?: number;
	  }
	| {
			kind: 'token';
			token: ConditionTextTokenContent;
			isActive?: boolean;
			sortOrder?: number;
	  };

export type ConditionContent = SortableContentItem & {
	description?: string;
	durationType: ConditionDurationType;
	repeatLevelMode: ConditionRepeatLevelMode;
	repeatDurationMode: ConditionRepeatDurationMode;
	instanceMode: ConditionInstanceMode;
	instanceLimitMode: ConditionInstanceLimitMode;
	maxInstances: number;
	instanceOverflowMode: ConditionInstanceOverflowMode;
	instanceUniquenessMode: ConditionInstanceUniquenessMode;
	duplicateInstanceMode: ConditionDuplicateInstanceMode;
	maxLevel: number;
	removalMethods: ConditionRemovalMethod[];
	effects: ConditionEffectContent[];
	applicationConditions?: ConditionApplicationConditionContent[];
	parameters?: ConditionParameterContent[];
	textBlocks?: ConditionTextBlockContent[];
	isActive?: boolean;
};

export type CreatureTypeContent = SortableContentItem;

export type CreatureSizeContent = NamedContentItem & {
	rank: number;
	isActive?: boolean;
};

export type AnatomySchemeContent = NamedContentItem & {
	zones: AnatomySchemeZoneContent[];
};

export type AnatomySchemeZoneContent = SortableContentItem & {
	parent?: SlugRef;
	kind: keyof typeof AnatomyZoneKind;
	isRandomHitEligible: boolean;
	randomHitWeight: number;
	targetedAttackDicePenalty: number;
	extraPotentialCost: number;
	isActive?: boolean;
};

export type CreatureContent = SortableContentItem & {
	type: SlugRef;
	anatomyScheme?: SlugRef;
	naturalAttacks?: CreatureNaturalAttackContent[];
	actions?: CreatureTierActionContent[];
	tiers: CreatureTierContent[];
};

export type CreatureNaturalAttackContent = SlugRef & {
	attackProfiles?: WeaponAttackProfileContent[];
};

export type CreatureTierContent = {
	tier: number;
	name: string;
	hp: number;
	size?: SlugRef;
	armorPreset: SlugRef;
	attackOverrides?: CreatureTierAttackOverrideContent[];
	abilities?: CreatureTierAbilityContent[];
	actions?: CreatureTierActionContent[];
	actionOverrides?: CreatureTierActionContent[];
	characteristics?: CreatureTierCharacteristicContent[];
	skills: CreatureTierSkillContent[];
	sortOrder?: number;
	isActive?: boolean;
};

export type CreatureTierAttackOverrideContent = {
	naturalAttack: SlugRef;
	profileKind?: 'melee' | 'ranged';
	profileName?: string;
	isAvailable?: boolean;
	costModifier?: number;
	damageModifier?: number;
	rangeModifier?: number;
	dicePoolModifier?: number;
	sortOrder?: number;
};

export type CreatureTierAbilityContent = {
	name: string;
	costPotential?: number | null;
	target?: string;
	duration?: string;
	description?: string;
	effectText?: string;
	appliesCondition?: SlugRef;
	conditionDisplayName?: string;
	sortOrder?: number;
	isActive?: boolean;
};

export type CreatureTierActionKindContent =
	| 'attack'
	| 'grab_action'
	| 'active_ability'
	| 'reaction'
	| 'passive';

export type CreatureTierActionSourceContent = {
	type: 'natural_attack' | 'weapon' | 'condition' | 'ability' | 'custom';
	name?: string;
	slug?: string;
	profileName?: string;
	intent?: SlugRef;
};

export type CreatureTierActionCostContent = {
	mode: 'free' | 'fixed' | 'per_meter' | 'rule';
	potential?: number | null;
	perMeter?: number | null;
};

export type CreatureTierActionTargetContent = {
	type:
		| 'self'
		| 'creature'
		| 'hostile_creature'
		| 'held_target'
		| 'marked_target'
		| 'none';
	visibility?: 'visible' | 'any';
	description?: string;
};

export type CreatureTierActionRollContent = {
	type: 'none' | 'attack_profile' | 'check';
	characteristic?: SlugRef;
	skill?: SlugRef;
};

export type CreatureTierActionDefenseContent = {
	type: 'none' | 'target_physical_defense';
	canDodge?: boolean;
	canParry?: boolean;
};

export type CreatureTierActionEffectContent = {
	type:
		| 'damage'
		| 'apply_condition'
		| 'remove_condition'
		| 'create_grab'
		| 'release_grab'
		| 'move_with_grab'
		| 'dice_pool_modifier'
		| 'special_rule';
	value?: number | null;
	damageMode?: 'clean_successes' | 'clean_successes_plus_base' | 'base_damage';
	damageType?: SlugRef;
	condition?: SlugRef;
	conditionDisplayName?: string;
	conditionLevel?: number | null;
	targetScope?: ConditionEffectTargetScope;
	appliesArmor?: boolean;
	requiresDamageAfterArmor?: boolean;
	text?: string;
	sortOrder?: number;
};

export type CreatureTierActionContent = {
	slug: string;
	name: string;
	kind: CreatureTierActionKindContent;
	source?: CreatureTierActionSourceContent;
	cost: CreatureTierActionCostContent;
	target?: CreatureTierActionTargetContent;
	availabilityRules?: AttackAvailabilityRuleContent[];
	roll?: CreatureTierActionRollContent;
	defense?: CreatureTierActionDefenseContent;
	effects?: CreatureTierActionEffectContent[];
	playerText?: string;
	sortOrder?: number;
	isActive?: boolean;
};

export type CreatureTierCharacteristicContent = SlugRef & {
	value: number;
};

export type CreatureTierSkillContent = SlugRef & {
	level: number;
};

export type ArmorPresetContent = SortableContentItem & {
	points: number;
	protection: number;
};

export type WeaponContent = SortableContentItem & {
	skill: SlugRef;
	template: SlugRef;
	extraDamage: number;
	damageTypes?: SlugRef[];
	attackProfiles?: WeaponAttackProfileContent[];
};

export type WeaponAttackProfileContent = {
	kind: 'melee' | 'ranged';
	name: string;
	skill: SlugRef;
	characteristic: SlugRef;
	baseCost: number;
	baseDamage: number;
	rangeMeters: number;
	usesAmmo?: boolean;
	canBeParried?: boolean;
	damageTypes?: SlugRef[];
	availabilityRules?: AttackAvailabilityRuleContent[];
	combatIntents?: AttackIntentContent[];
	followupActions?: AttackFollowupActionContent[];
	sortOrder?: number;
	isActive?: boolean;
};

export type AttackAvailabilityRuleContent = {
	type: 'resource_free' | 'active_condition';
	label: string;
	resourceKey?: string;
	condition?: SlugRef;
	unavailableText?: string;
	sortOrder?: number;
};

export type AttackIntentContent = SlugRef & {
	nameOverride?: string;
	costModifier?: number;
	damageModifier?: number;
	ruleText?: string;
	availabilityRules?: AttackAvailabilityRuleContent[];
};

export type AttackFollowupActionContent = {
	kind?: 'release_grab' | 'drag_grab' | 'shake_grab' | 'custom';
	name: string;
	costMode?: 'fixed' | 'per_meter' | 'rule';
	costPotential?: number | null;
	costPerMeter?: number | null;
	damageMode?: 'none' | 'base_attack_damage' | 'custom';
	appliesArmor?: boolean;
	conditionOnDamage?: SlugRef;
	conditionLevel?: number;
	keepsGrab?: boolean;
	description?: string;
	availabilityRules?: AttackAvailabilityRuleContent[];
	sortOrder?: number;
	isActive?: boolean;
};

export type WeaponTemplateContent = SortableContentItem & {
	skill: SlugRef;
	handsMin: number;
	handsMax: number;
	defaultHands: number;
	attackProfiles: WeaponAttackProfileContent[];
};

export type NaturalAttackContent = SortableContentItem & {
	skill: SlugRef;
	attackProfiles: WeaponAttackProfileContent[];
};

export type CombatIntentContent = SortableContentItem & {
	category: string;
	description?: string;
	mechanic?: Prisma.InputJsonValue;
	textBlocks?: CombatIntentTextBlockContent[];
	isActive?: boolean;
};

export type CombatIntentTextToken =
	| 'intentName'
	| 'attackerName'
	| 'targetName'
	| 'weaponName'
	| 'attackProfileName'
	| 'attackSkill'
	| 'attackCharacteristic'
	| 'baseCost'
	| 'baseDamage'
	| 'rangeMeters'
	| 'damageTypes'
	| 'selectedDamageType'
	| 'defenseOptions'
	| 'cleanSuccesses'
	| 'damageFormula'
	| 'randomHitZones'
	| 'targetedMainZones'
	| 'targetedSubzones'
	| 'armorRule';

export type CombatIntentTextBlockContent =
	| {
			kind: 'text';
			text: string;
			isActive?: boolean;
			sortOrder?: number;
	  }
	| {
			kind: 'token';
			token: CombatIntentTextToken;
			isActive?: boolean;
			sortOrder?: number;
	  };

export type ProgressionContent = NamedContentItem & {
	kind: string;
	config: Prisma.InputJsonValue;
};

export type SystemValueContent = NamedContentItem & {
	primaryOwnerType: keyof typeof SystemValueOwnerType;
	displaySection: string;
	calculation: 'characterInput';
	isSystemManaged: boolean;
	isActive: boolean;
};

export type SkillCategoryContent = NamedContentItem & {
	skills: SkillContent[];
};

export type SkillContent = SortableContentItem & {
	rollCharacteristicName: string;
	rollConsequenceName: string;
};

export type MagicWordContent = SortableContentItem & {
	type: keyof typeof MagicWordType;
};

export type MagicModifierGestureRestrictionContent = {
	modifierName: string;
	modifierSlug: string;
	gestureNames: string[];
	gestureSlugs: string[];
};

export type MagicWordEssenceProfileContent = SlugRef & {
	damageAffinity: number;
	rangeAffinity: number;
	controlAffinity: number;
	durationAffinity: number;
	areaAffinity: number;
	stabilityAffinity: number;
};

export type MagicWordLinkContent = {
	magicWordName: string;
	magicWordSlug: string;
	skillNames: string[];
	skillSlugs: string[];
	damageTypeNames: string[];
	damageTypeSlugs: string[];
	conditionNames: string[];
	conditionSlugs: string[];
};

export type AreaShapeContent = SlugRef & {
	gestureSlug: string;
	kind: keyof typeof AreaShapeKind;
	description?: string;
	dimensions: Prisma.InputJsonValue;
	influenceConfig: Prisma.InputJsonValue;
	sortOrder: number;
	isActive?: boolean;
};

export type SpellMechanicCategoryContent = SortableContentItem;

export type SpellMechanicContent = SlugRef & {
	categoryName: string;
	description?: string;
	sortOrder: number;
	configSchema: Prisma.InputJsonValue;
	parameters: SpellMechanicParameterContent[];
	actions: SpellMechanicActionContent[];
	textTemplate:
		| string
		| {
				segments: Array<Record<string, unknown>>;
		  };
};

export type SpellMechanicParameterContent = SlugRef & {
	kind:
		| 'target'
		| 'skill'
		| 'number'
		| 'formula'
		| 'damageType'
		| 'condition'
		| 'systemValue'
		| 'text';
	numericRole?:
		| 'damage'
		| 'range'
		| 'duration'
		| 'area'
		| 'targetCount'
		| 'custom';
	scope?: 'caster' | 'target' | 'spell' | 'effect' | 'environment';
	required: boolean;
	configuredBySpell: boolean;
	overrideAllowed: boolean;
	defaultValue: {
		mode: 'empty' | 'static' | 'fromMagicWord';
		value: string;
	};
	defaultTargetConfig?: Prisma.InputJsonValue;
};

export type SpellMechanicActionContent = {
	slug: string;
	name: string;
	kind:
		| 'roll'
		| 'check'
		| 'comparison'
		| 'calculation'
		| 'branch'
		| 'effectScale'
		| 'valueChange'
		| 'conditionAdd'
		| 'conditionRemove'
		| 'text'
		| 'custom';
	config: Prisma.InputJsonValue;
	isActive?: boolean;
	sortOrder?: number;
};

export type SpellContent = {
	name: string;
	formulaName?: string;
	description?: string;
	status: keyof typeof SpellStatus;
	sortOrder?: number;
	formula: {
		action: MagicWordRef;
		essence: MagicWordRef;
		gesture: MagicWordRef;
	};
	targetConfigs: Prisma.InputJsonValue[];
	mechanicBlocks: SpellMechanicBlockContent[];
	textBlocks: SpellTextBlockContent[];
};

export type SpellMechanicBlockContent = {
	mechanicRef: SlugRef;
	parameters: Record<string, unknown>;
	config?: Prisma.InputJsonValue;
	isActive?: boolean;
	sortOrder?: number;
};

export type SpellTextBlockContent =
	| {
			kind: 'text';
			text: string;
			isActive?: boolean;
			sortOrder?: number;
	  }
	| {
			kind: 'mechanicText';
			mechanic: string;
			text?: string;
			isActive?: boolean;
			sortOrder?: number;
	  };
