import {
	SpellMechanicCategoryDto,
	SpellMechanicDto,
	SpellMechanicsCatalogResponseDto
} from '../dto/spell-mechanics.dto';
import {
	SpellMechanic,
	SpellMechanicAction,
	SpellMechanicParameter,
	SpellMechanicCategory,
	SpellMechanicsCatalog
} from '../../domain/spell-mechanics.models';

export function mapSpellMechanicCategoryDto(
	dto: SpellMechanicCategoryDto
): SpellMechanicCategory {
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

export function mapSpellMechanicDto(
	dto: SpellMechanicDto
): SpellMechanic {
	return {
		id: dto.id,
		categoryId: dto.categoryId,
		name: dto.name,
		description: dto.description ?? '',
		configSchema: dto.configSchema ?? {},
		textTemplate: dto.textTemplate ?? '',
		parameters: (dto.parameters ?? []).map(mapSpellMechanicParameterDto),
		actions: (dto.actions ?? []).map(mapSpellMechanicActionDto),
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function mapSpellMechanicParameterDto(
	dto: SpellMechanicDto['parameters'][number]
): SpellMechanicParameter {
	return {
		id: dto.id,
		mechanicId: dto.mechanicId,
		name: dto.name,
		kind: dto.kind,
		required: dto.required,
		configuredBySpell: dto.configuredBySpell,
		overrideAllowed: dto.overrideAllowed,
		defaultValue: dto.defaultValue,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function mapSpellMechanicActionDto(
	dto: SpellMechanicDto['actions'][number]
): SpellMechanicAction {
	return {
		id: dto.id,
		mechanicId: dto.mechanicId,
		name: dto.name,
		kind: dto.kind,
		config: dto.config ?? {},
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

export function mapSpellMechanicsCatalogResponseDto(
	dto: SpellMechanicsCatalogResponseDto
): SpellMechanicsCatalog {
	return {
		categories: dto.categories.map(mapSpellMechanicCategoryDto),
		mechanics: dto.mechanics.map(mapSpellMechanicDto)
	};
}
