export interface ConditionDto {
	id: string;
	slug: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface ConditionsCatalogResponseDto {
	conditions: ConditionDto[];
}

export interface CreateConditionDto {
	name: string;
	description?: string;
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateConditionDto {
	name?: string;
	description?: string;
	isActive?: boolean;
	sortOrder?: number;
}
