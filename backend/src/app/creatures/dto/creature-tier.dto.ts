import {
	IsArray,
	IsBoolean,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	Min,
	ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreatureTierCharacteristicDto } from './creature-tier-characteristic.dto';
import { CreatureTierSkillDto } from './creature-tier-skill.dto';

export class CreatureTierDto {
	@IsInt()
	@Min(1)
	@Max(5)
	tier!: number;

	@IsString()
	name!: string;

	@IsInt()
	@Min(1)
	hp!: number;

	@IsOptional()
	@IsUUID()
	sizeId?: string | null;

	@IsOptional()
	@IsUUID()
	armorPresetId?: string | null;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierSkillDto)
	skills!: CreatureTierSkillDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierCharacteristicDto)
	characteristics!: CreatureTierCharacteristicDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
