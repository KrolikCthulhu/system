import {
	SystemCombatAction,
	SystemCombatActionsCatalog
} from '../../domain/system-combat-actions.models';
import {
	SystemCombatActionDto,
	SystemCombatActionsCatalogResponseDto
} from '../dto/system-combat-actions.dto';

export function mapSystemCombatActionsCatalogResponseDto(
	dto: SystemCombatActionsCatalogResponseDto
): SystemCombatActionsCatalog {
	return {
		actions: dto.actions.map(mapSystemCombatActionDto)
	};
}

export function mapSystemCombatActionDto(
	dto: SystemCombatActionDto
): SystemCombatAction {
	return {
		id: dto.id,
		coreKey: dto.coreKey,
		label: dto.label,
		description: dto.description,
		targetChoiceLabel: dto.targetChoiceLabel,
		confirmationTitle: dto.confirmationTitle,
		isEnabled: dto.isEnabled,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
