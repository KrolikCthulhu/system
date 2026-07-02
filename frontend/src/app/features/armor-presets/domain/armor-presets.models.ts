export interface ArmorPreset {
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

export interface ArmorPresetsCatalog {
	armorPresets: ArmorPreset[];
}
