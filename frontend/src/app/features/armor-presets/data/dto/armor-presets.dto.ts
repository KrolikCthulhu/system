export interface ArmorPresetDto {
	id: string;
	slug: string;
	name: string;
	points: number;
	protection: number;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface ArmorPresetsCatalogResponseDto {
	armorPresets: ArmorPresetDto[];
}

export interface CreateArmorPresetDto {
	name: string;
	points: number;
	protection: number;
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateArmorPresetDto {
	name?: string;
	points?: number;
	protection?: number;
	isActive?: boolean;
	sortOrder?: number;
}
