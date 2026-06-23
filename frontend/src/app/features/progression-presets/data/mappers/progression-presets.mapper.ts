import {
	ProgressionPreset,
	ProgressionPresetsCatalog
} from '../../domain/progression-presets.models';
import {
	ProgressionPresetDto,
	ProgressionPresetsCatalogResponseDto
} from '../dto/progression-presets.dto';

export function mapProgressionPresetsCatalogResponseDto(
	dto: ProgressionPresetsCatalogResponseDto
): ProgressionPresetsCatalog {
	return {
		presets: dto.presets.map(mapProgressionPresetDto)
	};
}

export function mapProgressionPresetDto(
	dto: ProgressionPresetDto
): ProgressionPreset {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		description: dto.description ?? '',
		kind: dto.kind,
		config: dto.config,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
