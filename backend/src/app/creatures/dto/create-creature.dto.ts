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
import { CreatureTierDto } from './creature-tier.dto';

export class CreateCreatureDto {
	@IsString()
	name!: string;

	@IsUUID()
	typeId!: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierDto)
	tiers!: CreatureTierDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
