import {
	AnatomyScheme,
	AnatomySchemesCatalog
} from '../../domain/anatomy-schemes.models';
import {
	AnatomySchemeDto,
	AnatomySchemesCatalogResponseDto
} from '../dto/anatomy-schemes.dto';

export function mapAnatomySchemesCatalogResponseDto(
	dto: AnatomySchemesCatalogResponseDto
): AnatomySchemesCatalog {
	return {
		anatomySchemes: dto.anatomySchemes.map(mapAnatomySchemeDto)
	};
}

export function mapAnatomySchemeDto(dto: AnatomySchemeDto): AnatomyScheme {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		description: dto.description ?? '',
		zones: dto.zones.map((zone, index) => ({
			...zone,
			parentId: zone.parentId ?? null,
			sortOrder: zone.sortOrder ?? index
		})),
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
