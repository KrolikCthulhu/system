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
