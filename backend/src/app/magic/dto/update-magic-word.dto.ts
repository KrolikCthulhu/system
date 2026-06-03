import {
	ArrayUnique,
	IsArray,
	IsBoolean,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min
} from 'class-validator';
import { MagicWordType } from '@prisma/generated';

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
}
