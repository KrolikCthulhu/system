export interface CreatureReferenceDto {
	id: string;
	slug: string;
	name: string;
}

export interface CreatureTypeOptionDto extends CreatureReferenceDto {
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

export interface CreatureDto {
	id: string;
	slug: string;
	name: string;
	typeId: string;
	type: CreatureReferenceDto;
	tiers: CreatureTierDto[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreaturesCatalogResponseDto {
	creatures: CreatureDto[];
	creatureTypes: CreatureTypeOptionDto[];
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

export interface CreateCreatureDto {
	name: string;
	typeId: string;
	tiers: CreatureTierCommandDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateCreatureDto {
	name?: string;
	typeId?: string;
	tiers?: CreatureTierCommandDto[];
	isActive?: boolean;
	sortOrder?: number;
}
