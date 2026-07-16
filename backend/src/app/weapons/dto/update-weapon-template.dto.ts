import { Type } from 'class-transformer';
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
import { WeaponTemplateAttackProfileDto } from './create-weapon-template.dto';

export class UpdateWeaponTemplateDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsUUID()
	skillId?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	handsMin?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	handsMax?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	defaultHands?: number;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => WeaponTemplateAttackProfileDto)
	attackProfiles?: WeaponTemplateAttackProfileDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
