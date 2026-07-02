import { Type } from 'class-transformer';
import {
	IsBoolean,
	IsIn,
	IsInt,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	Min,
	ValidateNested
} from 'class-validator';

export const spellMechanicParameterKinds = [
	'target',
	'skill',
	'number',
	'formula',
	'damageType',
	'condition',
	'systemValue',
	'text'
] as const;

export const spellMechanicParameterDefaultModes = [
	'empty',
	'static',
	'fromMagicWord'
] as const;

export const spellMechanicNumericRoles = [
	'damage',
	'range',
	'duration',
	'area',
	'targetCount',
	'custom'
] as const;

export const spellMechanicParameterScopes = [
	'caster',
	'target',
	'spell',
	'effect',
	'environment'
] as const;

export type SpellMechanicParameterKindDto =
	(typeof spellMechanicParameterKinds)[number];
export type SpellMechanicParameterDefaultModeDto =
	(typeof spellMechanicParameterDefaultModes)[number];
export type SpellMechanicNumericRoleDto =
	(typeof spellMechanicNumericRoles)[number];
export type SpellMechanicParameterScopeDto =
	(typeof spellMechanicParameterScopes)[number];

export class SpellMechanicParameterDefaultValueDto {
	@IsIn(spellMechanicParameterDefaultModes)
	mode!: SpellMechanicParameterDefaultModeDto;

	@IsString()
	value!: string;
}

export class SpellMechanicTargetConfigDto {
	@IsString()
	name!: string;

	@IsString()
	source!: string;

	@IsString()
	relation!: string;

	@IsString()
	countMode!: string;

	@IsOptional()
	@IsString()
	countValueMode?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	countValue?: number;

	@IsOptional()
	@IsString()
	countFormula?: string;

	@IsOptional()
	@IsString()
	targetCountParameterId?: string;

	@IsOptional()
	@IsBoolean()
	isRequired?: boolean;
}

export class SpellMechanicParameterDto {
	@IsOptional()
	@IsUUID()
	id?: string;

	@IsString()
	name!: string;

	@IsIn(spellMechanicParameterKinds)
	kind!: SpellMechanicParameterKindDto;

	@IsOptional()
	@IsIn(spellMechanicNumericRoles)
	numericRole?: SpellMechanicNumericRoleDto;

	@IsOptional()
	@IsIn(spellMechanicParameterScopes)
	scope?: SpellMechanicParameterScopeDto;

	@IsBoolean()
	required!: boolean;

	@IsBoolean()
	configuredBySpell!: boolean;

	@IsBoolean()
	overrideAllowed!: boolean;

	@ValidateNested()
	@Type(() => SpellMechanicParameterDefaultValueDto)
	defaultValue!: SpellMechanicParameterDefaultValueDto;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SpellMechanicTargetConfigDto)
	defaultTargetConfig?: SpellMechanicTargetConfigDto | null;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
