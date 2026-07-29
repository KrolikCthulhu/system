import {
	AreaShapeDimensions,
	AreaShapeInfluenceConfig,
	MagicSpellFormula,
	MagicWord,
	MagicWordsCatalog
} from '../../domain/magic-word.models';
import {
	Spell,
	SpellCatalog,
	SpellRuntimePreview,
	SpellSummary,
	SpellTextBlock,
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
	SpellSummaryDto,
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
				spell: formula.spell ? mapSpellSummaryDto(formula.spell) : null
			}))
		}))
	};
}

export function mapMagicWordDto(dto: MagicWordDto): MagicWord {
	return {
		id: dto.id,
		type: dto.type,
		slug: dto.slug,
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
		areaShape: dto.areaShape
			? {
					kind: dto.areaShape.kind,
					name: dto.areaShape.name,
					description: dto.areaShape.description ?? '',
					dimensions: normalizeAreaShapeDimensions(dto.areaShape.dimensions),
					influenceConfig: normalizeAreaShapeInfluenceConfig(
						dto.areaShape.influenceConfig
					),
					isActive: dto.areaShape.isActive,
					sortOrder: dto.areaShape.sortOrder
				}
			: null,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function normalizeAreaShapeDimensions(value: unknown): AreaShapeDimensions {
	if (!isRecord(value)) {
		return createDefaultAreaShapeDimensions();
	}

	const baseValue = value['base'];
	const base: Record<string, number> = {};

	if (isRecord(baseValue)) {
		for (const [key, item] of Object.entries(baseValue)) {
			if (typeof item === 'number' && Number.isFinite(item)) {
				base[key] = item;
			}
		}
	}

	return {
		version: 1,
		primaryDimension:
			typeof value['primaryDimension'] === 'string'
				? value['primaryDimension']
				: 'radius',
		unit: typeof value['unit'] === 'string' ? value['unit'] : 'm',
		base,
		orientation:
			value['orientation'] === 'horizontal' ||
			value['orientation'] === 'vertical' ||
			value['orientation'] === 'free'
				? value['orientation']
				: undefined,
		tileSize:
			typeof value['tileSize'] === 'number' &&
			Number.isFinite(value['tileSize'])
				? value['tileSize']
				: undefined
	};
}

function normalizeAreaShapeInfluenceConfig(
	value: unknown
): AreaShapeInfluenceConfig {
	if (!isRecord(value) || !Array.isArray(value['sources'])) {
		return { version: 1, sources: [] };
	}

	return {
		version: 1,
		sources: value['sources'].filter(isRecord).map(source => ({
			sourceKind:
				source['sourceKind'] === 'systemValue' ||
				source['sourceKind'] === 'linkedSkill' ||
				source['sourceKind'] === 'essenceProfile'
					? source['sourceKind']
					: 'systemValue',
			sourceKey:
				typeof source['sourceKey'] === 'string' ? source['sourceKey'] : '',
			targetDimension:
				typeof source['targetDimension'] === 'string'
					? source['targetDimension']
					: 'radius',
			weight:
				typeof source['weight'] === 'number' &&
				Number.isFinite(source['weight'])
					? source['weight']
					: 0
		}))
	};
}

function createDefaultAreaShapeDimensions(): AreaShapeDimensions {
	return {
		version: 1,
		primaryDimension: 'radius',
		unit: 'm',
		base: {}
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapMagicSpellFormulaDto(dto: MagicSpellFormulaDto): MagicSpellFormula {
	return {
		actionId: dto.actionId,
		actionSlug: dto.actionSlug,
		actionName: dto.actionName,
		essenceId: dto.essenceId,
		essenceSlug: dto.essenceSlug,
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
		config: isRecord(dto.config) ? dto.config : {},
		status: dto.status,
		isActive: dto.isActive,
		sortOrder: dto.sortOrder,
		formulaName: dto.formulaName,
		action: dto.action,
		essence: dto.essence,
		gesture: dto.gesture,
		targetConfigs: (dto.targetConfigs ?? []).map(mapSpellTargetConfigDto),
		textBlocks: (dto.textBlocks ?? []).map(mapSpellTextBlockDto),
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

export function mapSpellSummaryDto(dto: SpellSummaryDto): SpellSummary {
	return {
		id: dto.id,
		actionId: dto.actionId,
		essenceId: dto.essenceId,
		gestureId: dto.gestureId,
		name: dto.name,
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

function mapSpellTextBlockDto(dto: {
	id: string;
	kind: string;
	text?: string;
	mechanicBlockId?: string;
	isActive?: boolean;
	sortOrder?: number;
}): SpellTextBlock {
	return {
		id: dto.id,
		kind: dto.kind === 'mechanicText' ? 'mechanicText' : 'text',
		text: dto.text ?? '',
		mechanicBlockId: dto.mechanicBlockId ?? '',
		isActive: dto.isActive ?? true,
		sortOrder: dto.sortOrder ?? 0
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
		id: dto.id ?? dto.slug ?? '',
		slug: dto.slug ?? '',
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
	return (
		value === 'self' || value === 'any' || value === 'enemy' || value === 'ally'
	);
}

function isSpellTargetCountMode(value: string): value is SpellTargetCountMode {
	return (
		value === 'one' || value === 'all' || value === 'upTo' || value === 'exact'
	);
}

function isSpellTargetCountValueMode(
	value: string | undefined
): value is SpellTargetCountValueMode {
	return value === 'fixed' || value === 'formula' || value === 'parameter';
}
