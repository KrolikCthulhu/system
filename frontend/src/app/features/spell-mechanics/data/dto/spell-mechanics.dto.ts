export interface SpellMechanicCategoryDto {
	id: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface SpellMechanicDto {
	id: string;
	categoryId: string;
	name: string;
	description: string;
	configSchema: Record<string, unknown>;
	textTemplate: string;
	parameters: SpellMechanicParameterDto[];
	actions: SpellMechanicActionDto[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export type SpellMechanicParameterKindDto =
	| 'target'
	| 'skill'
	| 'number'
	| 'formula'
	| 'damageType'
	| 'condition'
	| 'systemValue'
	| 'text';

export type SpellMechanicParameterDefaultValueModeDto =
	| 'empty'
	| 'static'
	| 'fromMagicWord';

export interface SpellMechanicParameterDefaultValueDto {
	mode: SpellMechanicParameterDefaultValueModeDto;
	value: string;
}

export interface SpellMechanicParameterDto {
	id: string;
	mechanicId: string;
	name: string;
	kind: SpellMechanicParameterKindDto;
	required: boolean;
	configuredBySpell: boolean;
	overrideAllowed: boolean;
	defaultValue: SpellMechanicParameterDefaultValueDto;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export type SpellMechanicActionKindDto =
	| 'roll'
	| 'check'
	| 'comparison'
	| 'calculation'
	| 'branch'
	| 'valueChange'
	| 'conditionAdd'
	| 'conditionRemove'
	| 'text'
	| 'custom';

export interface SpellMechanicActionDto {
	id: string;
	mechanicId: string;
	name: string;
	kind: SpellMechanicActionKindDto;
	config: Record<string, unknown>;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface SpellMechanicsCatalogResponseDto {
	categories: SpellMechanicCategoryDto[];
	mechanics: SpellMechanicDto[];
}

export interface CreateSpellMechanicCategoryDto {
	name: string;
	description?: string;
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateSpellMechanicCategoryDto {
	name?: string;
	description?: string;
	isActive?: boolean;
	sortOrder?: number;
}

export interface CreateSpellMechanicDto {
	categoryId: string;
	name: string;
	description?: string;
	configSchema?: Record<string, unknown>;
	textTemplate?: string;
	isActive?: boolean;
	sortOrder?: number;
	parameters?: SpellMechanicParameterCommandDto[];
	actions?: SpellMechanicActionCommandDto[];
}

export interface UpdateSpellMechanicDto {
	categoryId?: string;
	name?: string;
	description?: string;
	configSchema?: Record<string, unknown>;
	textTemplate?: string;
	isActive?: boolean;
	sortOrder?: number;
	parameters?: SpellMechanicParameterCommandDto[];
	actions?: SpellMechanicActionCommandDto[];
}

export interface SpellMechanicParameterCommandDto {
	id?: string;
	name: string;
	kind: SpellMechanicParameterKindDto;
	required: boolean;
	configuredBySpell: boolean;
	overrideAllowed: boolean;
	defaultValue: SpellMechanicParameterDefaultValueDto;
	sortOrder?: number;
}

export interface SpellMechanicActionCommandDto {
	id?: string;
	name: string;
	kind: SpellMechanicActionKindDto;
	config?: Record<string, unknown>;
	isActive: boolean;
	sortOrder?: number;
}
