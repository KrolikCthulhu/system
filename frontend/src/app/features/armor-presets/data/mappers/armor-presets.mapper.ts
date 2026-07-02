import {
	ArmorPreset,
	ArmorPresetsCatalog
} from '../../domain/armor-presets.models';
import {
	ArmorPresetDto,
	ArmorPresetsCatalogResponseDto
} from '../dto/armor-presets.dto';

export function mapArmorPresetsCatalogResponseDto(
	dto: ArmorPresetsCatalogResponseDto
): ArmorPresetsCatalog {
	return {
		armorPresets: dto.armorPresets.map(mapArmorPresetDto)
	};
}

export function mapArmorPresetDto(dto: ArmorPresetDto): ArmorPreset {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		points: dto.points,
		protection: dto.protection,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
