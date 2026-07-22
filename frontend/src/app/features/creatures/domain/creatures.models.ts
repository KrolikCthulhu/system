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

export interface CreatureNaturalAttackProfileIntent {
	combatIntentId: string;
	costModifier: number;
	damageModifier: number;
	ruleText: string;
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
	damageTypeIds: string[];
	intents: CreatureNaturalAttackProfileIntent[];
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

export interface CreatureTier {
	id: string;
	tier: number;
	name: string;
	hp: number;
	sizeId: string | null;
	size: CreatureSizeOption | null;
	armorPresetId: string | null;
	armorPreset: CreatureArmorPresetOption | null;
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
}
