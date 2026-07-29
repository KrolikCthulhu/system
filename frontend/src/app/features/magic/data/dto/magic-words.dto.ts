import { AreaShapeKind, MagicWordType } from '../../domain/magic-word.models';
import {
	SpellConfig,
	SpellMechanicBlockConfig
} from '../../domain/spell.models';

export interface MagicWordGestureOptionDto {
	id: string;
	slug: string;
	name: string;
}

export interface MagicWordSkillOptionDto {
	id: string;
	slug: string;
	name: string;
	categoryName: string;
}

export interface MagicWordLinkedOptionDto {
	id: string;
	slug: string;
	name: string;
}

export interface MagicWordEssenceProfileDto {
	damageAffinity: number;
	rangeAffinity: number;
	controlAffinity: number;
	durationAffinity: number;
	areaAffinity: number;
	stabilityAffinity: number;
}

export interface MagicWordAreaShapeDto {
	kind: AreaShapeKind;
	name: string;
	description: string;
	dimensions: unknown;
	influenceConfig: unknown;
	isActive: boolean;
	sortOrder: number;
}

export interface MagicWordDto {
	id: string;
	type: MagicWordType;
	slug: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	allowedGestureIds: string[];
	allowedGestures: MagicWordGestureOptionDto[];
	skillIds: string[];
	skills: MagicWordSkillOptionDto[];
	damageTypeIds: string[];
	damageTypes: MagicWordLinkedOptionDto[];
	conditionIds: string[];
	conditions: MagicWordLinkedOptionDto[];
	essenceProfile: MagicWordEssenceProfileDto | null;
	areaShape: MagicWordAreaShapeDto | null;
	createdAt: string;
	updatedAt: string;
}

export interface MagicWordsResponseDto {
	words: MagicWordDto[];
}

export interface MagicSpellFormulaDto {
	actionId: string;
	actionSlug: string;
	actionName: string;
	essenceId: string;
	essenceSlug: string;
	essenceName: string;
	name: string;
}

export interface MagicSpellFormulasResponseDto {
	formulas: MagicSpellFormulaDto[];
}

export interface CreateMagicWordDto {
	type: MagicWordType;
	name: string;
	description?: string;
	isActive?: boolean;
	sortOrder?: number;
	allowedGestureIds?: string[];
	skillIds?: string[];
	damageTypeIds?: string[];
	conditionIds?: string[];
	essenceProfile?: MagicWordEssenceProfileDto;
	areaShape?: MagicWordAreaShapeDto;
}

export interface UpdateMagicWordDto {
	type?: MagicWordType;
	name?: string;
	description?: string;
	isActive?: boolean;
	sortOrder?: number;
	allowedGestureIds?: string[];
	skillIds?: string[];
	damageTypeIds?: string[];
	conditionIds?: string[];
	essenceProfile?: MagicWordEssenceProfileDto;
	areaShape?: MagicWordAreaShapeDto;
}

export type SpellStatusDto = 'DRAFT' | 'TESTING' | 'READY';
export type SpellCatalogStatusDto = 'EMPTY' | SpellStatusDto;

export interface SpellFormulaWordDto {
	id: string;
	slug: string;
	name: string;
}

export interface SpellDto {
	id: string;
	actionId: string;
	essenceId: string;
	gestureId: string;
	name: string;
	description: string;
	config?: SpellConfig;
	status: SpellStatusDto;
	isActive: boolean;
	sortOrder: number;
	formulaName: string;
	action: SpellFormulaWordDto;
	essence: SpellFormulaWordDto;
	gesture: SpellFormulaWordDto;
	targetConfigs: SpellTargetConfigDto[];
	textBlocks: SpellTextBlockDto[];
	mechanicBlocks: SpellMechanicBlockDto[];
	createdAt: string;
	updatedAt: string;
}

