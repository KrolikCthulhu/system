import {
	CreatureType,
	CreatureTypesCatalog
} from '../../domain/creature-types.models';
import {
	CreatureTypeDto,
	CreatureTypesCatalogResponseDto
} from '../dto/creature-types.dto';

export function mapCreatureTypesCatalogResponseDto(
	dto: CreatureTypesCatalogResponseDto
): CreatureTypesCatalog {
	return {
		creatureTypes: dto.creatureTypes.map(mapCreatureTypeDto)
	};
}

export function mapCreatureTypeDto(dto: CreatureTypeDto): CreatureType {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
