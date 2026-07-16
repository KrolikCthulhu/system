export interface CombatIntent {
	id: string;
	slug: string;
	name: string;
	category: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CombatIntentsCatalog {
	combatIntents: CombatIntent[];
}
