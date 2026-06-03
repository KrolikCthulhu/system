import {
	MagicSpellFormula,
	MagicWord,
	MagicWordsCatalog
} from '../../domain/magic-word.models';
import {
	Spell,
	SpellCatalog
} from '../../domain/spell.models';
import {
	MagicSpellFormulaDto,
	MagicSpellFormulasResponseDto,
	MagicWordDto,
	MagicWordsResponseDto,
	SpellCatalogResponseDto,
	SpellDto
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
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
