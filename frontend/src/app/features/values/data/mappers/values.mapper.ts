import {
	mapSystemValueBaseSourceType,
	SystemValueSourceType
} from '../../../../shared/types/system-value.models';
import { SystemValue, SystemValuesCatalog } from '../../domain/values.models';
import { SystemValueDto, SystemValuesCatalogDto } from '../dto/values.dto';

export function mapSystemValueDto(dto: SystemValueDto): SystemValue {
	return {
		id: dto.id,
		name: dto.name,
		kind: dto.kind as SystemValueSourceType,
		groupLabel: dto.groupLabel,
		contextLabel: dto.contextLabel,
		description: dto.description,
		isSystemValue: dto.isSystemValue,
		baseSourceType: mapSystemValueBaseSourceType(dto.baseSourceType),
		baseValue: dto.baseValue,
		calculationGraph: dto.calculationGraph
	};
}

export function mapSystemValuesCatalogDto(
	dto: SystemValuesCatalogDto
): SystemValuesCatalog {
	return {
		values: dto.values.map(mapSystemValueDto)
	};
}
