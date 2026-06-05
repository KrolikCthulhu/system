import {
	ArrayUnique,
	IsArray,
	IsBoolean,
	IsEnum,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	Min,
	ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { MagicWordType } from '@prisma/generated';

export class MagicWordEssenceProfileDto {
	@IsNumber()
	@Min(0)
	@Max(1)
	damageAffinity!: number;

	@IsNumber()
	@Min(0)
	@Max(1)
	rangeAffinity!: number;

	@IsNumber()
	@Min(0)
	@Max(1)
	controlAffinity!: number;

	@IsNumber()
	@Min(0)
	@Max(1)
	durationAffinity!: number;

	@IsNumber()
	@Min(0)
	@Max(1)
	areaAffinity!: number;

	@IsNumber()
	@Min(0)
	@Max(1)
	stabilityAffinity!: number;
}

export class CreateMagicWordDto {
	@IsEnum(MagicWordType)
	type!: MagicWordType;

	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;

	@IsOptional()
	@IsArray()
	@ArrayUnique()
	@IsUUID('4', { each: true })
	allowedGestureIds?: string[];

	@IsOptional()
	@IsArray()
	@ArrayUnique()
	@IsUUID('4', { each: true })
	skillIds?: string[];

	@IsOptional()
	@IsArray()
	@ArrayUnique()
	@IsUUID('4', { each: true })
	damageTypeIds?: string[];

	@IsOptional()
	@IsArray()
	@ArrayUnique()
	@IsUUID('4', { each: true })
	conditionIds?: string[];

	@IsOptional()
	@ValidateNested()
	@Type(() => MagicWordEssenceProfileDto)
	essenceProfile?: MagicWordEssenceProfileDto;
}
