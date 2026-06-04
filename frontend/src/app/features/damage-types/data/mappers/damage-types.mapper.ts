import {
	DamageType,
	DamageTypesCatalog
} from '../../domain/damage-types.models';
import {
	DamageTypeDto,
	DamageTypesCatalogResponseDto
} from '../dto/damage-types.dto';

export function mapDamageTypesCatalogResponseDto(
	dto: DamageTypesCatalogResponseDto
): DamageTypesCatalog {
	return {
		damageTypes: dto.damageTypes.map(mapDamageTypeDto)
	};
}

export function mapDamageTypeDto(dto: DamageTypeDto): DamageType {
	return {
		id: dto.id,
		name: dto.name,
		description: dto.description ?? '',
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
