import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min,
	ValidateNested
} from 'class-validator';

export class WeaponTemplateAttackProfileIntentDto {
	@IsUUID()
	combatIntentId!: string;

	@IsOptional()
	@IsInt()
	costModifier?: number;

	@IsOptional()
	@IsInt()
	damageModifier?: number;

	@IsOptional()
	@IsString()
	ruleText?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class WeaponTemplateAttackProfileDto {
	@IsOptional()
	@IsUUID()
	id?: string;

	@IsIn(['melee', 'ranged'])
	kind!: 'melee' | 'ranged';

	@IsString()
	name!: string;

	@IsUUID()
	skillId!: string;

	@IsOptional()
	@IsUUID()
	characteristicId?: string;

	@IsInt()
	@Min(0)
	baseCost!: number;

	@IsInt()
	@Min(0)
	baseDamage!: number;

	@IsInt()
	@Min(1)
	rangeMeters!: number;

	@IsBoolean()
	usesAmmo!: boolean;

	@IsOptional()
	@IsBoolean()
	canBeParried?: boolean;

	@IsOptional()
	@IsArray()
	@IsUUID(undefined, { each: true })
	damageTypeIds?: string[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => WeaponTemplateAttackProfileIntentDto)
	intents?: WeaponTemplateAttackProfileIntentDto[];
}

export class CreateWeaponTemplateDto {
	@IsString()
	name!: string;

	@IsUUID()
	skillId!: string;

	@IsInt()
	@Min(0)
	handsMin!: number;

	@IsInt()
	@Min(0)
	handsMax!: number;

	@IsInt()
	@Min(0)
	defaultHands!: number;

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
