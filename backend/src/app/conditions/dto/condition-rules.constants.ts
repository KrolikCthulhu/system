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
