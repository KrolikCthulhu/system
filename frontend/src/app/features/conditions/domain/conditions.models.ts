export interface Condition {
	id: string;
	slug: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface ConditionsCatalog {
	conditions: Condition[];
}
