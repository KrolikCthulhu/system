import { SystemValueSourceType } from '../../../../shared/types/system-value.models';
import { SystemValue, SystemValuesCatalog } from '../../domain/values.models';
import { SystemValueDto, SystemValuesCatalogDto } from '../dto/values.dto';

export function mapSystemValueDto(dto: SystemValueDto): SystemValue {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		kind: dto.kind as SystemValueSourceType,
		groupLabel: dto.groupLabel,
		displaySection: dto.displaySection,
		contextLabel: dto.contextLabel,
		description: dto.description,
		coreKey: dto.coreKey,
		isSystemManaged: dto.isSystemManaged,
		baseValue: dto.baseValue,
		calculationGraph: dto.calculationGraph,
		primaryOwner: {
			type: dto.primaryOwner.type as SystemValueSourceType,
			id: dto.primaryOwner.id
		},
		links: dto.links.map(link => ({
			targetType: link.targetType as SystemValueSourceType,
			targetId: link.targetId,
			label: link.label,
			sortOrder: link.sortOrder
		}))
	};
}

export function mapSystemValuesCatalogDto(
	dto: SystemValuesCatalogDto
): SystemValuesCatalog {
	return {
		values: dto.values.map(mapSystemValueDto)
	};
}
