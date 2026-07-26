import { Condition, ConditionsCatalog } from '../../domain/conditions.models';
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
		durationType: dto.durationType,
		repeatLevelMode: dto.repeatLevelMode,
		repeatDurationMode: dto.repeatDurationMode,
		instanceMode: dto.instanceMode,
		instanceLimitMode: dto.instanceLimitMode,
		maxInstances: dto.maxInstances,
		instanceOverflowMode: dto.instanceOverflowMode,
		instanceUniquenessMode: dto.instanceUniquenessMode,
		duplicateInstanceMode: dto.duplicateInstanceMode,
		maxLevel: dto.maxLevel,
		removalMethods: dto.removalMethods,
		effects: dto.effects.map((effect, index) => ({
			type: effect.type,
			scope: effect.scope,
			value: effect.value,
			config: effect.config ?? {},
			sortOrder: effect.sortOrder ?? index
		})),
		applicationConditions: (dto.applicationConditions ?? []).map(
			(condition, index) => ({
				...condition,
				isActive: condition.isActive ?? true,
				config: condition.config ?? {},
				sortOrder: condition.sortOrder ?? index
			})
		),
		parameters: dto.parameters ?? [],
		textBlocks: (dto.textBlocks ?? []).map((block, index) => ({
			...block,
			isActive: block.isActive ?? true,
			sortOrder: block.sortOrder ?? index
		})),
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
