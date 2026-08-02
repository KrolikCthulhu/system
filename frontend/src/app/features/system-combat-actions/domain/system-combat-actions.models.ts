export interface SystemCombatAction {
	id: string;
	coreKey: string;
	label: string;
	description: string;
	targetChoiceLabel: string;
	confirmationTitle: string;
	isEnabled: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface SystemCombatActionsCatalog {
	actions: SystemCombatAction[];
}
