import {
	CombatIntent,
	CombatIntentsCatalog
} from '../../domain/combat-intents.models';
import {
	CombatIntentDto,
	CombatIntentsCatalogResponseDto
} from '../dto/combat-intents.dto';

export function mapCombatIntentsCatalogResponseDto(
	dto: CombatIntentsCatalogResponseDto
): CombatIntentsCatalog {
	return {
		combatIntents: dto.combatIntents.map(mapCombatIntentDto)
	};
}

export function mapCombatIntentDto(dto: CombatIntentDto): CombatIntent {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		category: dto.category,
		textBlocks: dto.textBlocks ?? [],
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
