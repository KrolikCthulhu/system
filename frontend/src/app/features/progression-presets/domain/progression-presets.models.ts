export type ProgressionPresetKind =
	| 'LINEAR'
	| 'STEP'
	| 'QUADRATIC'
	| 'SQUARE_ROOT'
	| 'LOGARITHMIC'
	| 'SATURATION'
	| 'PERCENT';

export type ProgressionPresetRoundingMode = 'floor' | 'round' | 'ceil';

export type ProgressionPresetConfig = Record<
	string,
	number | ProgressionPresetRoundingMode
>;

export interface ProgressionPreset {
	id: string;
	slug: string;
	name: string;
	description: string;
	kind: ProgressionPresetKind;
	config: ProgressionPresetConfig;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface ProgressionPresetsCatalog {
	presets: ProgressionPreset[];
}
