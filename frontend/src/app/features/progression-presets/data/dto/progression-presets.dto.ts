import {
	ProgressionPresetConfig,
	ProgressionPresetKind
} from '../../domain/progression-presets.models';

export interface ProgressionPresetDto {
	id: string;
	name: string;
	description: string;
	kind: ProgressionPresetKind;
	config: ProgressionPresetConfig;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface ProgressionPresetsCatalogResponseDto {
	presets: ProgressionPresetDto[];
}

export interface CreateProgressionPresetDto {
	name: string;
	description?: string;
	kind: ProgressionPresetKind;
	config: ProgressionPresetConfig;
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateProgressionPresetDto {
	name?: string;
	description?: string;
	kind?: ProgressionPresetKind;
	config?: ProgressionPresetConfig;
	isActive?: boolean;
	sortOrder?: number;
}
