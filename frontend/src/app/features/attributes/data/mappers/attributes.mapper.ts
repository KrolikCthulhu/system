import {
	Attribute,
	AttributesAdminCatalog,
	Characteristic
} from '../../domain/attributes.models';
import {
	AttributeDto,
	AttributesAdminCatalogDto,
	CharacteristicDto
} from '../dto/attributes.dto';
import { createSystemValueDefinition } from '../../../../shared/types/system-value.models';

export function mapAttributeDto(dto: AttributeDto): Attribute {
	const systemValue = createSystemValueDefinition(dto.systemValue.id);

	return {
		id: dto.id,
		name: dto.name,
		description: dto.description,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt,
		systemValue: {
			...systemValue,
			calculationGraph: dto.systemValue.calculationGraph
		}
	};
}

export function mapCharacteristicDto(dto: CharacteristicDto): Characteristic {
	const systemValue = createSystemValueDefinition(dto.systemValue.id);

	return {
		id: dto.id,
		name: dto.name,
		attributeId: dto.attributeId,
		description: dto.description,
		minValue: dto.minValue,
		maxValue: dto.maxValue,
		defaultValue: dto.defaultValue,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt,
		systemValue: {
			...systemValue,
			calculationGraph: dto.systemValue.calculationGraph
		}
	};
}

export function mapAttributesAdminCatalogDto(
	dto: AttributesAdminCatalogDto
): AttributesAdminCatalog {
	return {
		attributes: dto.attributes.map(mapAttributeDto),
		characteristics: dto.characteristics.map(mapCharacteristicDto)
	};
}
