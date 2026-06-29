export interface CreatureTypeDto {
	id: string;
	slug: string;
	name: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreatureTypesCatalogResponseDto {
	creatureTypes: CreatureTypeDto[];
}

export interface CreateCreatureTypeDto {
	name: string;
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateCreatureTypeDto {
	name?: string;
	isActive?: boolean;
	sortOrder?: number;
}
