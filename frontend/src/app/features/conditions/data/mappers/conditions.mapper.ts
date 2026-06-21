import {
	Condition,
	ConditionsCatalog
} from '../../domain/conditions.models';
import {
	ConditionDto,
	ConditionsCatalogResponseDto
} from '../dto/conditions.dto';

export function mapConditionsCatalogResponseDto(
	dto: ConditionsCatalogResponseDto
): ConditionsCatalog {
	return {
		conditions: dto.conditions.map(mapConditionDto)
	};
}

export function mapConditionDto(dto: ConditionDto): Condition {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		description: dto.description ?? '',
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
