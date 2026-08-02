export interface SystemCombatActionDto {
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

export interface SystemCombatActionsCatalogResponseDto {
	actions: SystemCombatActionDto[];
}

export interface UpdateSystemCombatActionDto {
	label?: string;
	description?: string;
	targetChoiceLabel?: string;
	confirmationTitle?: string;
}
