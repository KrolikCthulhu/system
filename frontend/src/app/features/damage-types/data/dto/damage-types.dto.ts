export interface DamageTypeDto {
	id: string;
	slug: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface DamageTypesCatalogResponseDto {
	damageTypes: DamageTypeDto[];
}

export interface CreateDamageTypeDto {
	name: string;
	description?: string;
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateDamageTypeDto {
	name?: string;
	description?: string;
	isActive?: boolean;
	sortOrder?: number;
}
