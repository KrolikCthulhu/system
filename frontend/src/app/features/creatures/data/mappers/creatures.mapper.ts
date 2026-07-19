import { Creature, CreaturesCatalog } from '../../domain/creatures.models';
import { CreatureDto, CreaturesCatalogResponseDto } from '../dto/creatures.dto';

export function mapCreaturesCatalogResponseDto(
	dto: CreaturesCatalogResponseDto
): CreaturesCatalog {
	return {
		creatures: dto.creatures.map(mapCreatureDto),
		creatureTypes: dto.creatureTypes,
		anatomySchemes: dto.anatomySchemes,
		armorPresets: dto.armorPresets,
		skills: dto.skills,
		characteristics: dto.characteristics
	};
}

export function mapCreatureDto(dto: CreatureDto): Creature {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		typeId: dto.typeId,
		type: dto.type,
		anatomySchemeId: dto.anatomySchemeId,
		anatomyScheme: dto.anatomyScheme,
		anatomyZones: dto.anatomyZones,
		tiers: dto.tiers,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
