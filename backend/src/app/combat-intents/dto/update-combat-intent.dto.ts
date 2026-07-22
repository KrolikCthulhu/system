import {
	IsArray,
	IsBoolean,
	IsInt,
	IsObject,
	IsOptional,
	IsString,
	Min,
	ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { CombatIntentTextBlockDto } from './create-combat-intent.dto';

export class UpdateCombatIntentDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsObject()
	mechanic?: Record<string, unknown>;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CombatIntentTextBlockDto)
	textBlocks?: CombatIntentTextBlockDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
