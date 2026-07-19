import {
	IsArray,
	IsBoolean,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min,
	ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreatureAnatomyZoneDto } from './creature-anatomy-zone.dto';
import { CreatureTierDto } from './creature-tier.dto';

export class UpdateCreatureDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsUUID()
	typeId?: string;

	@IsOptional()
	@IsUUID()
	anatomySchemeId?: string | null;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierDto)
	tiers?: CreatureTierDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureAnatomyZoneDto)
	anatomyZones?: CreatureAnatomyZoneDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
