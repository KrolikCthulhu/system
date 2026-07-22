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

export class NaturalAttackProfileIntentDto {
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

export class NaturalAttackProfileDto {
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

	@IsOptional()
	@IsBoolean()
	usesAmmo?: boolean;

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
	@Type(() => NaturalAttackProfileIntentDto)
	intents?: NaturalAttackProfileIntentDto[];
}

export class CreateNaturalAttackDto {
	@IsString()
	name!: string;

	@IsUUID()
	skillId!: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => NaturalAttackProfileDto)
	attackProfiles?: NaturalAttackProfileDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
