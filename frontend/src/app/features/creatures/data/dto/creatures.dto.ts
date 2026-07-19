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

export interface CreatureDto {
	id: string;
	slug: string;
	name: string;
	typeId: string;
	type: CreatureReferenceDto;
	anatomySchemeId: string | null;
	anatomyScheme: CreatureReferenceDto | null;
	anatomyZones: CreatureAnatomyZoneDto[];
	tiers: CreatureTierDto[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreaturesCatalogResponseDto {
	creatures: CreatureDto[];
	creatureTypes: CreatureTypeOptionDto[];
	anatomySchemes: CreatureAnatomySchemeOptionDto[];
	armorPresets: CreatureArmorPresetOptionDto[];
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

export interface CreateCreatureDto {
	name: string;
	typeId: string;
	anatomySchemeId?: string | null;
	anatomyZones?: CreatureAnatomyZoneCommandDto[];
	tiers: CreatureTierCommandDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateCreatureDto {
	name?: string;
	typeId?: string;
	anatomySchemeId?: string | null;
	anatomyZones?: CreatureAnatomyZoneCommandDto[];
	tiers?: CreatureTierCommandDto[];
	isActive?: boolean;
	sortOrder?: number;
}
