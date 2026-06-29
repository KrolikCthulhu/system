export interface CreatureType {
	id: string;
	slug: string;
	name: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreatureTypesCatalog {
	creatureTypes: CreatureType[];
}
