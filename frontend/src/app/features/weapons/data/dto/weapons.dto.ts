export interface WeaponReferenceDto {
	id: string;
	slug: string;
	name: string;
}

export interface WeaponSkillOptionDto extends WeaponReferenceDto {
	categoryId: string;
	category: WeaponReferenceDto;
	isActive: boolean;
	sortOrder: number;
}

export type WeaponAttackProfileKindDto = 'melee' | 'ranged';

export interface WeaponCombatIntentOptionDto extends WeaponReferenceDto {
	category: string;
	isActive: boolean;
	sortOrder: number;
}

export interface WeaponDamageTypeOptionDto extends WeaponReferenceDto {
	isActive: boolean;
	sortOrder: number;
}

export interface WeaponCharacteristicOptionDto {
	id: string;
	name: string;
	isActive: boolean;
	sortOrder: number;
}

export interface WeaponAttackProfileIntentDto {
	id: string;
	combatIntentId: string;
	combatIntent: WeaponCombatIntentOptionDto;
	costModifier: number;
	damageModifier: number;
	ruleText: string;
	sortOrder: number;
}

export interface WeaponAttackProfileDto {
	id: string;
	kind: WeaponAttackProfileKindDto;
	name: string;
	skillId: string;
	skill: WeaponSkillOptionDto;
	characteristicId: string | null;
	characteristic: WeaponCharacteristicOptionDto | null;
	baseCost: number;
	baseDamage: number;
	rangeMeters: number;
	usesAmmo: boolean;
	canBeParried: boolean;
	damageTypeIds: string[];
	damageTypes: WeaponDamageTypeOptionDto[];
	isActive: boolean;
	sortOrder: number;
	intents: WeaponAttackProfileIntentDto[];
}

export interface WeaponTemplateDto {
	id: string;
	slug: string;
	name: string;
	skillId: string;
	skill: WeaponSkillOptionDto;
	handsMin: number;
	handsMax: number;
	defaultHands: number;
	attackProfiles: WeaponAttackProfileDto[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface WeaponDto {
	id: string;
	slug: string;
	name: string;
	templateId: string;
	template: Pick<
		WeaponTemplateDto,
		| 'id'
		| 'slug'
		| 'name'
		| 'handsMin'
		| 'handsMax'
		| 'defaultHands'
		| 'skillId'
	>;
	skillId: string;
	skill: WeaponSkillOptionDto;
	extraDamage: number;
	attackProfiles: WeaponAttackProfileDto[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface NaturalAttackDto {
	id: string;
	slug: string;
	name: string;
	skillId: string;
	skill: WeaponSkillOptionDto;
	attackProfiles: WeaponAttackProfileDto[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface WeaponsCatalogResponseDto {
	weapons: WeaponDto[];
	templates: WeaponTemplateDto[];
	skills: WeaponSkillOptionDto[];
	characteristics: WeaponCharacteristicOptionDto[];
	combatIntents: WeaponCombatIntentOptionDto[];
	damageTypes: WeaponDamageTypeOptionDto[];
}

export interface NaturalAttacksCatalogResponseDto {
	naturalAttacks: NaturalAttackDto[];
	skills: WeaponSkillOptionDto[];
	characteristics: WeaponCharacteristicOptionDto[];
	combatIntents: WeaponCombatIntentOptionDto[];
	damageTypes: WeaponDamageTypeOptionDto[];
}

export interface SaveWeaponAttackProfileIntentDto {
	combatIntentId: string;
	costModifier?: number;
	damageModifier?: number;
	ruleText?: string;
	sortOrder?: number;
}

export interface SaveWeaponAttackProfileDto {
	id?: string;
	kind: WeaponAttackProfileKindDto;
	name: string;
	skillId: string;
	characteristicId?: string;
	baseCost: number;
	baseDamage: number;
	rangeMeters: number;
	usesAmmo: boolean;
	canBeParried?: boolean;
	damageTypeIds?: string[];
	isActive?: boolean;
	sortOrder?: number;
	intents?: SaveWeaponAttackProfileIntentDto[];
}

export interface CreateWeaponDto {
	name: string;
	templateId: string;
	skillId?: string;
	extraDamage?: number;
	attackProfiles?: SaveWeaponAttackProfileDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateWeaponDto {
	name?: string;
	templateId?: string;
	skillId?: string;
	extraDamage?: number;
	attackProfiles?: SaveWeaponAttackProfileDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface CreateWeaponTemplateDto {
	name: string;
	skillId: string;
	handsMin: number;
	handsMax: number;
	defaultHands: number;
	attackProfiles?: SaveWeaponAttackProfileDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateWeaponTemplateDto {
	name?: string;
	skillId?: string;
	handsMin?: number;
	handsMax?: number;
	defaultHands?: number;
	attackProfiles?: SaveWeaponAttackProfileDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface CreateNaturalAttackDto {
	name: string;
	skillId: string;
	attackProfiles?: SaveWeaponAttackProfileDto[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateNaturalAttackDto {
	name?: string;
	skillId?: string;
	attackProfiles?: SaveWeaponAttackProfileDto[];
	isActive?: boolean;
	sortOrder?: number;
}
