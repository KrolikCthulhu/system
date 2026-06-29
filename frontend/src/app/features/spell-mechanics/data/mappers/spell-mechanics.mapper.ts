import {
	SpellMechanicCategoryDto,
	SpellMechanicDto,
	SpellMechanicsCatalogResponseDto
} from '../dto/spell-mechanics.dto';
import {
	SpellMechanic,
	SpellMechanicAction,
	SpellMechanicActionKind,
	SpellMechanicParameter,
	SpellMechanicParameterDefaultValueMode,
	SpellMechanicParameterKind,
	SpellMechanicParameterScope,
	SpellMechanicNumericRole,
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
		slug: dto.slug,
		name: dto.name,
		description: dto.description ?? '',
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

export function mapSpellMechanicDto(dto: SpellMechanicDto): SpellMechanic {
	return {
		id: dto.id,
		categoryId: dto.categoryId,
		slug: dto.slug,
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
		slug: dto.slug,
		name: dto.name,
		kind: mapParameterKind(dto.kind),
		numericRole: mapNumericRole(dto.numericRole),
		scope: mapParameterScope(dto.scope),
		required: dto.required,
		configuredBySpell: dto.configuredBySpell,
		overrideAllowed: dto.overrideAllowed,
		defaultValue: {
			mode: mapDefaultValueMode(dto.defaultValue.mode),
			value: dto.defaultValue.value
		},
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
	return (
		value === 'self' || value === 'any' || value === 'enemy' || value === 'ally'
	);
}

function isTargetCountMode(
	value: string
): value is SpellMechanicTargetCountMode {
	return (
		value === 'one' || value === 'all' || value === 'upTo' || value === 'exact'
	);
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
		kind: mapActionKind(dto.kind),
		config: dto.config ?? {},
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function mapParameterKind(value: string): SpellMechanicParameterKind {
	switch (value) {
		case 'TARGET':
		case 'target':
			return 'target';
		case 'SKILL':
		case 'skill':
			return 'skill';
		case 'NUMBER':
		case 'number':
			return 'number';
		case 'FORMULA':
		case 'formula':
			return 'formula';
		case 'DAMAGE_TYPE':
		case 'damageType':
			return 'damageType';
		case 'CONDITION':
		case 'condition':
			return 'condition';
		case 'SYSTEM_VALUE':
		case 'systemValue':
			return 'systemValue';
		case 'TEXT':
		case 'text':
			return 'text';
		default:
			return 'text';
	}
}

function mapNumericRole(value: string | undefined): SpellMechanicNumericRole {
	switch (value) {
		case 'DAMAGE':
		case 'damage':
			return 'damage';
		case 'RANGE':
		case 'range':
			return 'range';
		case 'DURATION':
		case 'duration':
			return 'duration';
		case 'AREA':
		case 'area':
			return 'area';
		case 'TARGET_COUNT':
		case 'targetCount':
			return 'targetCount';
		default:
			return 'custom';
	}
}

function mapParameterScope(
	value: string | undefined
): SpellMechanicParameterScope {
	switch (value) {
		case 'CASTER':
		case 'caster':
			return 'caster';
		case 'TARGET':
		case 'target':
			return 'target';
		case 'EFFECT':
		case 'effect':
			return 'effect';
		case 'ENVIRONMENT':
		case 'environment':
			return 'environment';
		default:
			return 'spell';
	}
}

function mapDefaultValueMode(
	value: string
): SpellMechanicParameterDefaultValueMode {
	switch (value) {
		case 'STATIC':
		case 'static':
			return 'static';
		case 'FROM_MAGIC_WORD':
		case 'fromMagicWord':
			return 'fromMagicWord';
		default:
			return 'empty';
	}
}

function mapActionKind(value: string): SpellMechanicActionKind {
	switch (value) {
		case 'ROLL':
		case 'roll':
			return 'roll';
		case 'CHECK':
		case 'check':
			return 'check';
		case 'COMPARISON':
		case 'comparison':
			return 'comparison';
		case 'CALCULATION':
		case 'calculation':
			return 'calculation';
		case 'BRANCH':
		case 'branch':
			return 'branch';
		case 'EFFECT_SCALE':
		case 'effectScale':
			return 'effectScale';
		case 'VALUE_CHANGE':
		case 'valueChange':
			return 'valueChange';
		case 'CONDITION_ADD':
		case 'conditionAdd':
			return 'conditionAdd';
		case 'CONDITION_REMOVE':
		case 'conditionRemove':
			return 'conditionRemove';
		case 'TEXT':
		case 'text':
			return 'text';
		default:
			return 'custom';
	}
}

export function mapSpellMechanicsCatalogResponseDto(
	dto: SpellMechanicsCatalogResponseDto
): SpellMechanicsCatalog {
	return {
		categories: dto.categories.map(mapSpellMechanicCategoryDto),
		mechanics: dto.mechanics.map(mapSpellMechanicDto)
	};
}
