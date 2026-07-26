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
import { CreatureNaturalAttackDto } from './creature-natural-attack.dto';
import { CreatureTierActionDto, CreatureTierDto } from './creature-tier.dto';

export class CreateCreatureDto {
	@IsString()
	name!: string;

	@IsUUID()
	typeId!: string;

	@IsOptional()
	@IsUUID()
	anatomySchemeId?: string | null;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierDto)
	tiers!: CreatureTierDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureAnatomyZoneDto)
	anatomyZones?: CreatureAnatomyZoneDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureNaturalAttackDto)
	naturalAttacks?: CreatureNaturalAttackDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierActionDto)
	actions?: CreatureTierActionDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
