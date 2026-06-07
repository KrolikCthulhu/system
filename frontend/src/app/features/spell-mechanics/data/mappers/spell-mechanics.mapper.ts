import {
	SpellMechanicCategoryDto,
	SpellMechanicDto,
	SpellMechanicsCatalogResponseDto
} from '../dto/spell-mechanics.dto';
import {
	SpellMechanic,
	SpellMechanicAction,
	SpellMechanicParameter,
	SpellMechanicTargetConfig,
	SpellMechanicTargetCountMode,
	SpellMechanicTargetCountValueMode,
	SpellMechanicTargetRelation,
	SpellMechanicTargetSource,
	SpellMechanicCategory,
	SpellMechanicsCatalog
} from '../../domain/spell-mechanics.models';
import { SpellMechanicTargetConfigDto } from '../dto/spell-mechanics.dto';

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
		numericRole: dto.numericRole ?? 'custom',
		required: dto.required,
		configuredBySpell: dto.configuredBySpell,
		overrideAllowed: dto.overrideAllowed,
		defaultValue: dto.defaultValue,
		defaultTargetConfig: dto.defaultTargetConfig
			? mapTargetConfigDto(dto.defaultTargetConfig)
			: null,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function mapTargetConfigDto(
	dto: SpellMechanicTargetConfigDto
): SpellMechanicTargetConfig {
	return {
		name: dto.name || 'Цель',
		source: isTargetSource(dto.source) ? dto.source : 'selected',
		relation: isTargetRelation(dto.relation) ? dto.relation : 'enemy',
		countMode: isTargetCountMode(dto.countMode) ? dto.countMode : 'one',
		countValueMode: isTargetCountValueMode(dto.countValueMode)
			? dto.countValueMode
			: 'fixed',
		countValue: dto.countValue ?? 1,
		countFormula: dto.countFormula ?? '',
		targetCountParameterId: dto.targetCountParameterId ?? '',
		isRequired: dto.isRequired ?? true
	};
}

function isTargetSource(value: string): value is SpellMechanicTargetSource {
	return value === 'caster' || value === 'selected' || value === 'area';
}

function isTargetRelation(value: string): value is SpellMechanicTargetRelation {
	return value === 'self' || value === 'any' || value === 'enemy' || value === 'ally';
}

function isTargetCountMode(value: string): value is SpellMechanicTargetCountMode {
	return value === 'one' || value === 'all' || value === 'upTo' || value === 'exact';
}

function isTargetCountValueMode(
	value: string | undefined
): value is SpellMechanicTargetCountValueMode {
	return value === 'fixed' || value === 'formula' || value === 'parameter';
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
