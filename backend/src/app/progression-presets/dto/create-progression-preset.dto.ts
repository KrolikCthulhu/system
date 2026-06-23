import { ProgressionPresetKind } from '@prisma/generated';
import {
	IsBoolean,
	IsEnum,
	IsInt,
	IsObject,
	IsOptional,
	IsString,
	Min
} from 'class-validator';

export class CreateProgressionPresetDto {
	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsEnum(ProgressionPresetKind)
	kind!: ProgressionPresetKind;

	@IsObject()
	config!: Record<string, unknown>;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
