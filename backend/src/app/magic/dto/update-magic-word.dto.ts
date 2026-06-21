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
import { AreaShapeKind, MagicWordType } from '@prisma/generated';

export class MagicWordEssenceProfileUpdateDto {
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

export class MagicWordAreaShapeUpdateDto {
	@IsEnum(AreaShapeKind)
	kind!: AreaShapeKind;

	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	dimensions?: unknown;

	@IsOptional()
	influenceConfig?: unknown;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class UpdateMagicWordDto {
	@IsOptional()
	@IsEnum(MagicWordType)
	type?: MagicWordType;

	@IsOptional()
	@IsString()
	name?: string;

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
	@Type(() => MagicWordEssenceProfileUpdateDto)
	essenceProfile?: MagicWordEssenceProfileUpdateDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => MagicWordAreaShapeUpdateDto)
	areaShape?: MagicWordAreaShapeUpdateDto;
}
