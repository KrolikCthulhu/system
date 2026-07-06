export interface CombatIntentDto {
	id: string;
	slug: string;
	name: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CombatIntentsCatalogResponseDto {
	combatIntents: CombatIntentDto[];
}

export interface CreateCombatIntentDto {
	name: string;
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateCombatIntentDto {
	name?: string;
	isActive?: boolean;
	sortOrder?: number;
}
