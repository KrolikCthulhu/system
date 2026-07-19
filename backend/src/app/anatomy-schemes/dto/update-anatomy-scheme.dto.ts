import {
	IsArray,
	IsBoolean,
	IsInt,
	IsOptional,
	IsString,
	Min,
	ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnatomySchemeZoneDto } from './anatomy-scheme-zone.dto';

export class UpdateAnatomySchemeDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => AnatomySchemeZoneDto)
	zones?: AnatomySchemeZoneDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
