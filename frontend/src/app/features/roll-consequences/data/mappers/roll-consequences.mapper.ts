import {
	RollConsequence,
	RollConsequencesCatalog,
	RollConsequenceValue
} from '../../domain/roll-consequences.models';
import {
	RollConsequenceDto,
	RollConsequencesCatalogDto,
	RollConsequenceValueDto
} from '../dto/roll-consequences.dto';

export function mapRollConsequenceValueDto(
	dto: RollConsequenceValueDto
): RollConsequenceValue {
	return {
		id: dto.id,
		name: dto.name,
		description: dto.description ?? '',
		isActive: dto.isActive,
		sortOrder: dto.sortOrder
	};
}

export function mapRollConsequenceDto(
	dto: RollConsequenceDto
): RollConsequence {
	return {
		id: dto.id,
		name: dto.name,
		description: dto.description ?? '',
		rollEventGraph: dto.rollEventGraph
			? {
					nodes: dto.rollEventGraph.nodes ?? [],
					edges: dto.rollEventGraph.edges ?? []
				}
			: null,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		values: dto.values.map(mapRollConsequenceValueDto)
	};
}

export function mapRollConsequencesCatalogDto(
	dto: RollConsequencesCatalogDto
): RollConsequencesCatalog {
	return {
		consequences: dto.consequences.map(mapRollConsequenceDto)
	};
}
