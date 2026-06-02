import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsInt,
	IsObject,
	IsOptional,
	IsString,
	Min,
	ValidateNested
} from 'class-validator';
import { RollConsequenceValueDto } from './roll-consequence-value.dto';

export class CreateRollConsequenceDto {
	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsObject()
	rollEventGraph?: Record<string, unknown> | null;

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
	@Type(() => RollConsequenceValueDto)
	values?: RollConsequenceValueDto[];
}
