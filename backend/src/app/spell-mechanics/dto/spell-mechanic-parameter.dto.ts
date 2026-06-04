import { Type } from 'class-transformer';
import {
	IsBoolean,
	IsIn,
	IsInt,
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

export type SpellMechanicParameterKindDto =
	(typeof spellMechanicParameterKinds)[number];
export type SpellMechanicParameterDefaultModeDto =
	(typeof spellMechanicParameterDefaultModes)[number];

export class SpellMechanicParameterDefaultValueDto {
	@IsIn(spellMechanicParameterDefaultModes)
	mode!: SpellMechanicParameterDefaultModeDto;

	@IsString()
	value!: string;
}

export class SpellMechanicParameterDto {
	@IsOptional()
	@IsUUID()
	id?: string;

	@IsString()
	name!: string;

	@IsIn(spellMechanicParameterKinds)
	kind!: SpellMechanicParameterKindDto;

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
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
