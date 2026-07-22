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

export interface CreatureNaturalAttackProfileIntentDto {
	combatIntentId: string;
	costModifier: number;
	damageModifier: number;
	ruleText: string;
	sortOrder: number;
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
	damageTypeIds: string[];
	intents: CreatureNaturalAttackProfileIntentDto[];
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

export interface CreatureTierDto {
	id: string;
	tier: number;
	name: string;
	hp: number;
	sizeId: string | null;
	size: CreatureSizeOptionDto | null;
	armorPresetId: string | null;
	armorPreset: CreatureArmorPresetOptionDto | null;
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
	tiers: CreatureTierDto[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
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
}

export interface CreatureTierSkillCommandDto {
	skillId: string;
	level: number;
}

export interface CreatureTierCharacteristicCommandDto {
	characteristicId: string;
	value: number;
}

export interface CreatureTierCommandDto {
	tier: number;
	name: string;
	hp: number;
	sizeId: string | null;
	armorPresetId: string | null;
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
	tiers?: CreatureTierCommandDto[];
	isActive?: boolean;
	sortOrder?: number;
}
