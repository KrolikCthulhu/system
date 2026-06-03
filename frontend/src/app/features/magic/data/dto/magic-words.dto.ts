import { MagicWordType } from '../../domain/magic-word.models';

export interface MagicWordGestureOptionDto {
	id: string;
	name: string;
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
}

export interface UpdateMagicWordDto {
	type?: MagicWordType;
	name?: string;
	description?: string;
	isActive?: boolean;
	sortOrder?: number;
	allowedGestureIds?: string[];
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
}
