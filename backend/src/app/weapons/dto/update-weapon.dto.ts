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

export class UpdateWeaponAttackProfileIntentDto {
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

export class UpdateWeaponAttackProfileDto {
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
	@Type(() => UpdateWeaponAttackProfileIntentDto)
	intents?: UpdateWeaponAttackProfileIntentDto[];
}

export class UpdateWeaponDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsUUID()
	templateId?: string;

	@IsOptional()
	@IsUUID()
	skillId?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	extraDamage?: number;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateWeaponAttackProfileDto)
	attackProfiles?: UpdateWeaponAttackProfileDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
