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

export type ConditionEffectContent = {
	type: ConditionEffectType;
	scope: ConditionEffectScope;
	value?: number;
	config?: Prisma.InputJsonValue;
	sortOrder?: number;
};

export type ConditionTextBlockContent =
	| {
			kind: 'text';
			text: string;
			isActive?: boolean;
			sortOrder?: number;
	  }
	| {
			kind: 'token';
			token:
				| 'conditionName'
				| 'description'
				| 'duration'
				| 'currentLevel'
				| 'maxLevel'
				| 'remainingDuration'
				| 'removalMethods'
				| 'effects'
				| 'source'
				| 'bodyPart';
			isActive?: boolean;
			sortOrder?: number;
	  };

export type ConditionContent = SortableContentItem & {
	description?: string;
	durationType: ConditionDurationType;
	repeatLevelMode: ConditionRepeatLevelMode;
	repeatDurationMode: ConditionRepeatDurationMode;
	maxLevel: number;
	removalMethods: ConditionRemovalMethod[];
	effects: ConditionEffectContent[];
	textBlocks?: ConditionTextBlockContent[];
	isActive?: boolean;
};

export type CreatureTypeContent = SortableContentItem;

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
	tiers: CreatureTierContent[];
};

export type CreatureTierContent = {
	tier: number;
	name: string;
	hp: number;
	armorPreset: SlugRef;
	characteristics?: CreatureTierCharacteristicContent[];
	skills: CreatureTierSkillContent[];
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
	damageTypes?: SlugRef[];
	combatIntents?: SlugRef[];
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

export type CombatIntentContent = SortableContentItem & {
	category: string;
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