export interface SpellSummaryDto {
	id: string;
	actionId: string;
	essenceId: string;
	gestureId: string;
	name: string;
	status: SpellStatusDto;
	isActive: boolean;
	sortOrder: number;
	formulaName: string;
	action: SpellFormulaWordDto;
	essence: SpellFormulaWordDto;
	gesture: SpellFormulaWordDto;
	createdAt: string;
	updatedAt: string;
}

export interface SpellTextBlockDto {
	id: string;
	kind: string;
	text?: string;
	mechanicBlockId?: string;
	isActive?: boolean;
	sortOrder?: number;
}

export interface SpellTargetConfigDto {
	id?: string;
	slug?: string;
	name: string;
	source: string;
	relation: string;
	countMode: string;
	countValueMode?: string;
	countValue?: number;
	countFormula?: string;
	targetCountParameterId?: string;
	isRequired?: boolean;
	sortOrder?: number;
}

export interface SpellMechanicBlockDto {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, unknown>;
	config: SpellMechanicBlockConfig;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface SpellFormulaCandidateDto {
	key: string;
	action: SpellFormulaWordDto;
	essence: SpellFormulaWordDto;
	gesture: SpellFormulaWordDto;
	status: SpellCatalogStatusDto;
	isActive: boolean;
	spell: SpellSummaryDto | null;
}

export interface SpellFormulaGroupDto {
	key: string;
	action: SpellFormulaWordDto;
	essence: SpellFormulaWordDto;
	label: string;
	formulas: SpellFormulaCandidateDto[];
}

export interface SpellCatalogResponseDto {
	groups: SpellFormulaGroupDto[];
}

export interface SaveSpellDto {
	actionId?: string;
	essenceId?: string;
	gestureId?: string;
	name: string;
	description?: string;
	config?: SpellConfig;
	status: SpellStatusDto;
	isActive?: boolean;
	sortOrder?: number;
	targetConfigs?: SpellTargetConfigDto[];
	textBlocks?: SpellTextBlockDto[];
	mechanicBlocks?: SaveSpellMechanicBlockDto[];
}

export interface SaveSpellMechanicBlockDto {
	id?: string;
	mechanicId: string;
	parameterValues?: Record<string, unknown>;
	config?: SpellMechanicBlockConfig;
	isActive?: boolean;
	sortOrder?: number;
}

export interface SpellRuntimePreviewRequestDto {
	inputValues?: Record<string, number>;
	rollResults?: Record<string, number>;
	choiceResults?: Record<string, string>;
}

export interface SpellRuntimePreviewDto {
	spell: {
		id: string;
		name: string;
		formulaName: string;
	};
	status: 'BLOCKED' | 'WAITING_FOR_ROLLS' | 'WAITING_FOR_CHOICE' | 'COMPLETED';
	pendingRolls: SpellRuntimePendingRollDto[];
	pendingChoices: SpellRuntimePendingChoiceDto[];
	effects: SpellRuntimeEffectDto[];
	actionResults: Record<string, Record<string, unknown>>;
	trace: SpellRuntimeTraceEntryDto[];
	logs: string[];
}

export interface SpellRuntimePendingRollDto {
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	resultName: string;
	actor: unknown;
	skill: unknown;
	optional: boolean;
}

export interface SpellRuntimePendingChoiceDto {
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	resultName: string;
	sourceValue: number;
	options: Array<{
		id: string;
		requirement: 'automatic' | 'successes';
		threshold: number;
		name: string;
		description: string;
	}>;
}

export interface SpellRuntimeEffectDto {
	kind: 'valueChange' | 'conditionAdd' | 'conditionRemove' | 'text';
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	target?: unknown;
	systemValueId?: string | null;
	systemValueName?: string | null;
	operation?: string;
	amount?: number;
	conditionId?: string | null;
	duration?: number | null;
	text?: string;
}

export interface SpellRuntimeTraceEntryDto {
	id: string;
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	actionKind: string;
	status: 'executed' | 'pending';
	message: string;
	results: Record<string, unknown>;
	children: SpellRuntimeTraceEntryDto[];
}
