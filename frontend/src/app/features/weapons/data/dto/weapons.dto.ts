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

export interface WeaponDto {
	id: string;
	slug: string;
	name: string;
	skillId: string;
	skill: WeaponSkillOptionDto;
	extraDamage: number;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface WeaponsCatalogResponseDto {
	weapons: WeaponDto[];
	skills: WeaponSkillOptionDto[];
}

export interface CreateWeaponDto {
	name: string;
	skillId: string;
	extraDamage: number;
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateWeaponDto {
	name?: string;
	skillId?: string;
	extraDamage?: number;
	isActive?: boolean;
	sortOrder?: number;
}
