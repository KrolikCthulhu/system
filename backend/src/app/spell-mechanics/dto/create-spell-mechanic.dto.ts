import {
	IsArray,
	IsBoolean,
	IsInt,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	Min,
	ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { SpellMechanicActionDto } from './spell-mechanic-action.dto';
import { SpellMechanicParameterDto } from './spell-mechanic-parameter.dto';

export class CreateSpellMechanicDto {
	@IsUUID()
	categoryId!: string;

	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsObject()
	configSchema?: Record<string, unknown>;

	@IsOptional()
	@IsString()
	textTemplate?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SpellMechanicParameterDto)
	parameters?: SpellMechanicParameterDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SpellMechanicActionDto)
	actions?: SpellMechanicActionDto[];
}
