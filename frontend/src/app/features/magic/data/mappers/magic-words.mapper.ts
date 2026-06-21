import {
	MagicSpellFormula,
	MagicWord,
	MagicWordsCatalog
} from '../../domain/magic-word.models';
import {
	Spell,
	SpellCatalog,
	SpellRuntimePreview,
	SpellTargetConfig,
	SpellTargetCountMode,
	SpellTargetCountValueMode,
	SpellTargetRelation,
	SpellTargetSource
} from '../../domain/spell.models';
import {
	MagicSpellFormulaDto,
	MagicSpellFormulasResponseDto,
	MagicWordDto,
	MagicWordsResponseDto,
	SpellCatalogResponseDto,
	SpellDto,
	SpellRuntimePreviewDto,
	SpellTargetConfigDto
} from '../dto/magic-words.dto';

export function mapMagicWordsResponseDto(
	dto: MagicWordsResponseDto
): MagicWordsCatalog {
	return {
		words: dto.words.map(mapMagicWordDto)
	};
}

export function mapMagicSpellFormulasResponseDto(
	dto: MagicSpellFormulasResponseDto
) {
	return {
		formulas: dto.formulas.map(mapMagicSpellFormulaDto)
	};
}

export function mapSpellCatalogResponseDto(
	dto: SpellCatalogResponseDto
): SpellCatalog {
	return {
		groups: dto.groups.map(group => ({
			key: group.key,
			action: group.action,
			essence: group.essence,
			label: group.label,
			formulas: group.formulas.map(formula => ({
				key: formula.key,
				action: formula.action,
				essence: formula.essence,
				gesture: formula.gesture,
				status: formula.status,
				isActive: formula.isActive,
				spell: formula.spell ? mapSpellDto(formula.spell) : null
			}))
		}))
	};
}

export function mapMagicWordDto(dto: MagicWordDto): MagicWord {
	return {
		id: dto.id,
		type: dto.type,
		name: dto.name,
		description: dto.description ?? '',
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		allowedGestureIds: dto.allowedGestureIds ?? [],
		allowedGestures: dto.allowedGestures ?? [],
		skillIds: dto.skillIds ?? [],
		skills: dto.skills ?? [],
		damageTypeIds: dto.damageTypeIds ?? [],
		damageTypes: dto.damageTypes ?? [],
		conditionIds: dto.conditionIds ?? [],
		conditions: dto.conditions ?? [],
		essenceProfile: dto.essenceProfile
			? {
					damageAffinity: dto.essenceProfile.damageAffinity,
					rangeAffinity: dto.essenceProfile.rangeAffinity,
					controlAffinity: dto.essenceProfile.controlAffinity,
					durationAffinity: dto.essenceProfile.durationAffinity,
					areaAffinity: dto.essenceProfile.areaAffinity,
					stabilityAffinity: dto.essenceProfile.stabilityAffinity
			  }
			: null,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function mapMagicSpellFormulaDto(dto: MagicSpellFormulaDto): MagicSpellFormula {
	return {
		actionId: dto.actionId,
		actionName: dto.actionName,
		essenceId: dto.essenceId,
		essenceName: dto.essenceName,
		name: dto.name
	};
}

export function mapSpellDto(dto: SpellDto): Spell {
	return {
		id: dto.id,
		actionId: dto.actionId,
		essenceId: dto.essenceId,
		gestureId: dto.gestureId,
		name: dto.name,
		description: dto.description ?? '',
		status: dto.status,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		formulaName: dto.formulaName,
		action: dto.action,
		essence: dto.essence,
		gesture: dto.gesture,
		targetConfigs: (dto.targetConfigs ?? []).map(mapSpellTargetConfigDto),
		mechanicBlocks: (dto.mechanicBlocks ?? []).map(block => ({
			id: block.id,
			mechanicId: block.mechanicId,
			parameterValues: block.parameterValues ?? {},
			config: block.config ?? {},
			isActive: block.isActive,
			sortOrder: block.sortOrder,
			createdAt: block.createdAt,
			updatedAt: block.updatedAt
		})),
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

export function mapSpellRuntimePreviewDto(
	dto: SpellRuntimePreviewDto
): SpellRuntimePreview {
	return {
		spell: dto.spell,
		status: dto.status,
		pendingRolls: dto.pendingRolls,
		pendingChoices: dto.pendingChoices ?? [],
		effects: dto.effects,
		actionResults: dto.actionResults,
		trace: dto.trace,
		logs: dto.logs
	};
}

function mapSpellTargetConfigDto(dto: SpellTargetConfigDto): SpellTargetConfig {
	return {
		id: dto.id,
		name: dto.name,
		source: isSpellTargetSource(dto.source) ? dto.source : 'selected',
		relation: isSpellTargetRelation(dto.relation) ? dto.relation : 'any',
		countMode: isSpellTargetCountMode(dto.countMode) ? dto.countMode : 'one',
		countValueMode: isSpellTargetCountValueMode(dto.countValueMode)
			? dto.countValueMode
			: 'fixed',
		countValue: dto.countValue ?? 1,
		countFormula: dto.countFormula ?? '',
		targetCountParameterId: dto.targetCountParameterId ?? '',
		isRequired: dto.isRequired ?? true,
		sortOrder: dto.sortOrder ?? 0
	};
}

function isSpellTargetSource(value: string): value is SpellTargetSource {
	return value === 'caster' || value === 'selected' || value === 'area';
}

function isSpellTargetRelation(value: string): value is SpellTargetRelation {
	return value === 'self' || value === 'any' || value === 'enemy' || value === 'ally';
}

function isSpellTargetCountMode(value: string): value is SpellTargetCountMode {
	return value === 'one' || value === 'all' || value === 'upTo' || value === 'exact';
}

function isSpellTargetCountValueMode(
	value: string | undefined
): value is SpellTargetCountValueMode {
	return value === 'fixed' || value === 'formula' || value === 'parameter';
}
