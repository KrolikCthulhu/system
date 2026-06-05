import { MagicWordType } from '../../domain/magic-word.models';

export interface MagicWordGestureOptionDto {
	id: string;
	name: string;
}

export interface MagicWordSkillOptionDto {
	id: string;
	name: string;
	categoryName: string;
}

export interface MagicWordLinkedOptionDto {
	id: string;
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

export interface MagicWordDto {
	id: string;
	type: MagicWordType;
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
	createdAt: string;
	updatedAt: string;
}

export interface MagicWordsResponseDto {
	words: MagicWordDto[];
}

export interface MagicSpellFormulaDto {
	actionId: string;
	actionName: string;
	essenceId: string;
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
}

export type SpellStatusDto = 'DRAFT' | 'TESTING' | 'READY';
export type SpellCatalogStatusDto = 'EMPTY' | SpellStatusDto;

export interface SpellFormulaWordDto {
	id: string;
	name: string;
}

export interface SpellDto {
	id: string;
	actionId: string;
	essenceId: string;
	gestureId: string;
	name: string;
	description: string;
	status: SpellStatusDto;
	isActive: boolean;
	sortOrder: number;
	formulaName: string;
	action: SpellFormulaWordDto;
	essence: SpellFormulaWordDto;
	gesture: SpellFormulaWordDto;
	targetConfigs: SpellTargetConfigDto[];
	mechanicBlocks: SpellMechanicBlockDto[];
	createdAt: string;
	updatedAt: string;
}

export interface SpellTargetConfigDto {
	id: string;
	name: string;
	source: string;
	relation: string;
	countMode: string;
	countValueMode?: string;
	countValue?: number;
	countFormula?: string;
	isRequired?: boolean;
	sortOrder?: number;
}

export interface SpellMechanicBlockDto {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, unknown>;
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
	spell: SpellDto | null;
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
	status: SpellStatusDto;
	isActive?: boolean;
	sortOrder?: number;
	targetConfigs?: SpellTargetConfigDto[];
	mechanicBlocks?: SaveSpellMechanicBlockDto[];
}

export interface SaveSpellMechanicBlockDto {
	id?: string;
	mechanicId: string;
	parameterValues?: Record<string, unknown>;
	isActive?: boolean;
	sortOrder?: number;
}
