import { Type } from 'class-transformer';
import {
	IsArray,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	ValidateNested
} from 'class-validator';
import { SystemValueBaseSourceType } from '@prisma/generated';

class UpdateCurveRangeDto {
	@IsString()
	id!: string;

	@IsNumber()
	from!: number;

	@IsNumber()
	to!: number;

	@IsNumber()
	result!: number;
}

class UpdateGraphNodeDto {
	@IsString()
	id!: string;

	@IsString()
	kind!: string;

	@IsNumber()
	x!: number;

	@IsNumber()
	y!: number;

	@IsOptional()
	@IsString()
	sourceValueId?: string | null;

	@IsOptional()
	@IsNumber()
	constantValue?: number;

	@IsOptional()
	@IsString()
	operation?: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateCurveRangeDto)
	curveRanges?: UpdateCurveRangeDto[];
}

class UpdateGraphEdgeDto {
	@IsString()
	id!: string;

	@IsString()
	source!: string;

	@IsString()
	target!: string;

	@IsOptional()
	@IsString()
	sourceHandle?: string;

	@IsOptional()
	@IsString()
	targetHandle?: string;
}

class UpdateCalculationGraphDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateGraphNodeDto)
	nodes!: UpdateGraphNodeDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateGraphEdgeDto)
	edges!: UpdateGraphEdgeDto[];
}

export class UpdateSystemValueCalculationDto {
	@IsEnum(SystemValueBaseSourceType)
	baseSourceType!: SystemValueBaseSourceType;

	@IsOptional()
	@ValidateNested()
	@Type(() => UpdateCalculationGraphDto)
	calculationGraph!: UpdateCalculationGraphDto | null;
}
