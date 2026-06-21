export interface DamageType {
	id: string;
	slug: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface DamageTypesCatalog {
	damageTypes: DamageType[];
}
